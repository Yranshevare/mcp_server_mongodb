import getCollection from "./resource/getCollection.js";
import ReadObjectGenerator from "./tools/ReadObjectGenerator.js";
import WriteObjectGenerator from "./tools/WriteObjectGenerator.js";
import { resisterResource, resisterTools, mcpServer, connect } from "./lib/index.js";


const server = await mcpServer();

await resisterTools(server,[ReadObjectGenerator, WriteObjectGenerator])

await resisterResource(server,[getCollection])

connect(server)