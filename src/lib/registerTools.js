export default async function resisterTools(server,tools) {
    for (const tool of tools) {
        server.tool(tool.name,tool.description,tool.inputSchema,tool.handler)
    }
} 
