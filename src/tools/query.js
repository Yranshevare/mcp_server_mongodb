import { z } from "zod";
import Tool from "../util/tools.js";
import { llm } from "../lib/llm.js";
import { humanMessage, systemMessages } from "../lib/message.js";

const inputSchema = {
    inputSchema: z.string(),
    Query: z.string(),
};

async function handler({ inputSchema, Query }) {
    const UpdatedUserMessage = await humanMessage.generateQuery({ SCHEMA_JSON: inputSchema, NATURAL_LANGUAGE_QUERY:Query })
    const message = [
        systemMessages.generateQuery, 
        UpdatedUserMessage
    ];
    // console.log(message);
    const response = await llm.invoke(message);

    return { content:[{type: "text", text: `Hello, from demo tool! ${response.content}`}] };
}

const Query = new Tool("userQuery", "perform CRUD operations on db", inputSchema, handler);

export default Query;
