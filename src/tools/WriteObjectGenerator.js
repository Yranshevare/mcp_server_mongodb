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
    //     "collection": "<collection_name>",
    //     "operation": "insertOne" | "insertMany",
    //     "insert": [{ "<field>": <value> }]
    // }

    const successObj = z.object({
        collection: z.string(),
        operation: z.enum(["insertOne", "insertMany"]),
        insert: z.array(
            z.object({
                field: z.string(),
                value: z.union([z.string(), z.number(), z.array(z.union([z.string(), z.number()]))]),
            })
        ),
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

const WriteObjectGenerator = new Tool("WriteObjectGenerator", description, toolInputSchema, handler);

export default WriteObjectGenerator;


/*
input: i want to test my notification schema so add one dummy notification with some dummy data 

output:
{
  "collection": "Notification",
  "operation": "insertOne",
  "insert": [
    {
      "field": "status",
      "value": "PENDING"
    },
    {
      "field": "fromName",
      "value": "Test User"
    },
    {
      "field": "fromPhone",
      "value": "1234567890"
    },
    {
      "field": "fromAddress",
      "value": "Test Address, Test City"
    },
    {
      "field": "totalPrice",
      "value": "250.00"
    },
    {
      "field": "products",
      "value": [
        "productId",
        "60c72b2f9b1e8e001c8e4d2b",
        "quantity",
        1,
        "price",
        "250.00"
      ]
    }
  ]
}
*/