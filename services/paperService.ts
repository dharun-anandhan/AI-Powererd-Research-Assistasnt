import { Paper } from '../types';
import { GoogleGenAI } from "@google/genai";

// IMPORTANT: This check is a safeguard.
// The API key should be set in the environment variables.
if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


export const searchPapers = async (query: string): Promise<Paper[]> => {
    const prompt = `You are an expert AI research assistant. Your task is to find up to 7 relevant and significant academic papers based on the user's query.

    User Query: "${query}"

    For each paper found, provide the following details in a JSON object:
    - id: A unique identifier (e.g., arXiv ID or DOI). If unavailable, create a unique slug from the title.
    - title: The full title of the paper.
    - authors: An array of strings with the primary authors' names.
    - year: The publication year as a number.
    - abstract: A concise and informative abstract of the paper.
    - citationCount: The number of citations. If unknown, use 0.
    - tldr: A one-sentence "Too Long; Didn't Read" summary.

    Return your findings as a single JSON array containing these paper objects.
    CRITICAL: Your entire output must be ONLY the raw JSON array. Do not include any introductory text, explanations, or markdown formatting like \`\`\`json\`.`;

    try {
        console.log(`Searching for: ${query} with Gemini`);
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
            },
        });

        // Handle cases where the response is blocked for safety reasons first
        if (response.promptFeedback && response.promptFeedback.blockReason) {
            const { blockReason, safetyRatings } = response.promptFeedback;
            const blockedCategories = safetyRatings?.filter(r => r.blocked).map(r => r.category).join(', ') || 'N/A';
            throw new Error(
                `Search failed because the query was blocked for safety reasons.\nReason: ${blockReason}.\nBlocked Categories: ${blockedCategories}.\nPlease try rephrasing your search.`
            );
        }
        
        // Handle cases where the AI returns no text (e.g., no results found)
        if (!response.text) {
            console.warn("Gemini returned an empty text response. Interpreting as no results found.");
            return [];
        }
        
        const text = response.text;
        
        // **Robust JSON Extraction**
        // Use a regular expression to find a JSON array within the text.
        // This is robust against introductory text, markdown, and other chatter from the AI.
        const jsonMatch = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);

        if (!jsonMatch) {
            console.warn("Could not find a valid JSON array in the AI response. Interpreting as no results. Response:", text);
            return []; // Return empty for a "No papers found" message in the UI
        }

        const jsonStr = jsonMatch[0];

        try {
            const papers: Paper[] = JSON.parse(jsonStr);
            // Final validation to ensure we have an array of objects.
            if (Array.isArray(papers)) {
                return papers;
            }
            console.warn("Parsed data from AI response is not an array. Data:", papers);
            return [];
        } catch (parseError) {
            console.error("Failed to parse extracted JSON from Gemini:", parseError);
            console.error("Extracted string that failed to parse:", jsonStr);
            throw new Error("Search failed: The AI returned a response that could not be understood. Please try again.");
        }

    } catch (error) {
        console.error("Error searching papers with Gemini:", error);
        // Re-throw the error to be handled by the calling UI component
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("An unexpected error occurred during the paper search.");
    }
};