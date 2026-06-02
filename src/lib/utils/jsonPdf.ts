import { FoundrySchema } from "./../types/foundry.ts";
import { PDFDocument } from "pdf-lib";
import { getFinalTraits, isTraitMarked } from "./foundryScanner.ts";

export async function populateOldGus(schema: unknown) {
    try {
        const foundrySchema = FoundrySchema.parse(schema)
        console.log(foundrySchema)
        
        const response = await fetch('/old-gus-daggerheart-character-sheet-fillable.pdf')
        if (!response.ok) throw new Error('Could not fetch the character sheet template.')

        const templateArrayBuffer = await response.arrayBuffer()
        const pdfDoc = await PDFDocument.load(templateArrayBuffer)
        console.log(pdfDoc)
        const form = pdfDoc.getForm()
        console.log(form)

        const fieldMappings = {
            'Agility': getFinalTraits(foundrySchema.system, 'agility'),
            'Strength': getFinalTraits(foundrySchema.system, 'strength'),
            'Finesse': getFinalTraits(foundrySchema.system, 'finesse'),
            'Instinct': getFinalTraits(foundrySchema.system, 'instinct'),
            'Presence': getFinalTraits(foundrySchema.system, 'presence'),
            'Knowledge': getFinalTraits(foundrySchema.system, 'knowledge'),
            'AgilityMarked': isTraitMarked(foundrySchema.system, 'agility'),
            'StrengthMarked': isTraitMarked(foundrySchema.system, 'strength'),
            'FinesseMarked': isTraitMarked(foundrySchema.system, 'finesse'),
            'InstinctMarked': isTraitMarked(foundrySchema.system, 'instinct'),
            'PresenceMarked': isTraitMarked(foundrySchema.system, 'presence'),
            'KnowledgeMarked': isTraitMarked(foundrySchema.system, 'knowledge'),
        }
        console.log(fieldMappings)
    } catch(error) {
        console.error(error)
    }
}