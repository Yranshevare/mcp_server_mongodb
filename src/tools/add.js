import { z } from "zod";
import Tool from "../util/tools.js";

const inputSchema = {
    a: z.number(),
    b: z.number(),
};

async function handler({ a, b }) {
    return { sum: a + b };
}

const add = new Tool("add", "add two numbers", inputSchema, handler);

export default add;
