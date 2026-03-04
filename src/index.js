import getCollection from "./resource/getCollection.js";
import WriteObjectGenerator from "./tools/WriteObjectGenerator.js";
import { resisterResource, resisterTools, mcpServer, connect } from "./lib/index.js";
import {ReadObjectGenerator, ExecuteReadObject} from "./tools/Read/index.js"

const server = await mcpServer();

await resisterTools(server,[WriteObjectGenerator, ReadObjectGenerator, ExecuteReadObject])

await resisterResource(server,[getCollection])

connect(server)