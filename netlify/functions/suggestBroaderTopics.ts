import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { callApiWithRetry, processApiResponse } from "./utils/geminiClient";
import { returnError } from "./utils/apiHelpers";
import { GoogleGenAI, Type } from "@google/genai";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (event.httpMethod !== 'POST') {
        return returnError(405, 'Method Not Allowed');
    }

    try {
        const { query, paperTitles } = JSON.parse(event.body || '{}');
        if (!query || !paperTitles) {
            return returnError(400, 'Query and paperTitles are required.');
        }

        // FIX: The GoogleGenAI constructor expects an object with an apiKey property.
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});
        
        const prompt = `
            Based on the initial search query "${query}" and the paper titles [${paperTitles}], suggest 3-5 related but broader research topics for exploration.
            Return your answer as a JSON array of strings.
            Example output: ["History of Neural Networks", "Applications of Language Models in Healthcare", "Ethics in AI"]
        `;
        
        const responseSchema = { type: Type.ARRAY, items: { type: Type.STRING } };
        
        const result = await callApiWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: responseSchema }
        }));
        
        const topics = processApiResponse(result);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(topics),
        };

    } catch (error: any) {
        console.error("Error in suggestBroaderTopics function:", error);
        return returnError(500, error.message || "An internal server error occurred.");
    }
};

export { handler };