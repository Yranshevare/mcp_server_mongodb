import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";


async function mcpServer() {
    
    const server = new McpServer({
        name:"MCP Server",
        version:"1.0.0",
        capabilities:{
            tools:{},
            resources:{}
        }
    })
    return server
}

export default mcpServer