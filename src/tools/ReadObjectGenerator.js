import { z } from "zod";
import Tool from "../util/tools.js";
import { humanMessage, systemMessages } from "../lib/message.js";
import { structuredLlm } from "../lib/llm.js";

const toolInputSchema = {
    inputSchema: z.string(),
    Query: z.string(),
};

async function handler({ inputSchema, Query }) {
    const UpdatedUserMessage = await humanMessage.generateQuery({ SCHEMA_JSON: inputSchema, NATURAL_LANGUAGE_QUERY: Query });
    const message = [systemMessages.readPlanner, UpdatedUserMessage];

    // {
    //   "collection": "<collection_name>",
    //   "operation": "find" | "findOne" | "count" | "aggregate",
    //   "filters": [
    //     { "field": "<field>", "operator": "eq|ne|gt|gte|lt|lte|in", "value": <value> }
    //   ],
    //   "projection": ["field"],
    //   "sort": { "<field>": "asc|desc" },
    //   "limit": <number>
    // }

    const successObj = z.object({
        collection: z.string(),
        operation: z.enum(["find", "findOne", "count", "aggregate"]),
        filters: z
            .array(
                z.object({
                    field: z.string(),
                    operator: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "in"]),
                    value: z.any(), // allows number, string, array
                })
            )
            .optional(),
        projection: z.array(z.string()).optional(),
        sort: z.record(z.string(), z.enum(["asc", "desc"])).optional(),
        limit: z.number().int().positive().optional(),
    });

    const failObj = z.object({
        Error: z.string(),
    });

    const resObj = z.union([successObj, failObj]);

    const structuredLlmInstance = structuredLlm(resObj);
    const result = await structuredLlmInstance.generate(message);
    return result;
}

const description =
    "takes user natural language query as an input, to generate the structured JSON query plan, which will later be used to query the database.";

const ReadObjectGenerator = new Tool("ReadObjectGenerator", description, toolInputSchema, handler);

export default ReadObjectGenerator;
