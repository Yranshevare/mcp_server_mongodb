import { z } from "zod";

const ToolSchema = z.object({
    name: z.string(),
    description: z.string(),
    inputSchema: z.any(),
    handler: z.function(),
});

export default class Tool {
    constructor(name, description, inputSchema, handler) {
        const result = ToolSchema.safeParse({ name, description, inputSchema, handler });
        if(result.success) {
            this.name = name;
            this.description = description;
            this.inputSchema = inputSchema;
            this.handler = handler;
        }else{
            throw new Error(result.error.message)
        }
    }
}
