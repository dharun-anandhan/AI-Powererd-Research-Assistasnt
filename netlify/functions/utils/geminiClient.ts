import { GenerateContentResponse } from "@google/genai";

/**
 * A robust helper to make API calls with automatic retries on overload errors.
 */
export const callApiWithRetry = async <T>(apiCall: () => Promise<T>, maxRetries = 3, initialDelay = 1000): Promise<T> => {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            return await apiCall();
        } catch (error) {
            lastError = error as Error;
            if (lastError.message.includes('503') || lastError.message.includes('UNAVAILABLE') || lastError.message.toLowerCase().includes('overloaded')) {
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
 * Helper to extract a JSON string from a markdown code block.
 */
const extractJson = (text: string): string => {
    const match = text.match(/```json\n([\s\S]*?)\n```/);
    if (match) return match[1];
    const jsonMatch = text.match(/(\[[\s\S]*\]|\{[\s\S]*\})/);
    return jsonMatch ? jsonMatch[0] : text;
};

/**
 * A robust helper to process and parse responses from the Gemini API.
 */
export const processApiResponse = (response: GenerateContentResponse): any => {
    const text = response?.candidates?.[0]?.content?.parts?.[0]?.text;

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
