import {z} from "zod"
const add = {
    name:"add",
    description:"add two numbers",
    inputSchema:{
        a:z.number(),
        b:z.number()
    },
    handler:async ({a,b})=>{
        return {
            sum:a+b
        }
    }

}

export default add