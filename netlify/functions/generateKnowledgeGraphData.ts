import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { callApiWithRetry, processApiResponse } from "./utils/geminiClient";
import { returnError } from "./utils/apiHelpers";
import { GoogleGenAI, Type } from "@google/genai";

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
    if (event.httpMethod !== 'POST') {
        return returnError(405, 'Method Not Allowed');
    }

    try {
        const { papers } = JSON.parse(event.body || '{}');
        if (!papers || !Array.isArray(papers)) {
            return returnError(400, 'Papers array is required.');
        }

        // FIX: The GoogleGenAI constructor expects an object with an apiKey property.
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

        const paperDetails = papers.map(p => `Paper ID ${p.id}: "${p.title}"\nAbstract: ${p.abstract}`).join('\n\n');

        const prompt = `
            You are a knowledge graph extractor. From the provided academic papers, extract key concepts and their relationships.
            **Papers:**\n${paperDetails}\n
            **Instructions:**
            1. Identify papers as primary nodes (use their IDs).
            2. Identify 5-7 core concepts/methods.
            3. Create nodes for each paper and concept.
            4. Create links between papers and concepts they discuss.
            5. Create links between related concepts.
            Provide the output as a single JSON object with "nodes" and "links".
            **Node Schema:** { "id": string, "group": number, "label": string }
            - 'group': Use 1 for papers, 2 for concepts.
            **Link Schema:** { "source": string, "target": string, "value": number }
            - 'value': A number from 1 to 10 for relationship strength.
        `;

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                nodes: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, group: { type: Type.INTEGER }, label: { type: Type.STRING } } } },
                links: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { source: { type: Type.STRING }, target: { type: Type.STRING }, value: { type: Type.NUMBER } } } }
            },
            required: ["nodes", "links"]
        };

        const result = await callApiWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: responseSchema, temperature: 0.3 }
        }));
        
        const kgData = processApiResponse(result);
        
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(kgData),
        };

    } catch (error: any) {
        console.error("Error in generateKnowledgeGraphData function:", error);
        return returnError(500, error.message || "An internal server error occurred.");
    }
};

export { handler };