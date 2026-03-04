import { z } from "zod"
import Tool from "../../util/tools.js";

const operatorMap = {
    eq: "$eq",
    ne: "$ne",
    gt: "$gt",
    gte: "$gte",
    lt: "$lt",
    lte: "$lte",
    in: "$in",
};

function buildMongoFilter(filters) {
    if (!filters || filters.length === 0) return {};

    const query = {};

    for (const filter of filters) {
        const { field, operator, value } = filter;

        if (operator === "eq") {
            // Mongo allows direct equality
            query[field] = value;
        } else {
            query[field] = {
                [operatorMap[operator]]: value,
            };
        }
    }

    return query;
}

function buildQueryString(structured) {
    const {
        collection,
        operation,
        filters,
        projection,
        sort,
        limit,
    } = structured;

    const mongoFilter = buildMongoFilter(filters);

    let queryString = `db.collection("${collection}")`;

    switch (operation) {
        case "find":
            queryString += `.find(${JSON.stringify(mongoFilter)})`;
            break;

        case "findOne":
            queryString += `.findOne(${JSON.stringify(mongoFilter)})`;
            break;

        case "count":
            queryString += `.countDocuments(${JSON.stringify(mongoFilter)})`;
            break;

        case "aggregate":
            queryString += `.aggregate(${JSON.stringify(mongoFilter)})`;
            break;

        default:
            throw new Error("Unsupported operation");
    }

    if (projection) {
        const projObj = Object.fromEntries(
            projection.map((field) => [field, 1])
        );
        queryString += `.project(${JSON.stringify(projObj)})`;
    }

    if (sort) {
        const sortObj = Object.fromEntries(
            sort.map((s) => [s.field, s.order === "asc" ? 1 : -1])
        );
        queryString += `.sort(${JSON.stringify(sortObj)})`;
    }

    if (limit) {
        queryString += `.limit(${limit})`;
    }

    return queryString;
}


const structuredSchema = z.object({
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


async function handler({ structured }) {
    const structuredObj = JSON.parse(structured);
    // validate the structured object
    const validationResult = structuredSchema.safeParse(structuredObj);
    
    if (!validationResult.success) {
        return { content: [{ type: "text", text: `${validationResult.error}` }] };
    }
    
    const queryString = buildQueryString(structuredObj);
    return { content: [{ type: "text", text: `${queryString}` }] };
}

const toolInputSchema = {
    structured: z.string(),
}

const description = "takes the structured JSON query plan as an input, to generate the MongoDB query string. and  execute it"



const ExecuteReadObject = new Tool("ExecuteReadObject", description, toolInputSchema, handler);

export default ExecuteReadObject;


// import { MongoClient } from "mongodb";
// import fs from "fs";

// const data = JSON.parse(fs.readFileSync("./data/testdb.json"));
// const client = new MongoClient(data.testDB.url);

// await client.connect();

// const db = client.db();

// const structured = {
//     collection: "Product",
//     operation: "find",
//     filters: [
//         {
//             field: "category",
//             operator: "eq",
//             value: "test 5",
//         },
//     ],
//     limit: 20,
// };

// const queryString = buildQueryString(structured);
// console.log(queryString);    // db.collection("Product").find({"category":"test 5"}).limit(20)

// const result = await eval(queryString).toArray();
// console.log(result);
// /*
// [
//   {
//     _id: new ObjectId('688ddc0b21904acac7304f6b'),
//     productName: 'Industrial Steel Pipes 1',
//     images: [
//       'http://res.cloudinary.com/dknlbzgap/image/upload/v1754127364/mroli5ynjmpzhjm2ukxe.jpg',
//       'http://res.cloudinary.com/dknlbzgap/image/upload/v1754127366/hhztjxdeuxzkhswdjlzx.jpg',
//       'http://res.cloudinary.com/dknlbzgap/image/upload/v1754127367/b6zmkhj4wxut2znsa4vu.jpg'
//     ],
//     primaryImage: 'http://res.cloudinary.com/dknlbzgap/image/upload/v1754221124/odxajpqu8tz3uxqlh8ga.jpg',
//     category: 'test 5',
//     description: 'strong and robaust pipes ',
//     price: '199',
//     material: 'High-grade Steel ',
//     size: '5X10 cm ',
//     weight: '1kg per piece ',
//     discount: 'by 10 to get 10% off ',
//     otherSpecification: 'by 10 pices for 10% off',
//     createdAt: 2025-08-02T09:36:11.256Z,
//     updatedAt: 2025-08-03T11:39:37.101Z
//   }
// ]
// */