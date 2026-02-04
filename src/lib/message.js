import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";

const generateQuery = `
You generate MongoDB queries using the official Node.js driver.

Environment (already exists):
import { MongoClient } from "mongodb";
const db = client.db("yourDatabaseName");

INPUTS:
- DATABASE_SCHEMA: an ARRAY of objects, each with:
  { name: <collectionName>, schema: <fields> }
- USER_QUERY: plain English request

RULES (STRICT):
- Valid collections are ONLY the "name" values in DATABASE_SCHEMA
- You MUST select exactly ONE collection from DATABASE_SCHEMA
- NEVER invent collection names or fields
- Use ONLY fields defined in the selected collection's schema
- Enum values are CASE-SENSITIVE and must match exactly
- If no valid query can be formed, return:
  { "error": "Query cannot be generated from provided schema" }

QUERY RULES:
- Use db.collection("<collectionName>")
- Generate exactly ONE operation
- Use async/await
- No explanations, no comments, no extra text
- for Insert/Update, provide SAMPLE values matching field types if needed and not specified by USER_QUERY
- return the query inside a function with name "generateQuery" that can be directly executed without taking any parameters

ALLOWED OPERATIONS:
find, findOne, aggregate, insertOne, updateOne, deleteOne, countDocuments

FILTERING:
- Optional fields may be missing → use $exists if needed
- Use ObjectId only if field type is mongodb_ObjectId

SORT / LIMIT:
- Apply sort/limit only if explicitly requested

`

const generateQueryTemplate = new PromptTemplate({
    template: `
DATABASE_SCHEMA:
{SCHEMA_JSON}

USER_QUERY:
{NATURAL_LANGUAGE_QUERY}

CONSTRAINTS:
- Use only collections and fields defined in DATABASE_SCHEMA
- Generate exactly one MongoDB operation
- Prefer read-only operations unless the user explicitly asks to modify data
`,
    inputVariables: ["SCHEMA_JSON", "NATURAL_LANGUAGE_QUERY"],
});

const systemMessages = {
    generateQuery: new SystemMessage(generateQuery),
};

const humanMessage = {
    generateQuery: async ({ SCHEMA_JSON, NATURAL_LANGUAGE_QUERY }) =>
        new HumanMessage(await generateQueryTemplate.format({ SCHEMA_JSON, NATURAL_LANGUAGE_QUERY })),
};

export { systemMessages, humanMessage };
