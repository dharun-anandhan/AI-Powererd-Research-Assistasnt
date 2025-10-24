import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import type { Paper, ComparisonResult, KGData, ComparisonPoint } from '../types';

// --- MODIFICATION 1: Change access method and key name ---
if (!import.meta.env.VITE_API_KEY) {
    throw new Error("VITE_API_KEY environment variable not set");
}

// --- MODIFICATION 2: Initialize with the VITE_ prefixed key ---
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

/**
 * A robust helper to make API calls with automatic retries on overload errors.
 * Uses exponential backoff to wait before retrying.
 * @param apiCall The function that makes the actual API call.
 * @param maxRetries The maximum number of times to retry.
 * @param initialDelay The initial delay in milliseconds.
 * @returns The result of the API call.
 */
const callApiWithRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> => {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            lastError = error as Error;
            // Check for specific overload/unavailable error codes from the API
            if (lastError.message.includes('503') || lastError.message.includes('UNAVAILABLE') || lastError.message.toLowerCase().includes('overloaded')) {
                const delay = initialDelay * Math.pow(2, attempt);
                console.warn(`API call failed (attempt ${attempt + 1}/${maxRetries}), model overloaded. Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                // If it's a different kind of error (e.g., bad request), fail immediately
                throw lastError;
            }
        }
    }
    // If all retries failed, throw a user-friendly error
    throw new Error("The AI model is temporarily unavailable due to high demand. Please try again in a few moments.");
};


/**
 * Helper function to extract a JSON string from a markdown code block.
 * @param text The text response from the model.
 * @returns A clean JSON string.
 */
const extractJson = (text: string): string => {
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    if (match) {
        return match[1];
    }
    const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    return jsonMatch ? jsonMatch[0] : text;
};

/**
 * A robust helper to process responses from the Gemini API.
 * It handles empty/blocked responses and JSON parsing.
 * @param response The GenerateContentResponse from the AI model.
 * @returns The parsed JSON object.
 */
const processApiResponse = (response: GenerateContentResponse): any => {
    // More robustly check for the text part of the response.
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        // Provide a specific error for safety-related blocks.
        const blockReason = response?.promptFeedback?.blockReason;
        if (blockReason) {
            throw new Error(`Request blocked due to safety concerns: ${blockReason}`);
        }
        // Check if there was a finish reason other than STOP
        const finishReason = response?.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== 'STOP') {
            throw new Error(`The AI model stopped generating for an unexpected reason: ${finishReason}. Please try again.`);
        }
        // Provide a more generic error for other empty responses.
        throw new Error("The AI model returned an empty or invalid response. Please try a different query.");
    }

    try {
        const jsonString = extractJson(text.trim());
        return JSON.parse(jsonString);
    } catch (e) {
        console.error("Failed to parse JSON from AI response:", text);
        throw new Error("The AI model returned a malformed response. Could not parse JSON.");
    }
};


/**
 * Performs a live search for scholarly articles using the Gemini model's Google Search tool.
 * @param query The user's search query.
 * @param systematic A boolean indicating if systematic review mode is active.
 * @returns A promise that resolves to an array of Paper objects.
 */
export const deepSemanticSearch = async (query: string, systematic: boolean): Promise<Paper[]> => {
    console.log(`Performing live semantic search for "${query}", systematic: ${systematic}`);

    const prompt = `
        You are an expert research assistant. Your task is to find relevant scholarly articles based on a user's query using your search capabilities and return them as a structured JSON array.

        User Query: "${query}"
        
        ${systematic ? "Systematic Review Mode is ON: Prioritize a diverse range of foundational and recent papers to provide a comprehensive overview." : ""}

        **CRITICAL INSTRUCTIONS:**
        1. 	Use your search tool to find 5 to 7 highly relevant academic papers.
        2. 	For each paper, you MUST process the information and generate the required fields. **DO NOT copy text directly from the sources.** This is to avoid plagiarism.
        3. 	**Abstract Requirement:** You MUST read the paper's abstract from the source and then **write a new, concise summary of it in your own words.** This summary should capture the key points of the original abstract.
        4. 	**TLDR Requirement:** Generate a new, one-sentence "Too Long; Didn't Read" (TLDR) summary for each paper.
        5. 	Format your entire output as a single, valid JSON array of objects. Your response must begin with '[' and end with ']'. Do not include any other text, explanations, or markdown.

        **JSON Object Structure for each paper:**
        {
          "id": "unique_identifier_string",
          "title": "Paper Title",
          "authors": ["Author One", "Author Two"],
          "year": 2023,
          "tldr": "A new, one-sentence summary you generate.",
          "abstract": "A new, concise summary of the abstract that you write yourself."
        }

        Example of a single object:
        {
          "id": "1",
          "title": "Attention Is All You Need",
          "authors": ["Ashish Vaswani", "Noam Shazeer", "Niki Parmar", "Jakob Uszkoreit", "Llion Jones", "Aidan N. Gomez", "Lukasz Kaiser", "Illia Polosukhin"],
          "year": 2017,
          "tldr": "The paper introduces the Transformer, a novel network architecture based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
          "abstract": "This paper presents the Transformer, a novel network architecture designed for sequence transduction tasks. Unlike traditional models that use recurrent or convolutional layers, the Transformer relies exclusively on attention mechanisms to draw global dependencies between input and output. The authors demonstrate that this approach is more parallelizable and requires significantly less time to train, achieving a new state of the art in machine translation quality."
        }
    `;
    
    try {
        const result = await callApiWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.1,
            }
        }));

        const papers = processApiResponse(result);
        
        if (!Array.isArray(papers)) {
            console.error("API did not return a valid array.", papers);
            return [];
        }

        // Add a simple unique ID if the model doesn't provide one
        return papers.map((paper, index) => ({...paper, id: paper.id || `${Date.now()}-${index}`})) as Paper[];

    } catch (error) {
        console.error("Error during deep semantic search:", error);
        // Re-throw the specific error from processApiResponse or a generic one.
        throw error instanceof Error ? error : new Error("Failed to fetch search results from the AI model.");
    }
};


/**
 * Compares a list of selected papers using the Gemini model.
 * @param papers An array of Paper objects to compare.
 * @returns A promise that resolves to a ComparisonResult object.
 */
export const comparePapers = async (papers: Paper[]): Promise<ComparisonResult> => {
    const paperDetails = papers.map(p => 
        `Paper ID: ${p.id}\nTitle: ${p.title}\nAuthors: ${p.authors.join(', ')}\nYear: ${p.year}\nAbstract: ${p.abstract}`
    ).join('\n\n---\n\n');

    const prompt = `
        You are a research assistant. Analyze and compare the following academic papers.
        
        **Papers:**
        ${paperDetails}

        **Instructions:**
        Perform a detailed comparison across: "Methodology", "Key Contribution", "Dataset/Evaluation", and "Limitations".
        For each piece of extracted information, provide:
        1. 'value': The extracted information as a concise string.
        2. 'confidenceScore': A score from 0.0 to 1.0 on accuracy.
        3. 'sourceSentence': The exact sentence from the abstract supporting your extraction.
        
        After comparing, provide:
        1. 'overallSynthesis': A paragraph synthesizing the main findings.
        2. 'researchGaps': A list of potential research gaps.
        3. 'hypothesis': A novel research hypothesis building on these papers.

        Structure your entire response as a single JSON object.
    `;

    const comparisonAspectSchema = {
        type: Type.OBJECT,
        properties: {
            aspect: { type: Type.STRING },
            papers: {
                type: Type.ARRAY,
                description: "An array of comparison points, one for each paper.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        paperId: { type: Type.STRING },
                        value: { type: Type.STRING },
                        confidenceScore: { type: Type.NUMBER },
                        sourceSentence: { type: Type.STRING },
                    },
                    required: ["paperId", "value", "confidenceScore", "sourceSentence"]
                }
            }
        },
        required: ["aspect", "papers"]
    };

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            comparison: {
                type: Type.ARRAY,
                items: comparisonAspectSchema
            },
            overallSynthesis: { type: Type.STRING },
            researchGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            hypothesis: { type: Type.STRING }
        },
        required: ["comparison", "overallSynthesis", "researchGaps", "hypothesis"]
    };

    const result = await callApiWithRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.2,
        }
    }));
    
    const rawResult = processApiResponse(result);

    // Transform the data back to the structure the UI expects
    const transformedComparison = rawResult.comparison.map((aspect: any) => {
        const papersObject: { [paperId: string]: ComparisonPoint } = {};
        aspect.papers.forEach((paperData: any) => {
            papersObject[paperData.paperId] = {
                value: paperData.value,
                confidenceScore: paperData.confidenceScore,
                sourceSentence: paperData.sourceSentence
            };
        });
        return {
            aspect: aspect.aspect,
            papers: papersObject
        };
    });

    return {
        ...rawResult,
        comparison: transformedComparison
    };
};

/**
 * Generates knowledge graph data from a list of papers.
 * @param papers An array of Paper objects.
 * @returns A promise that resolves to KGData.
 */
export const generateKnowledgeGraphData = async (papers: Paper[]): Promise<KGData> => {
    const paperDetails = papers.map(p => 
        `Paper ID ${p.id}: "${p.title}"\nAbstract: ${p.abstract}`
    ).join('\n\n');

    const prompt = `
        You are a knowledge graph extractor. From the provided academic papers, extract key concepts and their relationships.

        **Papers:**
        ${paperDetails}

        **Instructions:**
        1. Identify papers as primary nodes (use their IDs).
        2. Identify 5-7 core concepts/methods (e.g., "Transformers", "Attention Mechanism").
        3. Create nodes for each paper and concept.
        4. Create links between papers and concepts they discuss.
        5. Create links between related concepts.
        
        Provide the output as a single JSON object with "nodes" and "links".

        **Node Schema:** { "id": string, "group": number, "label": string }
        - 'group': Use 1 for papers, 2 for concepts.
        - 'label': A short, display-friendly label.
        
        **Link Schema:** { "source": string, "target": string, "value": number }
        - 'value': A number from 1 to 10 for relationship strength.

        Generate the complete knowledge graph data in JSON format.
    `;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            nodes: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        group: { type: Type.INTEGER },
                        label: { type: Type.STRING }
                    },
                    required: ["id", "group", "label"]
                }
            },
            links: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        source: { type: Type.STRING },
                        target: { type: Type.STRING },
                        value: { type: Type.NUMBER }
                    },
                    required: ["source", "target", "value"]
                }
            }
        },
        required: ["nodes", "links"]
    };

    const result = await callApiWithRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.3,
        }
    }));
    
    return processApiResponse(result);
};

/**
 * Suggests broader research topics based on an initial query and results.
 * @param query The initial search query.
 * @param results The papers found in the initial search.
 * @returns A promise that resolves to an array of topic strings.
 */
export const suggestBroaderTopics = async (query: string, results: Paper[]): Promise<string[]> => {
    if (results.length === 0) return [];
    const paperTitles = results.map(p => p.title).join(', ');
    
    const prompt = `
        Based on the initial search query "${query}" and the paper titles [${paperTitles}], suggest 3-5 related but broader research topics for exploration.

        Return your answer as a JSON array of strings.
        
        Example output: ["History of Neural Networks", "Applications of Language Models in Healthcare", "Ethics in AI"]
    `;
    
    const responseSchema = {
        type: Type.ARRAY,
        items: { type: Type.STRING }
    };
    
    const result = await callApiWithRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        }
    }));
    
    return processApiResponse(result);
};
