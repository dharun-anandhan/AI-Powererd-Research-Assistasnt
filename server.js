import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

// --- Utility Functions (migrated from Netlify utils) ---

/**
 * A robust helper to make API calls with automatic retries on overload errors.
 */
const callApiWithRetry = async (apiCall, maxRetries = 3, initialDelay = 1000) => {
    let lastError = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            lastError = error;
            if (error.message?.includes('503') || error.message?.includes('UNAVAILABLE') || error.message?.toLowerCase().includes('overloaded')) {
                const delay = initialDelay * Math.pow(2, attempt);
                console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                throw lastError;
            }
        }
    }
    throw new Error("The AI model is temporarily unavailable due to high demand. Please try again later.");
};

/**
 * Helper to extract a JSON string from a markdown code block or plain text.
 */
const extractJson = (text) => {
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    if (match && match[1]) return match[1];
    // Fallback for cases where the model doesn't use markdown
    const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    return jsonMatch ? jsonMatch[0] : text;
};

/**
 * A robust helper to process and parse responses from the Gemini API.
 */
const processApiResponse = (response) => {
    const text = response.text;
    if (!text) {
        const blockReason = response?.promptFeedback?.blockReason;
        if (blockReason) {
            throw new Error(`Request blocked due to safety concerns: ${blockReason}`);
        }
        const finishReason = response?.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== 'STOP') {
            throw new Error(`The AI model stopped generating unexpectedly: ${finishReason}.`);
        }
        throw new Error("The AI model returned an empty response.");
    }

    try {
        const jsonString = extractJson(text.trim());
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON from AI response:", text);
        throw new Error("The AI model returned a malformed response.");
    }
};

const returnError = (res, statusCode, message) => {
    return res.status(statusCode).json({ error: message });
};

// --- Server Setup ---
const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- API Key Check ---
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});


// --- API Routes ---

app.post('/api/deepSemanticSearch', async (req, res) => {
    try {
        const { query, systematic } = req.body;
        if (!query) return returnError(res, 400, 'Query parameter is required.');

        const prompt = `
            You are an expert research assistant. Your task is to find relevant scholarly articles based on a user's query using your search capabilities and return them as a structured JSON array.
            User Query: "${query}"
            ${systematic ? "Systematic Review Mode is ON: Prioritize a diverse range of foundational and recent papers to provide a comprehensive overview." : ""}
            **CRITICAL INSTRUCTIONS:**
            1.  Use your search tool to find 5 to 7 highly relevant academic papers.
            2.  For each paper, you MUST process the information and generate the required fields. **DO NOT copy text directly from the sources.**
            3.  **Abstract Requirement:** You MUST read the paper's abstract from the source and then **write a new, concise summary of it in your own words.**
            4.  **TLDR Requirement:** Generate a new, one-sentence "Too Long; Didn't Read" (TLDR) summary for each paper.
            5.  Format your entire output as a single, valid JSON array of objects, starting with '[' and ending with ']'.
        `;
        
        const result = await callApiWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: { tools: [{ googleSearch: {} }], temperature: 0.1 }
        }));

        const papers = processApiResponse(result);
        res.status(200).json(papers);

    } catch (error) {
        console.error("Error in deepSemanticSearch endpoint:", error);
        returnError(res, 500, error.message || "An internal server error occurred.");
    }
});

app.post('/api/comparePapers', async (req, res) => {
    try {
        const { papers } = req.body;
        if (!papers || !Array.isArray(papers) || papers.length < 2) {
            return returnError(res, 400, 'At least two papers are required for comparison.');
        }

        const paperDetails = papers.map(p => `Paper ID: ${p.id}\nTitle: ${p.title}\nAuthors: ${p.authors.join(', ')}\nYear: ${p.year}\nAbstract: ${p.abstract}`).join('\n\n---\n\n');
        const prompt = `
            You are a research assistant. Analyze and compare the following academic papers.
            **Papers:**\n${paperDetails}\n
            **Instructions:**
            Perform a detailed comparison across: "Methodology", "Key Contribution", "Dataset/Evaluation", and "Limitations".
            For each piece of extracted information, provide: 'value' (concise string), 'confidenceScore' (0.0-1.0), and 'sourceSentence' (exact supporting sentence from abstract).
            After comparing, provide: 'overallSynthesis' (synthesis paragraph), 'researchGaps' (list of gaps), and 'hypothesis' (a novel research hypothesis).
            Structure your entire response as a single JSON object.
        `;
        const responseSchema = { type: Type.OBJECT, properties: { comparison: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { aspect: { type: Type.STRING }, papers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { paperId: { type: Type.STRING }, value: { type: Type.STRING }, confidenceScore: { type: Type.NUMBER }, sourceSentence: { type: Type.STRING } } } } } } }, overallSynthesis: { type: Type.STRING }, researchGaps: { type: Type.ARRAY, items: { type: Type.STRING } }, hypothesis: { type: Type.STRING } }, required: ["comparison", "overallSynthesis", "researchGaps", "hypothesis"] };

        const result = await callApiWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: responseSchema, temperature: 0.2 }
        }));
        
        const comparisonData = processApiResponse(result);
        res.status(200).json(comparisonData);

    } catch (error) {
        console.error("Error in comparePapers endpoint:", error);
        returnError(res, 500, error.message || "An internal server error occurred.");
    }
});

app.post('/api/generateKnowledgeGraphData', async (req, res) => {
    try {
        const { papers } = req.body;
        if (!papers || !Array.isArray(papers)) return returnError(res, 400, 'Papers array is required.');
        
        const paperDetails = papers.map(p => `Paper ID ${p.id}: "${p.title}"\nAbstract: ${p.abstract}`).join('\n\n');
        const prompt = `
            You are a knowledge graph extractor. From the provided academic papers, extract key concepts and their relationships.
            **Papers:**\n${paperDetails}\n
            **Instructions:**
            1. Identify papers as primary nodes (use their IDs). Identify 5-7 core concepts/methods as nodes.
            2. Create links between papers and concepts they discuss, and between related concepts.
            3. Provide the output as a single JSON object with "nodes" and "links".
            **Node Schema:** { "id": string, "group": number (1 for papers, 2 for concepts), "label": string }
            **Link Schema:** { "source": string, "target": string, "value": number (1-10 for strength) }
        `;
        const responseSchema = { type: Type.OBJECT, properties: { nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, group: { type: Type.INTEGER }, label: { type: Type.STRING } } } }, links: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: { type: Type.STRING }, target: { type: Type.STRING }, value: { type: Type.NUMBER } } } } }, required: ["nodes", "links"] };

        const result = await callApiWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: responseSchema, temperature: 0.3 }
        }));
        
        const kgData = processApiResponse(result);
        res.status(200).json(kgData);

    } catch (error) {
        console.error("Error in generateKnowledgeGraphData endpoint:", error);
        returnError(res, 500, error.message || "An internal server error occurred.");
    }
});

app.post('/api/suggestBroaderTopics', async (req, res) => {
    try {
        const { query, paperTitles } = req.body;
        if (!query || !paperTitles) return returnError(res, 400, 'Query and paperTitles are required.');
        
        const prompt = `Based on the initial search query "${query}" and the paper titles [${paperTitles}], suggest 3-5 related but broader research topics for exploration. Return your answer as a JSON array of strings.`;
        const responseSchema = { type: Type.ARRAY, items: { type: Type.STRING } };
        
        const result = await callApiWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: responseSchema }
        }));
        
        const topics = processApiResponse(result);
        res.status(200).json(topics);

    } catch (error) {
        console.error("Error in suggestBroaderTopics endpoint:", error);
        returnError(res, 500, error.message || "An internal server error occurred.");
    }
});

// --- Static file serving and catch-all for client-side routing ---
const staticDistPath = path.join(__dirname, 'dist');
app.use(express.static(staticDistPath));

app.get('*', (req, res) => {
    res.sendFile(path.resolve(staticDistPath, 'index.html'));
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
