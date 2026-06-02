import type { FoundrySystem, Trait } from "./../index.ts";

export function getFinalTraits(
    systemData: FoundrySystem,
    trait: Trait,
) {
    let totalValue = 0

    switch (trait) {
        case 'agility':
            totalValue = systemData.traits?.agility.value ?? 0
            break
        case 'finesse':
            totalValue = systemData.traits?.finesse.value ?? 0
            break
        case 'instinct':
            totalValue = systemData.traits?.instinct.value ?? 0
            break
        case 'presence':
            totalValue = systemData.traits?.presence.value ?? 0
            break
        case 'knowledge':
            totalValue = systemData.traits?.knowledge.value ?? 0
            break
        case 'strength':
            totalValue = systemData.traits?.strength.value ?? 0
            break
        default:
            throw new Error(`Unknown trait: ${trait}`)
    }

    const levelups = systemData.levelData?.levelups
    const currentLevel = systemData.levelData?.level?.current ?? 1

    if (!levelups) return totalValue

    for (let lvl = 1; lvl <= currentLevel; lvl++ ) {
        const levelKey = String(lvl)
        const levelupData = levelups[levelKey]

        if (levelupData && Array.isArray(levelupData.selections)) {
            levelupData.selections.forEach(selection => {
                if (Array.isArray(selection.data) && selection.data.length > 0) {
                    selection.data.forEach(selectionData => {
                        if (trait === selectionData) totalValue += 1
                    })
                }
            })
        }
    }

    if (totalValue <= 0) {
        return String(totalValue)
    } else if (totalValue > 0) {
        return '+' + String(totalValue)
    }
}

export function isTraitMarked(systemData: FoundrySystem, trait: Trait) {
    const levelups = systemData.levelData?.levelups
    const currentLevel = systemData.levelData?.level?.current ?? 1

    if (!levelups || currentLevel <= 1) return false

    let activeTierLevels: string[] = []

    if (currentLevel >= 2 && currentLevel <= 4) {
        activeTierLevels = ['2', '3', '4']
    } else if (currentLevel >= 5 && currentLevel <= 7) {
        activeTierLevels = ['5', '6', '7']
    } else if (currentLevel >= 8 && currentLevel <= 10) {
        activeTierLevels = ['8', '9', '10']
    }

    for (const levelKey of activeTierLevels) {
        const levelupData = levelups[levelKey]

        if (!levelupData || !Array.isArray(levelupData.selections)) continue

        for (const selection of levelupData.selections) {
            if (selection && Array.isArray(selection.data)) {
                for (const selectionData of selection.data) {
                    if (trait === selectionData) return true
                }
            }
        }
    }

    return false
}