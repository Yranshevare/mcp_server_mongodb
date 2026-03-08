import { z } from "zod";

class WriteCompiler {

    static valueObj = z.union([
        z.string(),
        z.number(),
        z.array(
            z.object({
                field: z.string(),
                value: z.union([z.string(), z.number(), z.array(z.any())])
            })
        )
    ]);

    static structuredSchema = z.object({
        collection: z.string(),
        operation: z.enum(["insertOne", "insertMany"]),
        insert: z.array(
            z.object({
                field: z.string(),
                value: this.valueObj,
            })
        ),
    });

    static buildInsertDocument(insertArray) {
        const document = {};

        for (const item of insertArray) {
            const { field, value } = item;

            if (Array.isArray(value)) {

                if (value.length > 0 && value[0].field) {

                    document[field] = value.map((v) => {

                        if (Array.isArray(v.value)) {
                            return {
                                [v.field]: this.buildInsertDocument(v.value)
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

    static buildQueryString(structured) {

        const { collection, operation, insert } = structured;

        const document = this.buildInsertDocument(insert);

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

export default WriteCompiler;