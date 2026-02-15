import ReadWriteObjectGenerator from "./tools/ReadWriteObjectGenerator.js";
import getCollection from "./resource/getCollection.js";
import { resisterResource, resisterTools, mcpServer, connect } from "./lib/index.js";


const server = await mcpServer();

await resisterTools(server,[ReadWriteObjectGenerator])

await resisterResource(server,[getCollection])

connect(server)