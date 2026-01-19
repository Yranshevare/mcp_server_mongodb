import { MongoClient, ObjectId  } from "mongodb";
import fs from "fs";

const data = JSON.parse(fs.readFileSync("./data/testdb.json"));

const client = new MongoClient(data.testDB.url);

await client.connect();

const db = client.db();
const dbCollections = await db.listCollections().toArray();

class Collections {
    merged = {};
    schema = {};

    constructor(collection) {
        if (!Array.isArray(collection)) throw new Error("collection must be an array");
        this.collection = collection;
        this.#processCollectionPipeline();
    }

    #combineCollection(collection) {
        for (const key in collection) {
            if (!this.merged[key]) {
                this.merged[key] = [];
            }
            this.merged[key].push(collection[key]);
        }
    }

    #getDataType(object, key) {
        for (const item of object) {
            const type = Array.isArray(item) ? "array" : item === null ? "null" : typeof item;

            if (!this.schema[key]) this.schema[key] = {};

            this.schema[key].type = this.schema[key]?.type || type;
            if (type === "string") {
                const data = new Set(object);

                if (data.size / object.length < 0.5) {
                    if (!this.schema[key]) this.schema[key] = {};
                    this.schema[key].type = "enum";
                    this.schema[key].enum = data;
                    return;
                }
                const charCount = this.merged[key].reduce((acc, item) => acc + item.length, 0);
                this.schema[key].avgCount = charCount / this.merged[key].length;
                this.schema[key].example = [this.merged[key][0], this.merged[key][1], this.merged[key][2]];
                return;
            }
        }
    }
    #HandleObjet(key){
        // if(this.merged[key]) return
        if(key === "createdAt" || key === "updatedAt") {
            delete this.schema[key] 
            return
        }
        // console.log(this.merged[key][0] )
        if(this.merged[key][0] instanceof ObjectId){
            this.schema[key].type = "mongodb_ObjectId"
            return
        }
        this.schema[key].type = "object";
        this.schema[key].properties = {}
    }

    #processCollectionPipeline() {
        // combine the collection
        this.collection.forEach((col) => {
            this.#combineCollection(col);
        });

        // extract the datatype of the schema
        for (const key in this.merged) {
            this.#getDataType(this.merged[key], key);
            if(this.schema[key].type === "object"){
                this.#HandleObjet(key)
            }
        }
    }
}

const collectionData = await Promise.all(
    dbCollections.map(async (Collection) => {
        const entry = await db.collection(Collection.name).find().limit(data.testDB.sampling_size).toArray();
        // const collection = new Collections(entry);
        return {
            name: Collection.name,
            // schema: collection.schema,
            data: entry,
        };
    })
);

// collectionData.forEach((collection) => {
//     console.log(collection);
// });

const col = new Collections(collectionData[1].data);
// console.log(col.merged);
console.log(col.schema);
