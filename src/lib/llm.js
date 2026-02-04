import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import "dotenv/config";

const llm = new ChatGoogleGenerativeAI({
    model: "models/gemini-2.5-flash",   //model you wanna use
    apiKey: process.env.GEMINI_API_KEY,        // your api key
});

function structuredLlm(schema) {
    return llm.withStructuredOutput(schema);
}

export { llm, structuredLlm };