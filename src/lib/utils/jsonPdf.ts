import { FoundrySchema } from "./../types/foundry.ts";
import { PDFDocument } from "pdf-lib";
import {
    compileArmorMarked,
    compileClassFeatures,
    compileExperiencesMappings,
    compileHeritageFeatures,
    compileHitPointMarks,
    compileHopeGained,
    generateDomainCardMappings,
    getAllClasses,
    getAllDomains,
    getArmorFeatures,
    getFinalTraits,
    getHopeFeature,
    getInventory,
    getLeveledBaseThresholds,
    getMajorThreshold,
    getSevereThreshold,
    getTotalArmor,
    getTotalEvasion,
    getTotalHp,
    getTraitModifier,
    isTraitMarked
} from "./foundryScanner.ts";

export async function populateOldGus(schema: unknown) {
    try {
        const foundrySchema = FoundrySchema.parse(schema)
        console.log(foundrySchema)
        
        const response = await fetch('/old-gus-daggerheart-character-sheet-fillable.pdf')
        if (!response.ok) throw new Error('Could not fetch the character sheet template.')

        const templateArrayBuffer = await response.arrayBuffer()
        const pdfDoc = await PDFDocument.load(templateArrayBuffer)
        const form = pdfDoc.getForm()

        const fieldMappings = {
            'Agility': getFinalTraits(foundrySchema.system, 'agility'),
            'Strength': getFinalTraits(foundrySchema.system, 'strength'),
            'Finesse': getFinalTraits(foundrySchema.system, 'finesse'),
            'Instinct': getFinalTraits(foundrySchema.system, 'instinct'),
            'Presence': getFinalTraits(foundrySchema.system, 'presence'),
            'Knowledge': getFinalTraits(foundrySchema.system, 'knowledge'),
            'Agility Mark': isTraitMarked(foundrySchema.system, 'agility'),
            'Strength Mark': isTraitMarked(foundrySchema.system, 'strength'),
            'Finesse Mark': isTraitMarked(foundrySchema.system, 'finesse'),
            'Instinct Mark': isTraitMarked(foundrySchema.system, 'instinct'),
            'Presence Mark': isTraitMarked(foundrySchema.system, 'presence'),
            'Knowledge Mark': isTraitMarked(foundrySchema.system, 'knowledge'),
            'Agility Modifiers': getTraitModifier(foundrySchema.system, 'agility'),
            'Strength Modifiers': getTraitModifier(foundrySchema.system, 'strength'),
            'Finesse Modifiers': getTraitModifier(foundrySchema.system, 'finesse'),
            'Instinct Modifiers': getTraitModifier(foundrySchema.system, 'instinct'),
            'Presence Modifiers': getTraitModifier(foundrySchema.system, 'presence'),
            'Knowledge Modifiers': getTraitModifier(foundrySchema.system, 'knowledge'),
            'Ancestry': foundrySchema.items.find(item => item.type === 'ancestry')?.name,
            'Armor': String(getTotalArmor(foundrySchema.items)),
            'Armor Base Thresholds': getLeveledBaseThresholds(foundrySchema.system, foundrySchema.items),
            'Armor Feature': getArmorFeatures(foundrySchema.items),
            'Armor Label': foundrySchema.items.find(item => item.type === 'armor')?.name,
            ...compileArmorMarked(foundrySchema.items),
            'Base Armor Score': String(foundrySchema.items.find(item => item.type === 'armor')?.system.armor?.max),
            'Class': getAllClasses(foundrySchema.items),
            'Class and Subclass Features': compileClassFeatures(foundrySchema.items),
            'Class Hope Feature': getHopeFeature(foundrySchema.items),
            'Community': foundrySchema.items.find(item => item.type === 'community')?.name,
            ...generateDomainCardMappings(foundrySchema.items),
            'Domains': getAllDomains(foundrySchema.items),
            'Evasion': String(getTotalEvasion(foundrySchema.system, foundrySchema.items)),
            ...compileExperiencesMappings(foundrySchema.system),
            'Gold, Bags': String(foundrySchema.system.gold.bags),
            'Gold, Chests': String(foundrySchema.system.gold.chests),
            'Gold, Coins': String(foundrySchema.system.gold.coins),
            'Gold, Handfuls': String(foundrySchema.system.gold.handfuls),
            'Gold, Stashed': '',
            ...compileHopeGained(foundrySchema.system),
            'Hope Max': String(foundrySchema.system.resources.hope.max ?? 6),
            ...compileHitPointMarks(foundrySchema.system),
            'Heritage Features': compileHeritageFeatures(foundrySchema.items),
            'HP Max': String(getTotalHp(foundrySchema.system, foundrySchema.items)),
            'Inventory': getInventory(foundrySchema.items),
            'Inventory (Continued)': '',
            'Level': String(foundrySchema.system.levelData.level.current),
            'Major Damage Threshold': String(getMajorThreshold(foundrySchema.system, foundrySchema.items)),
            'Severe Damage Threshold': String(getSevereThreshold(foundrySchema.system, foundrySchema.items)),
        }
        console.log(fieldMappings)
    } catch(error) {
        console.error(error)
    }
}