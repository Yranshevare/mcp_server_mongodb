import { Collection, MongoClient } from "mongodb";
import fs from "fs";

const data = JSON.parse(fs.readFileSync("./data/testdb.json"));

// const dbUrl = "mongodb+srv://yadnesh:ymr2005@bugtopro.1q7tzoh.mongodb.net/BugToPro";
// const dbUrl = "mongodb+srv://Admin_dev:ymr2005@cluster0.5dzbbql.mongodb.net/catalogue_website";

const client = new MongoClient(data.testDB.url);

await client.connect();

const db = client.db();
const collections = await db.listCollections().toArray();

const collectionData = await Promise.all(
    collections.map(async (Collection) => {
        const entry = await db.collection(Collection.name).find().limit(data.testDB.sampling_size).toArray();
        return {
            name: Collection.name,
            data: entry,
        };
    })
);

// function that return the schema of a document and the length of the string
function inferSchemaFromDoc(doc) {
    const schema = {};
    for (const key in doc) {
        const type = Array.isArray(doc[key]) ? "array" : doc[key] === null ? "null" : typeof doc[key];
        schema[key] = { type, charCount: type === "string" && doc[key].length  };
    }
    return schema;
}

function mergeSchemas(docs) {
    const combined = {};
    docs.forEach((doc) => {
        const schema = inferSchemaFromDoc(doc);

        for (const key in schema) {
            combined[key] = combined[key] || {};
            combined[key].type = combined[key].type || schema[key].type;    // datatype
            combined[key].charCount = combined[key].charCount ? (combined[key].charCount + schema[key].charCount) : schema[key].charCount;  // character count
        }
    });
    // avg char count
    for (const key in combined) {
        if (combined[key].charCount) {
            combined[key].charCount = combined[key].charCount / docs.length;
            combined[key].example = docs.slice(0, 3).map((doc) => doc[key]);    // get some example
        }
    }
    return combined;
}

const inferredSchema = mergeSchemas(collectionData[0].data);
console.log(inferredSchema);

// console.log(collectionData[0])
