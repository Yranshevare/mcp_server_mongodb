import { MongoClient } from "mongodb";
import fs from "fs";
// import ReadCompiler from "./Compiler/ReadCompiler.js"
import WriteCompiler from "./Compiler/WriteCompiler.js"

const data = JSON.parse(fs.readFileSync("./data/testdb.json"));
const client = new MongoClient(data.testDB.url);

await client.connect();

const db = client.db();

function buildInsertDocument(insertArray) {
    const document = {};

    for (const item of insertArray) {
        const { field, value } = item;

        // If value is array → nested structure
        if (Array.isArray(value)) {
            // check if nested objects
            if (value.length > 0 && value[0].field) {
                document[field] = value.map(v => {
                    if (Array.isArray(v.value)) {
                        return {
                            [v.field]: buildInsertDocument(v.value)
                        };
                    }
                    return { [v.field]: v.value };
                });
            } else {
                document[field] = value;
            }
        } else {
            document[field] = value;
        }
    }

    return document;
}

function buildInsertQueryString(structured) {
    const { collection, operation, insert } = structured;

    const document = buildInsertDocument(insert);

    let queryString = `db.collection("${collection}")`;

    switch (operation) {
        case "insertOne":
            queryString += `.insertOne(${JSON.stringify(document)})`;
            break;

        case "insertMany":
            queryString += `.insertMany(${JSON.stringify(document)})`;
            break;

        default:
            throw new Error("Unsupported insert operation");
    }

    return queryString;
}


const structuredInsert = JSON.parse(
    `
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
    `
);

// const insertQuery = buildInsertQueryString(structuredInsert);

// console.log(insertQuery);

// const result = await eval(insertQuery);
// console.log(result);

// const saved = await db.collection("Notification").find({fromName:"Dummy Customer"}).toArray();
// console.log(saved);

// // delete the saved user 
// await db.collection("Notification").deleteOne({fromName:"Dummy Customer"});

const insertQuery = WriteCompiler.compile(structuredInsert);
console.log(insertQuery);
