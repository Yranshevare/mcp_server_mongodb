import mcpServer from "./lib/server.js";
import { z } from "zod";
import connect from "./lib/transport.js";
import add from "./tools/add.js";
import registerTool from "./lib/registerTools.js"

const server = await mcpServer();

await registerTool(server,[add])

connect(server)