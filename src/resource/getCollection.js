import { ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import Resource from "../util/resource.js";

const metadata = {
    description: "Get a resource schema",
    title: "Get Resource Schema",
    MimeType: "application/json",
};

async function handler(uri, {id}) {
    return {
        contents: [
            {
                uri: uri.href,
                text: JSON.stringify({uri:id}),
                mimeType: "application/json",
            },
        ],
    };
}
const template = new ResourceTemplate("getschema://{id}",{list:undefined});

const getCollection = new Resource("getSchema", template, metadata, handler);
export default getCollection;  
