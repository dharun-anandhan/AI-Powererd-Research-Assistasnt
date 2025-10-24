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
        if (!papers || !Array.isArray(papers) || papers.length < 2) {
            return returnError(400, 'At least two papers are required for comparison.');
        }

        // FIX: The GoogleGenAI constructor expects an object with an apiKey property.
        const ai = new GoogleGenAI({apiKey: process.env.API_KEY!});

        const paperDetails = papers.map(p => 
            `Paper ID: ${p.id}\nTitle: ${p.title}\nAuthors: ${p.authors.join(', ')}\nYear: ${p.year}\nAbstract: ${p.abstract}`
        ).join('\n\n---\n\n');

        const prompt = `
            You are a research assistant. Analyze and compare the following academic papers.
            **Papers:**\n${paperDetails}\n
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

        const responseSchema = {
            type: Type.OBJECT,
            properties: {
                comparison: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { aspect: { type: Type.STRING }, papers: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { paperId: { type: Type.STRING }, value: { type: Type.STRING }, confidenceScore: { type: Type.NUMBER }, sourceSentence: { type: Type.STRING } } } } } } },
                overallSynthesis: { type: Type.STRING },
                researchGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
                hypothesis: { type: Type.STRING }
            },
            required: ["comparison", "overallSynthesis", "researchGaps", "hypothesis"]
        };

        const result = await callApiWithRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: responseSchema, temperature: 0.2 }
        }));
        
        const comparisonData = processApiResponse(result);

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(comparisonData),
        };

    } catch (error: any) {
        console.error("Error in comparePapers function:", error);
        return returnError(500, error.message || "An internal server error occurred.");
    }
};

export { handler };