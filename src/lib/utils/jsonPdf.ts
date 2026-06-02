import { FoundrySchema } from "./../types/foundry.ts";


export function populateOldGus(schema: unknown) {
    try {
        const foundrySchema = FoundrySchema.parse(schema)
        console.log(foundrySchema)
    } catch(error) {
        console.error(error)
    }
}