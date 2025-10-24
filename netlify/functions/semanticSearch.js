// netlify/functions/semanticSearch.js

// Using the commonjs structure for Netlify Node functions
const { GoogleGenAI } = require("@google/genai");

// Netlify automatically injects environment variables into process.env 
// for serverless functions, without needing the VITE_ prefix.
if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set in Netlify");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// This handler will be the secure API endpoint
exports.handler = async (event, context) => {
    // 1. Process the incoming request (from your frontend)
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    let data;
    try {
        data = JSON.parse(event.body);
    } catch (e) {
        return { statusCode: 400, body: 'Invalid JSON payload' };
    }

    const { query, systematic } = data;

    // 2. Build the prompt for the Gemini model
    const prompt = `
        You are an expert research assistant. Your task is to find relevant scholarly articles based on a user's query using your search capabilities and return them as a structured JSON array.

        User Query: "${query}"
        
        ${systematic ? "Systematic Review Mode is ON: Prioritize a diverse range of foundational and recent papers to provide a comprehensive overview." : ""}

        **CRITICAL INSTRUCTIONS:**
        1. 	Use your search tool to find 5 to 7 highly relevant academic papers.
        2. 	For each paper, you MUST process the information and generate the required fields. DO NOT copy text directly from the sources.
        3. 	**Abstract Requirement:** You MUST read the paper's abstract from the source and then write a new, concise summary of it in your own words.
        4. 	**TLDR Requirement:** Generate a new, one-sentence "Too Long; Didn't Read" (TLDR) summary for each paper.
        5. 	Format your entire output as a single, valid JSON array of objects. Your response must begin with '[' and end with ']'. Do not include any other text, explanations, or markdown.

        // ... (JSON Object Structure remains the same)
    `;

    // 3. Call the Gemini API securely
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                temperature: 0.1,
            }
        });

        const resultText = response?.candidates?.[0]?.content?.parts?.[0]?.text || '[]';

        // 4. Return the result to the frontend
        return {
            statusCode: 200,
            body: resultText,
            headers: {
                'Content-Type': 'application/json',
            },
        };

    } catch (error) {
        console.error("API call error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "Failed to process AI request.", details: error.message }),
        };
    }
};