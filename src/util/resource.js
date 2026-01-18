import { z } from "zod";

const ResourceSchema = z.object({
    name: z.string(),
    uri: z.any() || z.string(),
    metadata: z.any(),
    handler: z.function(),
});

export default class Resource {
    constructor(name, uri, metadata, handler) {
        const result = ResourceSchema.safeParse({ name, uri, metadata, handler });
        if (result.success) {
            this.name = name;
            this.uri = uri;
            this.metadata = metadata;
            this.handler = handler;
        } else {
            throw new Error(result.error.message);
        }
    }
}
