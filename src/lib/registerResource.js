async function resisterResource(server,resources) {
    for (const resource of resources) {
        server.resource(resource.name,resource.uri,resource.metadata,resource.handler)
    }
}

export default resisterResource