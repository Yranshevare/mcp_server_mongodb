import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

async function connect(server){
    const transport = new StdioServerTransport()
    await server.connect(transport)
}

export default connect