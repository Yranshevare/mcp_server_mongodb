import getCollection from "./resource/getCollection.js";
// import WriteObjectGenerator from "./tools/WriteQueryGenerator.js";
import { resisterResource, resisterTools, mcpServer, connect } from "./lib/index.js";
import {ReadQueryGenerator} from "./tools/Read/index.js"
import InsertQueryGenerator from "./tools/InsertQueryGenerator.js"

const server = await mcpServer();

await resisterTools(server,[InsertQueryGenerator, ReadQueryGenerator])

await resisterResource(server,[getCollection])

connect(server)