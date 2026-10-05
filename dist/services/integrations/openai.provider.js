"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
class OpenAIProvider {
    apiKey;
    constructor(credentials) {
        this.apiKey = credentials.apiKey;
    }
    async testConnection() {
        if (!this.apiKey) {
            throw new Error('OpenAI API key missing');
        }
        // Real implementation would make a lightweight request like listing models
        return true;
    }
    async generateResponse(prompt, context) {
        // Real implementation uses openai npm package
        console.log(`[OPENAI] Generating response for prompt`);
        return {
            text: "Simulated AI reply",
            gradeSnapshot: { score: 85, letterGrade: 'A' },
            extractedData: { address: null, price: null }
        };
    }
}
exports.OpenAIProvider = OpenAIProvider;
