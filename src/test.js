import { MongoClient, ObjectId } from "mongodb";
import fs from "fs";

const data = JSON.parse(fs.readFileSync("./data/testdb.json"));
const client = new MongoClient(data.testDB.url);

await client.connect();

const db = client.db();
// const dbCollections = await db.listCollections().toArray();

class Collections {
    merged = {};
    schema = {};

    constructor(collection) {
        if (!Array.isArray(collection)) throw new Error("collection must be an array");
        this.collection = collection;
        this.#processCollectionPipeline();
    }

    // ---------- helpers ----------
    #getType(value) {
        if (value instanceof ObjectId) return "mongodb_ObjectId";
        if (Array.isArray(value)) return "array";
        if (value === null) return "null";
        return typeof value;
    }

    #combineCollection(collection) {
        for (const key in collection) {
            if (!this.merged[key]) this.merged[key] = [];
            this.merged[key].push(collection[key]);
        }
    }

    // ---------- primitive / enum ----------
    #getDataType(values, key) {
        for (const item of values) {
            const type = this.#getType(item);

            if (!this.schema[key]) this.schema[key] = {};
            this.schema[key].type = type;

            if (type === "string") {
                const unique = new Set(values);

                if (unique.size / values.length < 0.5) {
                    this.schema[key].type = "enum";
                    this.schema[key].enum = [...unique];
                    return;
                }

                const charCount = values.reduce((a, b) => a + b.length, 0);
                this.schema[key].avgCount = charCount / values.length;
                this.schema[key].example = values.slice(0, 3);
                return;
            }
        }
    }

    // ---------- object ----------
    #HandleObjet(key) {
        const sample = this.merged[key]?.[0];
        if (!sample) return;

        if (key === "createdAt" || key === "updatedAt") {
            delete this.schema[key];
            return;
        }

        if (sample instanceof ObjectId) {
            return { type: "mongodb_ObjectId" };
        }

        const res = {
            type: "object",
            items: {},
        };

        Object.entries(sample).forEach(([k, v]) => {
            const type = this.#getType(v);

            if (type === "array") {
                res.items[k] = this.#handleArrayNested(v);
            } else if (type === "object") {
                this.merged[k] = this.merged[key].map((obj) => obj?.[k]).filter(Boolean);

                res.items[k] = this.#HandleObjet(k);
            } else {
                res.items[k] = { type };
            }
        });

        return res;
    }

    // ---------- array ----------
    #handleArray(key) {
        const sample = this.merged[key]?.[0];
        if (!sample || !sample.length) {
            return { type: "array", items: {} };
        }

        const item = sample[0];
        const type = this.#getType(item);

        if (type === "object") {
            return {
                type: "array",
                items: this.#inferInlineObject(item),
            };
        }

        return {
            type: "array",
            items: { type },
        };
    }

    #handleArrayNested(array) {
        const item = array[0];
        if (!item) return { type: "array", items: {} };

        const type = this.#getType(item);

        if (type === "object") {
            return {
                type: "array",
                items: this.#inferInlineObject(item),
            };
        }

        return {
            type: "array",
            items: { type },
        };
    }

    // ---------- inline object (for arrays) ----------
    #inferInlineObject(obj) {
        const schema = {
            type: "object",
            items: {},
        };

        Object.entries(obj).forEach(([k, v]) => {
            const type = this.#getType(v);

            if (type === "array") {
                schema.items[k] = this.#handleArrayNested(v);
            } else if (type === "object") {
                schema.items[k] = this.#inferInlineObject(v);
            } else {
                schema.items[k] = { type };
            }
        });

        return schema;
    }

    // ---------- pipeline ----------
    #processCollectionPipeline() {
        this.collection.forEach((col) => this.#combineCollection(col));

        for (const key in this.merged) {
            this.#getDataType(this.merged[key], key);

            if (this.schema[key]?.type === "object") {
                this.schema[key] = this.#HandleObjet(key);
            }

            if (this.schema[key]?.type === "array") {
                this.schema[key] = this.#handleArray(key);
            }
        }
    }
}


// async function generateMongoDBQuery() {
//   return db.collection("Notification").find().sort({ createdAt: -1 }).limit(1).toArray();
// }

// generateMongoDBQuery().then((result) => {
//   console.log(result);
// }).catch((error) => {
//   console.error("Error generating MongoDB query:", error);
// });




// async function generateQuery() {
//   return await db.collection("Category").aggregate([
//     {
//       $group: {
//         _id: "$categoryName"
//       }
//     },
//     {
//       $project: {
//         _id: 0,
//         categoryName: "$_id"
//       }
//     }
//   ]).toArray();
// }

// console.log(await generateQuery());


// async function generateQuery() {
//   return db.collection("Product").find({ category: "production" }).toArray();
// }


function generateQuery() {
    return db.collection("Category").insertOne({
        categoryName: "myCategory",
        description: "Sample description"
    });
}

console.log(await generateQuery());



// // ---------- usage ----------
// const collectionData = await Promise.all(
//     dbCollections.map(async (Collection) => {
//         const entry = await db.collection(Collection.name).find().limit(data.testDB.sampling_size).toArray();
//         const col = new Collections(entry);

//         return {
//             name: Collection.name,
//             schema: col.schema,
//         };
//     })
// );

// console.log(JSON.stringify(collectionData, null, 2));
