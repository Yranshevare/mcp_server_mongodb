import { MongoClient } from "mongodb";
import fs from "fs";

const data = JSON.parse(fs.readFileSync("./data/testdb.json"));
const client = new MongoClient(data.testDB.url);

await client.connect();

const db = client.db();

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

const structured = {
    collection: "Product",
    operation: "find",
    filters: [
        {
            field: "category",
            operator: "eq",
            value: "test 5",
        },
    ],
    limit: 20,
};

const queryString = buildQueryString(structured);
console.log(queryString);

const result = await eval(queryString).toArray();
console.log(result);