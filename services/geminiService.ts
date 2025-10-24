import type { Paper, ComparisonResult, KGData, ComparisonPoint } from '../types';

// The prefix for all our serverless function endpoints
const API_FUNCTION_PREFIX = '/.netlify/functions';

/**
 * A utility to handle the network response from a Netlify Function.
 * It parses the JSON and throws a user-friendly error if the request failed.
 * @param response The standard Fetch API Response object.
 * @returns The parsed JSON body from the function's response.
 */
const handleNetlifyResponse = async (response: Response): Promise<any> => {
    // Check if the response is empty, which can cause JSON parsing errors
    const text = await response.text();
    if (!text) {
        if (!response.ok) {
             throw new Error(`Request failed with status ${response.status}: The server returned an empty response.`);
        }
        return null; // Handle cases where an empty 2xx response is valid
    }

    const data = JSON.parse(text);

    if (!response.ok) {
        const status = response.status;
        // Use the error message provided by the serverless function
        const details = data.error || "An unknown serverless error occurred.";
        console.error(`Netlify Function Error (${status}):`, details);

        // Create a more user-friendly error message
        if (status === 503 || status === 429) {
            throw new Error("The AI service is temporarily overloaded. Please try again in a few moments.");
        }
        throw new Error(`Request failed: ${details}`);
    }
    return data;
};


/**
 * Performs a live search for scholarly articles by calling the secure Netlify Function.
 * @param query The user's search query.
 * @param systematic A boolean indicating if systematic review mode is active.
 * @returns A promise that resolves to an array of Paper objects.
 */
export const deepSemanticSearch = async (query: string, systematic: boolean): Promise<Paper[]> => {
    const endpoint = `${API_FUNCTION_PREFIX}/deepSemanticSearch`;
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, systematic }),
        });

        const papers = await handleNetlifyResponse(response);

        if (!Array.isArray(papers)) {
            console.error("API function did not return a valid array.", papers);
            throw new Error("Received invalid data from the server.");
        }
        return papers.map((paper, index) => ({ ...paper, id: paper.id || `${Date.now()}-${index}` })) as Paper[];

    } catch (error) {
        console.error("Error calling deepSemanticSearch function:", error);
        throw error;
    }
};

/**
 * Compares a list of selected papers by calling the secure Netlify Function.
 * @param papers An array of Paper objects to compare.
 * @returns A promise that resolves to a ComparisonResult object.
 */
export const comparePapers = async (papers: Paper[]): Promise<ComparisonResult> => {
    const endpoint = `${API_FUNCTION_PREFIX}/comparePapers`;
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ papers }),
        });

        const rawResult = await handleNetlifyResponse(response);

        // The UI expects a different data structure, so we transform it here on the client.
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

    } catch (error) {
        console.error("Error calling comparePapers function:", error);
        throw error;
    }
};

/**
 * Generates knowledge graph data by calling the secure Netlify Function.
 * @param papers An array of Paper objects.
 * @returns A promise that resolves to KGData.
 */
export const generateKnowledgeGraphData = async (papers: Paper[]): Promise<KGData> => {
    const endpoint = `${API_FUNCTION_PREFIX}/generateKnowledgeGraphData`;
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ papers }),
        });
        return await handleNetlifyResponse(response);
    } catch (error) {
        console.error("Error calling generateKnowledgeGraphData function:", error);
        throw error;
    }
};

/**
 * Suggests broader research topics by calling the secure Netlify Function.
 * @param query The initial search query.
 * @param results The papers found in the initial search.
 * @returns A promise that resolves to an array of topic strings.
 */
export const suggestBroaderTopics = async (query: string, results: Paper[]): Promise<string[]> => {
    if (results.length === 0) return [];
    const endpoint = `${API_FUNCTION_PREFIX}/suggestBroaderTopics`;
    const paperTitles = results.map(p => p.title).join(', ');

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, paperTitles }),
        });
        return await handleNetlifyResponse(response);
    } catch (error) {
        console.error("Error calling suggestBroaderTopics function:", error);
        throw error;
    }
};
