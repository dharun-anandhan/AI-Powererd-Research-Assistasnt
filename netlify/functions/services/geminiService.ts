import { GoogleGenAI, Type } from "@google/genai";
import type { Paper, ComparisonData, GraphData } from "../types";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API_KEY environment variable not set. Using a placeholder. Please provide a valid API key for the app to function.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY || 'MISSING_API_KEY' });
const model = "gemini-2.5-flash";

/**
 * A robust JSON parser that extracts JSON code blocks from a string.
 * @param text The text response from the model.
 * @returns The parsed JSON object.
 */
function parseGeminiJson<T>(text: string): T {
    // Find the first and last curly braces to extract the JSON object
    const startIndex = text.indexOf('{');
    const endIndex = text.lastIndexOf('}');
    if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
        const jsonString = text.substring(startIndex, endIndex + 1);
        try {
            return JSON.parse(jsonString) as T;
        } catch (e) {
            console.error("Failed to parse extracted JSON string:", jsonString);
            throw new Error("Received malformed JSON data from the API.");
        }
    }
    // Fallback for array-based JSON
    const startBracket = text.indexOf('[');
    const endBracket = text.lastIndexOf(']');
    if (startBracket !== -1 && endBracket !== -1 && endBracket > startBracket) {
        const jsonString = text.substring(startBracket, endBracket + 1);
        try {
            return JSON.parse(jsonString) as T;
        } catch (e) {
            console.error("Failed to parse extracted JSON array:", jsonString);
            throw new Error("Received malformed JSON data from the API.");
        }
    }
    console.error("Failed to find any JSON object in the response:", text);
    throw new Error("No valid JSON found in the API response.");
}


const searchSchema = {
  type: Type.OBJECT,
  properties: {
    papers: {
      type: Type.ARRAY,
      description: "A list of 5-7 relevant fictional research papers.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "A unique slug-style ID, e.g., 'vaswani-2017-attention'." },
          name: { type: Type.STRING, description: "The full, realistic title of the paper." },
          content: { type: Type.STRING, description: "A one-paragraph abstract for the paper." },
        },
        required: ["id", "name", "content"],
      },
    },
    suggestedTopics: {
      type: Type.ARRAY,
      description: "A list of 3-5 related keywords or topics for further exploration.",
      items: { type: Type.STRING },
    },
  },
  required: ["papers", "suggestedTopics"],
};

const comparisonSchema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: "A concise title for the comparison, based on the user's query." },
    papers: {
      type: Type.ARRAY,
      description: "An array of the paper names being compared.",
      items: { type: Type.STRING }
    },
    comparison: {
      type: Type.ARRAY,
      description: "An array of objects, where each object represents a point of comparison (a concept).",
      items: {
        type: Type.OBJECT,
        properties: {
          concept: { type: Type.STRING, description: "The core idea or concept being compared (e.g., 'Model Architecture', 'Key Innovation', 'Methodology')." },
          summary: { type: Type.STRING, description: "A one-sentence overall summary of how the papers relate on this concept." },
        },
        required: ["concept", "summary"],
      },
    },
  },
  required: ["title", "papers", "comparison"],
};


const knowledgeGraphSchema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      description: "An array of nodes in the knowledge graph.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Unique identifier for the node (e.g., 'transformer_arch')." },
          group: { type: Type.STRING, description: "Category of the node, e.g., 'concept', 'paper', 'method', 'author'." },
          label: { type: Type.STRING, description: "Display name for the node (e.g., 'Transformer Architecture')." },
          paperId: { type: Type.STRING, description: "Optional ID of the paper this node originates from (e.g., 'paper_1')." }
        },
        required: ["id", "group", "label"],
      },
    },
    links: {
      type: Type.ARRAY,
      description: "An array of links connecting the nodes.",
      items: {
        type: Type.OBJECT,
        properties: {
          source: { type: Type.STRING, description: "ID of the source node." },
          target: { type: Type.STRING, description: "ID of the target node." },
          value: { type: Type.NUMBER, description: "Strength of the connection (1-10)." },
          label: { type: Type.STRING, description: "Description of the relationship (e.g., 'introduced in', 'builds upon')." }
        },
        required: ["source", "target", "value", "label"],
      },
    },
  },
  required: ["nodes", "links"],
};

export const searchForPapers = async (query: string): Promise<{ papers: Paper[], suggestedTopics: string[] }> => {
  const prompt = `You are an AI assistant for a scholarly discovery system. A user has searched for the topic: "${query}". 
  Your task is to generate a list of 5-7 relevant fictional research papers. For each paper, provide a unique ID, a realistic title, and a one-paragraph abstract. 
  Also, provide a list of 3-5 related keywords or topics that the user might find interesting for further exploration. 
  Respond in the specified JSON format.`;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: searchSchema,
    },
  });

  return parseGeminiJson(response.text);
};

export const summarizePaper = async (paper: Paper): Promise<string> => {
  const prompt = `Provide a detailed, one-paragraph academic abstract for the following paper:
  Title: "${paper.name}"
  Content: "${paper.content}"`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text.trim();
}

export const getStructuredComparison = async (query: string, papers: Paper[]): Promise<ComparisonData> => {
  const paperContent = papers.map(p => `Paper: ${p.name}\nContent: ${p.content}`).join('\n\n---\n\n');
  const prompt = `
    Analyze the following research papers based on the user query: "${query}".
    
    Provided Papers:
    ${paperContent}
    
    Your task is to generate a structured comparison. For each key concept relevant to the query (like Methodology, Model Architecture, Dataset, Key Results), provide a concise summary from each paper. Ensure you include a "summary" field that gives a brief, one-sentence overview for each concept. The keys for each paper's summary should be the paper's name.
    
    Return the result in a JSON format matching the provided schema.
  `;
  
  const dynamicComparisonSchema = JSON.parse(JSON.stringify(comparisonSchema));
  const itemProperties = dynamicComparisonSchema.properties.comparison.items.properties;
  papers.forEach(p => {
    itemProperties[p.name] = { type: Type.STRING, description: `Summary from the paper '${p.name}'.` };
  });

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: dynamicComparisonSchema,
    },
  });

  return parseGeminiJson(response.text);
};


export const getKnowledgeGraphData = async (query: string, papers: Paper[]): Promise<GraphData> => {
   const paperContent = papers.map(p => `Paper ID: ${p.id}\nPaper Name: ${p.name}\nContent: ${p.content}`).join('\n\n---\n\n');
   const prompt = `
    Based on the user query "${query}" and the content of the following research papers, generate data for a knowledge graph.
    
    Provided Papers:
    ${paperContent}
    
    Identify key concepts, methods, and their relationships within and between the papers. Create nodes for each paper, and for the most important concepts/methods. Create links to represent relationships like "introduces", "builds upon", "is a type of", etc. Make sure nodes representing papers use the 'paper' group and their ID is the original paper ID from the provided content (e.g., '${papers[0]?.id}').
    
    Return the result in a JSON format matching the provided schema.
  `;
  
  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: knowledgeGraphSchema,
    },
  });
  
  return parseGeminiJson(response.text);
};


export const getDetailedReport = async (query: string, papers: Paper[]): Promise<string> => {
  const paperContent = papers.map(p => `Paper: ${p.name}\nContent: ${p.content}`).join('\n\n---\n\n');
  const prompt = `
    Based on the user query "${query}", provide a detailed comparative report of the following research papers.
    
    Provided Papers:
    ${paperContent}

    The report should be well-structured, written in an academic tone, and use markdown for formatting (e.g., headings, bold text, bullet points). Structure the report with the following level 2 headings (##):

    1.  **Introduction**: A brief overview of the research area and the papers' context.
    2.  **Comparative Analysis**: A comparison of their methodologies, architectures, and key innovations. Use bullet points or sub-headings to compare specific features.
    3.  **Key Findings & Contributions**: A discussion of their main results and impact on the field. Use bullet points to list the key findings for each paper.
    4.  **Synthesis & Conclusion**: A concluding summary of their respective strengths, weaknesses, and how they relate to each other in the context of the user's query.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text.trim();
}

export const getKeyInsights = async (query: string, papers: Paper[]): Promise<string> => {
  const paperContent = papers.map(p => `Paper: ${p.name}\nContent: ${p.content}`).join('\n\n---\n\n');
  const prompt = `
    Based on the user query "${query}", synthesize the key insights and most important takeaways from the following research papers.
    
    Provided Papers:
    ${paperContent}

    Structure your response as follows, using markdown for formatting:
    1.  **Individual Paper Insights**: For each paper, create a section with its title as a level 3 heading (###). Under each heading, provide a bulleted list of the 3-5 most critical insights, findings, or contributions of that paper.
    2.  **Overall Synthesis**: A final section with a level 2 heading (##) that summarizes the collective insights and how they relate to one another.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text.trim();
}

export const getResearchGaps = async (query: string, papers: Paper[]): Promise<string> => {
  const paperContent = papers.map(p => `Paper: ${p.name}\nContent: ${p.content}`).join('\n\n---\n\n');
  const prompt = `
    Based on the user query "${query}", identify the research gaps, limitations, and unanswered questions from the following research papers.
    
    Provided Papers:
    ${paperContent}

    Structure your response as follows:
    1.  **Individual Gaps**: For each paper, create a section with its title as a heading. Under each heading, provide a bulleted list of the specific limitations or areas for future work mentioned or implied in that paper.
    2.  **Collective Gaps**: A final "Emergent Research Directions" section that synthesizes the gaps from all papers to suggest broader, overarching questions or directions for future research in this area.

    Use markdown for formatting.
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
  });

  return response.text.trim();
}