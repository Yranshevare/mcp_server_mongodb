import { z } from "zod";
import Tool from "../../util/tools.js";
import { humanMessage, systemMessages } from "../../lib/message.js";
import { structuredLlm } from "../../lib/llm.js";

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
        filters: z.array(
            z.object({
                field: z.string(),
                operator: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "in"]),
                value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
            })
        )
            .optional(),
        projection: z.array(z.string()).optional(),
        sort: z.array(
            z.object({
                field: z.string(),
                order: z.enum(["asc", "desc"]),
            })
        ).optional(),
        limit: z.number().optional(),
    });

    const failObj = z.object({
        Error: z.string(),
    });

    const resObj = z.union([successObj, failObj]);

    const structuredLlmInstance = structuredLlm(resObj);
    const result = await structuredLlmInstance.invoke(message);
    return { content: [{ type: "text", text: `${JSON.stringify(result)}` }] };
    // return result
}

const description =
    "takes user natural language query as an input, to generate the structured JSON query plan, which will later be used to query the database.";

const ReadObjectGenerator = new Tool("ReadObjectGenerator", description, toolInputSchema, handler);

export default ReadObjectGenerator;


/*
input: give me the list of product with category test 2

output:
{
  "collection": "Product",
  "operation": "find",
  "filters": [
    {
      "field": "category",
      "operator": "eq",
      "value": "test 2"
    }
  ],
  "limit": 20
}
*/

/*
input: give me the list of notification who has purchase request for product "Industrial Steel Pipes 1"

output:
{
  "Error": "The query requests notifications for a product specified by name, but the Notification collection stores product IDs. This requires a lookup for the product ID, which cannot be represented in a single query operation with the current output schema."
}

*/

/*
input: give me the list of notification who has purchase request for product 60d0fe4f1c1f1f001c0c0c0d

output:
{
  "collection": "Notification",
  "operation": "find",
  "filters": [
    {
      "field": "products.productId",
      "operator": "eq",
      "value": "60d0fe4f1c1f1f001c0c0c0d"
    }
  ],
  "limit": 20
}

*/