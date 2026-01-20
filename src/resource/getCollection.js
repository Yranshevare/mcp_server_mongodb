import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import Resource from "../util/resource.js";
import { MongoClient } from "mongodb";
import Collections from "../util/Collections.js";

const metadata = {
    description: "Get a resource schema",
    title: "Get Resource Schema",
    MimeType: "application/json",
};

async function handler(uri, { db_url, sampling_size }) {
    db_url = await decodeURIComponent(db_url);
    sampling_size = Number(sampling_size);
    
    if (!db_url.startsWith("mongodb")) {
        return {
            contents: [
                {
                    uri: uri.href,
                    text: "invalid db url",
                    mimeType: "text/plain",
                },
            ],
        };
    }
    const client = new MongoClient(db_url);

    await client.connect();

    const db = client.db();
    const dbCollections = await db.listCollections().toArray();

    const collectionData = await Promise.all(
        dbCollections.map(async (Collection) => {
            const entry = await db.collection(Collection.name).find().limit(sampling_size).toArray();
            const col = new Collections(entry);

            return {
                name: Collection.name,
                schema: col.schema,
            };
        })
    );
    return {
        contents: [
            {
                uri: uri.href,
                text: JSON.stringify(collectionData, null, 2),
                mimeType: "application/json",
            },
        ],
    };
}
const template = new ResourceTemplate("getschema://{db_url}/{sampling_size}", { list: undefined });

const getCollection = new Resource("getSchema", template, metadata, handler);
export default getCollection;
