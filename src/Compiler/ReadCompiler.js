import { z } from "zod";



class ReadCompiler {
    static operatorMap = {
        eq: "$eq",
        ne: "$ne",
        gt: "$gt",
        gte: "$gte",
        lt: "$lt",
        lte: "$lte",
        in: "$in",
    };

    static structuredSchema = z.object({
        collection: z.string(),
        operation: z.enum(["find", "findOne", "count", "aggregate"]),
        filters: z.array(
            z.object({
                field: z.string(),
                operator: z.enum(["eq", "ne", "gt", "gte", "lt", "lte", "in"]),
                value: z.union([
                    z.string(),
                    z.number(),
                    z.array(z.union([z.string(), z.number()])),
                ]),
            })
        ).optional(),
        projection: z.array(z.string()).optional(),
        sort: z.array(
            z.object({
                field: z.string(),
                order: z.enum(["asc", "desc"]),
            })
        ).optional(),
        limit: z.number().optional(),
    });

    static buildMongoFilter(filters) {
        if (!filters || filters.length === 0) return {};

        const query = {};

        for (const filter of filters) {
            const { field, operator, value } = filter;

            if (operator === "eq") {
                query[field] = value;
            } else {
                query[field] = {
                    [this.operatorMap[operator]]: value,
                };
            }
        }

        return query;
    }

    static buildQueryString(structured) {
        const {
            collection,
            operation,
            filters,
            projection,
            sort,
            limit,
        } = structured;

        const mongoFilter = this.buildMongoFilter(filters);

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

    // exposed methods

    static compile(structured) {
        const validation = this.structuredSchema.safeParse(structured);

        if (!validation.success) {
            throw new Error(validation.error);
        }

        return this.buildQueryString(validation.data);
    }

    static schema() {
        return this.structuredSchema;
    }
}

export default ReadCompiler;