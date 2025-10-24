import { Type, GenerateContentResponse } from "@google/genai";
import type { Paper, ComparisonResult, KGData, ComparisonPoint } from '../types';

// NOTE: All direct API initialization (GoogleGenAI, process.env.API_KEY, callApiWithRetry)
// has been REMOVED from this file. The logic now uses simple fetch to secure endpoints.

const API_FUNCTION_PREFIX = '/.netlify/functions';

/**
 * Helper function to extract a JSON string from a markdown code block.
 * (Retained for parsing Netlify Function response bodies if needed, but simplified)
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
 * A utility to handle the network response from the Netlify Function.
 * @param response The standard Fetch Response object.
 * @returns The parsed JSON body.
 */
const handleNetlifyResponse = async (response: Response): Promise<any> => {
    const data = await response.json();

    if (!response.ok) {
        const status = response.status;
        const details = data.details || data.error || "An unknown serverless error occurred.";
        console.error(`Netlify Function Error (${status}):`, details);

        // Throw a user-friendly error based on the status code
        if (status === 503 || status === 429) {
            throw new Error("The AI service is temporarily overloaded or unavailable. Please try again in a few moments.");
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
    console.log(`Calling secure search endpoint for "${query}", systematic: ${systematic}`);

    const endpoint = `${API_FUNCTION_PREFIX}/deepSemanticSearch`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, systematic }),
        });

        const papers = await handleNetlifyResponse(response);

        if (!Array.isArray(papers)) {
            console.error("Endpoint did not return a valid array.", papers);
            return [];
        }

        // Add a simple unique ID if the function doesn't provide one
        return papers.map((paper, index) => ({ ...paper, id: paper.id || `${Date.now()}-${index}` })) as Paper[];

    } catch (error) {
        console.error("Error during deep semantic search:", error);
        throw error;
    }
};


/**
 * Compares a list of selected papers by calling the secure Netlify Function.
 * @param papers An array of Paper objects to compare.
 * @returns A promise that resolves to a ComparisonResult object.
 */
export const comparePapers = async (papers: Paper[]): Promise<ComparisonResult> => {
    console.log(`Calling secure comparison endpoint for ${papers.length} papers.`);
    const endpoint = `${API_FUNCTION_PREFIX}/comparePapers`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ papers }),
        });

        const rawResult = await handleNetlifyResponse(response);

        // Transform the data back to the structure the UI expects (Logic retained for client transformation)
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
        console.error("Error during paper comparison:", error);
        throw error;
    }
};

/**
 * Generates knowledge graph data by calling the secure Netlify Function.
 * @param papers An array of Paper objects.
 * @returns A promise that resolves to KGData.
 */
export const generateKnowledgeGraphData = async (papers: Paper[]): Promise<KGData> => {
    console.log(`Calling secure knowledge graph endpoint for ${papers.length} papers.`);
    const endpoint = `${API_FUNCTION_PREFIX}/generateKnowledgeGraphData`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ papers }),
        });

        return await handleNetlifyResponse(response);
    } catch (error) {
        console.error("Error during KG data generation:", error);
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
    console.log(`Calling secure topic suggestion endpoint.`);
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
        console.error("Error during topic suggestions:", error);
        throw error;
    }
};