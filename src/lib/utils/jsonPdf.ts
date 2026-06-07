import { FoundrySchema } from "./../types/foundry.ts";
import { PDFDocument } from "pdf-lib";
import {
    calcStressMods,
    compileAdvancementMappings,
    compileArmorMarked,
    compileClassFeatures,
    compileExperiencesMappings,
    compileHeritageFeatures,
    compileHitPointMarks,
    compileHopeGained,
    compileProficiencyMarks,
    compileStressMarks,
    compileWeaponMappings,
    generateDomainCardMappings,
    getAllClasses,
    getAllDomains,
    getAllSubclasses,
    getArmorFeatures,
    getFinalTraits,
    getHopeFeature,
    getInventory,
    getLeveledBaseThresholds,
    getMajorThreshold,
    getNotes,
    getSevereThreshold,
    getSpellcastTrait,
    getTierFromLevel,
    getTotalArmor,
    getTotalEvasion,
    getTotalHp,
    getTraitModifier,
    isTraitMarked
} from "./foundryScanner.ts";

export async function populateOldGus(schema: unknown) {
    try {
        const foundrySchema = FoundrySchema.parse(schema)
        
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
            'Armor': String(getTotalArmor(foundrySchema.system, foundrySchema.items)),
            'Armor Base Thresholds': getLeveledBaseThresholds(foundrySchema.system, foundrySchema.items),
            'Armor Feature': getArmorFeatures(foundrySchema.items),
            'Armor Label': foundrySchema.items.find(item => item.type === 'armor')?.name,
            ...compileArmorMarked(foundrySchema.items),
            'Base Armor Score': String(foundrySchema.items.find(item => item.type === 'armor')?.system.armor?.max),
            'Class': getAllClasses(foundrySchema.items),
            'Class and Subclass Features': compileClassFeatures(foundrySchema.system, foundrySchema.items),
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
            'Name': foundrySchema.name,
            'Notes': getNotes(foundrySchema.system),
            ...compileProficiencyMarks(foundrySchema.system),
            'Pronouns': foundrySchema.system.biography.characteristics.pronouns ?? '',
            'Spellcast Trait': getSpellcastTrait(foundrySchema.items),
            ...compileStressMarks(foundrySchema.system),
            'Stress Max': String((foundrySchema.system.resources.stress.max ?? 6 + calcStressMods(foundrySchema.system, foundrySchema.items))),
            'Subclass': getAllSubclasses(foundrySchema.items),
            'Tier': String(getTierFromLevel(foundrySchema.system.levelData.level.current)),
            ...compileAdvancementMappings(foundrySchema.system),
            ...compileWeaponMappings(foundrySchema.items),
        }
        return fieldMappings
    } catch(error) {
        console.error(error)
        return {}
    }
}

export async function generateAndDownload(
    fieldMappings: Record<string, string | boolean>,
    fileName: string = 'Character'
){
    try {
        // 1. Fetch blank PDF
        const url = 'old-gus-daggerheart-character-sheet-fillable.pdf'
        const existingPdfBytes = await fetch(url).then(res => res.arrayBuffer())

        // 2. Load PDF and extract interactive form
        const pdfDoc = await PDFDocument.load(existingPdfBytes)
        const form = pdfDoc.getForm()

        // --- PDFRadioGroup interceptor ---
        const radioGroupKeys = new Set([
            'Hope Max',
            'HP Max',
            'Stress Max',
            'Weapon 1 Type',
            'Weapon 2 Type',
            'Weapon 3 Type',
            'Weapon 4 Type',
        ])
        
        // 3. Iterate over field mappings and populate the PDF
        Object.entries(fieldMappings).forEach(([pdfFieldName, value]) => {
            try {
                const field = form.getField(pdfFieldName)
                if (!field || value === undefined) return

                if (typeof value === 'boolean') {
                    // Route boolean values to checkboxes
                    const checkBox = form.getCheckBox(pdfFieldName)
                    if (value) checkBox.check()
                    else checkBox.uncheck()
                } else if (typeof value === 'string') {
                    if (radioGroupKeys.has(pdfFieldName)) {
                        // Check if this string belongs to a PDFRadioGroup
                        const radioGroup = form.getRadioGroup(pdfFieldName)

                        if (value === '') radioGroup.clear()
                        else radioGroup.select(value)
                    } else {
                        // Route other string values to text fields; dynamic font scaling
                        const textField = form.getTextField(pdfFieldName)
                        textField.setText(value)
                    }
                }
            } catch (e) {
                // If field name mismatches or doesn't exist, skip safely
                console.warn(`Could not set field: ${pdfFieldName}`)
                console.warn(e)
            }
        })

        // 4. Save the PDF document into a byte array
        const pdfBytes = await pdfDoc.save()

        // 5. Trigger browser download
        const blob = new Blob([pdfBytes as BlobPart], { type: 'application/pdf' })
        const downloadUrl = window.URL.createObjectURL(blob)

        const link = document.createElement('a')
        link.href = downloadUrl
        // Clean up the file name to remove spaces or weird characters
        const safeName = fileName.replace(/[^a-z0-9]/gi, '_')
        link.download = `${safeName}.pdf`

        document.body.appendChild(link)
        link.click()

        // Clean up the DOM and memory
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
        console.error("Error generating PDF:", error)
    }
}