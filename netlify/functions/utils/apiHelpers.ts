/**
 * Returns a structured error response for the Netlify Function.
 * @param statusCode The HTTP status code.
 * @param message The error message.
 * @returns A formatted response object for the serverless function.
 */
export const returnError = (statusCode: number, message: string) => {
    return {
        statusCode,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: message }),
    };
};
