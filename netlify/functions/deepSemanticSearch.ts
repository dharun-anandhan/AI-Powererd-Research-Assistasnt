import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { callApiWithRetry, processApiResponse } from "./utils/geminiClient";
import { returnError } from "./utils/apiHelpers";
import { GoogleGenAI } from "@google/genai";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (event.httpMethod !== 'POST') {
        return returnError(405, 'Method Not Allowed');
    }

    try {
        const { query, systematic } = JSON.parse(event.body || '{}');
        if (!query) {
            return returnError(400, 'Query parameter is required.');
        }

        // FIX: The GoogleGenAI constructor expects an object with an apiKey property.
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

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
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.1,
            }
        }));

        const papers = processApiResponse(result);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(papers),
        };

    } catch (error: any) {
        console.error("Error in deepSemanticSearch function:", error);
        return returnError(500, error.message || "An internal server error occurred.");
    }
};

export { handler };