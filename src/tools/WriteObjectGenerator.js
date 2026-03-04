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

    const valueObj = z.union([
        z.string(),
        z.number(),
        z.array(z.object({
            field: z.string(),
            value: z.union([z.string(), z.number(), z.array(z.any())])
        }))
    ])

    const successObj = z.object({
        collection: z.string(),
        operation: z.enum(["insertOne", "insertMany"]),
        insert: z.array(
            z.object({
                field: z.string(),
                value: valueObj,
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
input: i want to test my notification schema so add one dummy notification with some dummy data with 2 dummy products purchase request

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
      "value": "Dummy Customer"
    },
    {
      "field": "fromPhone",
      "value": "9988776655"
    },
    {
      "field": "fromAddress",
      "value": "123 Dummy St, Test City"
    },
    {
      "field": "totalPrice",
      "value": "150.00"
    },
    {
      "field": "products",
      "value": [
        {
          "field": "product1",
          "value": [
            {
              "field": "productId",
              "value": "60d0fe4f1c1f1f001c0c0c0d"
            },
            {
              "field": "quantity",
              "value": 1
            },
            {
              "field": "price",
              "value": "100.00"
            }
          ]
        },
        {
          "field": "product2",
          "value": [
            {
              "field": "productId",
              "value": "60d0fe4f1c1f1f001c0c0c0e"
            },
            {
              "field": "quantity",
              "value": 2
            },
            {
              "field": "price",
              "value": "25.00"
            }
          ]
        }
      ]
    }
  ]
}
*/