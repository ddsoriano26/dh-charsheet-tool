import {
    capitalize,
    stripHtml,
    type FoundryEffectChange,
    type FoundryItem,
    type FoundrySystem,
    type Trait
} from "./../index.ts";

export function getFinalTraits(
    systemData: FoundrySystem,
    trait: Trait,
) {
    let totalValue

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

    totalValue += addTraitMods(systemData, trait)

    return getModString(totalValue)
}

function getModString(value: number) {
    if (value <= 0) {
        return String(value)
    } else if (value > 0) {
        return '+' + String(value)
    }
}

function addTraitMods(systemData: FoundrySystem, trait: Trait) {
    let totalMod = 0

    const levelups = systemData.levelData?.levelups
    const currentLevel = systemData.levelData?.level?.current ?? 1

    if (!levelups) return totalMod

    for (let lvl = 1; lvl <= currentLevel; lvl++ ) {
        const levelKey = String(lvl)
        const levelupData = levelups[levelKey]

        if (levelupData && Array.isArray(levelupData.selections)) {
            levelupData.selections.forEach(selection => {
                if (Array.isArray(selection.data) && selection.data.length > 0) {
                    selection.data.forEach(selectionData => {
                        if (trait === selectionData) totalMod += 1
                    })
                }
            })
        }
    }

    return totalMod
}

export function getTraitModifier(systemData: FoundrySystem, trait: Trait) {
    return getModString(addTraitMods(systemData, trait))
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

export function getArmorFeatures(itemData: FoundryItem) {
    const armorObj = itemData.find(item => item.type === 'armor')
    const armorEffects = armorObj?.effects

    let armorFeaturesStr = ``

    if (armorEffects && armorEffects?.length <= 0) return ''
    else if (armorEffects) {
        armorEffects.forEach(effect => {
            armorFeaturesStr += `${effect.name}: ${effect.description}\n`
        })
    }

    return armorFeaturesStr.slice(0, -1)
}

export function isArmorSlotMarked(itemData: FoundryItem, slot: number) {
    const markedArmor = itemData.find(item => item.type === 'armor')?.system.armor?.current

    if (markedArmor && slot <= markedArmor) return true
    else return false
}

export function compileArmorMarked(itemData: FoundryItem) {
    const mappings: Record<string, boolean> = {}
    const MAX_ARMOR = 12

    // Safely extract the value, defaulting to 0 if missing
    const currentArmor = itemData.find(item => item.type === 'armor')?.system.armor?.current ?? 0

    for (let i = 1; i <= MAX_ARMOR; i++) {
        mappings[`Armor Slot ${i}`] = i <= currentArmor;
    }

    return mappings
}

function calcArmorMods(itemData: FoundryItem) {
    let totalArmorMod = 0

    const features = itemData?.filter(item => item.type === 'feature') ?? []

    features.forEach(item => {
        item.effects?.forEach(effect => {
            if (effect.disabled === true) return

            const changes = effect.system?.changes

            if (Array.isArray(changes)) {
                changes.forEach(change => {
                    if (change.type === 'armor') {
                        const rawValue = change.value

                        if (typeof rawValue === 'object' && rawValue !== null) {
                            if('max' in rawValue && rawValue.max !== undefined) {
                                totalArmorMod += Number(rawValue.max)
                            }
                        } else {
                            const parsedValue = Number(rawValue)
                            if (!isNaN(parsedValue)) {
                                totalArmorMod += parsedValue
                            }
                        }
                    }
                })
            }
        })
    })

    return totalArmorMod
}

export function getTotalArmor(itemData: FoundryItem) {
    const baseArmor = Number(itemData.find(item => item.type === 'armor')?.system.armor?.max)
    const armorMod = calcArmorMods(itemData)
    return baseArmor + armorMod
}

export function getLeveledBaseThresholds(systemData: FoundrySystem, itemData: FoundryItem) {
    const baseMajor = Number(itemData.find(item => item.type === 'armor')?.system.baseThresholds?.major)
    const baseSevere = Number(itemData.find(item => item.type === 'armor')?.system.baseThresholds?.severe)
    const level = systemData.levelData.level.current

    return `${baseMajor + level} / ${baseSevere + level}`
}

export function getMajorThreshold(systemData: FoundrySystem, itemData: FoundryItem) {
    let majorThreshold = Number(itemData.find(item => item.type === 'armor')?.system.baseThresholds?.major)
    const level = systemData.levelData.level.current

    // Apply level modifier
    majorThreshold += level

    // Apply feature modifiers
    majorThreshold = calcFeatureMods(itemData, 'system.damageThresholds.major', majorThreshold)

    // Apply domain card modifiers
    majorThreshold = calcDomainCardMods(itemData, 'system.damageThresholds.major', majorThreshold)

    return majorThreshold
}

export function getSevereThreshold(systemData: FoundrySystem, itemData: FoundryItem) {
    let severeThreshold = Number(itemData.find(item => item.type === 'armor')?.system.baseThresholds?.severe)
    const level = systemData.levelData.level.current

    // Apply level modifier
    severeThreshold += level

    // Apply feature modifiers
    severeThreshold = calcFeatureMods(itemData, 'system.damageThresholds.severe', severeThreshold)

    // Apply domain card modifiers
    severeThreshold = calcDomainCardMods(itemData, 'system.damageThresholds.severe', severeThreshold)

    return severeThreshold
}

export function getAllClasses(itemData: FoundryItem) {
    const classItems = itemData.filter(item => item.type === 'class')
    
    if (classItems.length <= 0) return 'Classless'

    const mainClass = classItems.find(classItem => !classItem.system?.isMultiClass)
    const mainClassName = mainClass ? mainClass.name : classItems[0].name

    if (classItems.length === 1) return mainClassName

    const secondaryClasses = classItems.filter(item => item !== mainClass)
    const secondaryClassNames = secondaryClasses.map(item => item.name)

    return [mainClassName, ...secondaryClassNames].join(' / ')
}

export function compileClassFeatures(itemData: FoundryItem) {
    const blocks: string[] = []

    // --- 1. Identify main class and subclasses ---
    const allClasses = itemData.filter(item => item.type === 'class')
    const mainClass = allClasses.find(item => !item.system?.isMultiClass)
    const secondaryClasses = allClasses.filter(item => item !== mainClass)

    const allSubclasses = itemData.filter(item => item.type === 'subclass')
    const mainSubclass = allSubclasses.find(item => !item.system?.multiclassOrigin)
    const secondarySubclasses = allSubclasses.filter(item => item !== mainSubclass)

    // --- 2. Filter out the specific features ---
    const features = itemData.filter(item => item.type === 'feature')

    // Class features
    const mainClassFeatures = features.filter(feature => feature.system?.identifier === 'class' && !feature.system?.multiclassOrigin)
    const secondaryClassFeatures = features.filter(feature => feature.system?.identifier === 'class' && feature.system?.multiclassOrigin)

    // Subclass features
    const subclassTiers = ['foundation', 'specialization', 'mastery']

    const mainSubclassFeatures = features.filter(feature =>
        feature.system?.identifier && subclassTiers.includes(feature.system.identifier) && !feature.system?.multiclassOrigin
    )
    const secondarySubclassFeatures = features.filter(feature =>
        feature.system?.identifier && subclassTiers.includes(feature.system.identifier) && feature.system?.multiclassOrigin
    )

    // --- 3. Helper: Build subclass tiers ---
    const buildSubclassBlock = (subclassNames: string[], subFeatures: FoundryItem) => {
        if (subFeatures.length === 0) return

        // Output format: "Subclass: HEDGE" or "Subclass: WINGED SENTINEL / NIGHTWALKER"
        blocks.push(`Subclass: ${subclassNames.join(' / ').toUpperCase()}`)

        const foundations = subFeatures.filter(feature => feature.system?.identifier === 'foundation')
        const specializations = subFeatures.filter(feature => feature.system?.identifier === 'specialization')
        const masteries = subFeatures.filter(feature => feature.system?.identifier === 'mastery')

        if (foundations.length > 0) {
            blocks.push('Foundations')
            foundations.forEach(feature => {
                blocks.push(`${feature.name}: ${stripHtml(feature.system?.description)}`)
            })
        }

        if (specializations.length > 0) {
            blocks.push('Specialization')
            specializations.forEach(feature => {
                blocks.push(`${feature.name}: ${stripHtml(feature.system?.description)}`)
            })
        }

        if (masteries.length > 0) {
            blocks.push('Mastery')
            masteries.forEach(feature => {
                blocks.push(`${feature.name}: ${stripHtml(feature.system?.description)}`)
            })
        }
    }

    // --- 4. Assemble the Output ---

    // Main class block
    if (mainClassFeatures.length > 0) {
        blocks.push(`Class Features: ${mainClass?.name?.toUpperCase() ?? 'UNKNOWN'}`)
        mainClassFeatures.forEach(feature => {
            blocks.push(`${feature.name}: ${stripHtml(feature.system?.description)}`)
        })
    }

    // Main subclass block
    if (mainSubclass) {
        buildSubclassBlock([mainSubclass.name], mainSubclassFeatures)
    }

    // Secondary classes block
    if (secondaryClassFeatures.length > 0) {
        // Build the combined header for all secondary classes
        console.log(secondaryClassFeatures)
        const secondaryClassNames = secondaryClasses.length > 0
            ? secondaryClasses.map(secClass => secClass.name).join(' / ').toUpperCase()
            : 'MULTICLASS' // Failsafe if the class item is missing but the features exist

        blocks.push(`Class Features: ${secondaryClassNames}`)
        secondaryClassFeatures.forEach(feature => {
            blocks.push(`${feature.name}: ${stripHtml(feature.system?.description)}`)
        })
    }

    // Secondary subclasses block
    if (secondarySubclasses.length > 0) {
        // Extract all secondary subclass names into an array
        const secondarySubclassNames = secondarySubclasses.map(subclass => subclass.name)
        buildSubclassBlock(secondarySubclassNames, secondarySubclassFeatures)
    }

    // Join all the blocks with standard double line breaks for paragraph spacing
    return blocks.join('\n\n')
}

export function getHopeFeature(itemData: FoundryItem) {
    const hopeFeatureItem = itemData.find(item => item.system?.identifier === 'hope')
    const hopeFeatureStr = `${hopeFeatureItem?.name} - ${hopeFeatureItem?.system ? stripHtml(hopeFeatureItem.system.description) : 'No description available'}`
    return hopeFeatureStr
}

export function generateDomainCardMappings(itemData: FoundryItem) {
    const mappings: Record<string, string | boolean> = {}

    // 1. Isolate and sort the domain cards by level ascending
    const domainCards = (itemData ?? [])
        .filter(item => item.type === 'domainCard')
        .sort((a, b) => (a.system?.level ?? 0) - (b.system?.level ?? 0))

    // 2. Loop through a maximum of 18 cards
    const maxCards = Math.min(domainCards.length, 18)

    for (let i = 0; i < maxCards; i++) {
        const card = domainCards[i];
        const cardNum = i + 1; // 1-indexed for the PDF names (1 to 18)

        // 3. Populate the exact PDF field names dynamically
        mappings[`Domain Card ${cardNum}, Name`] = card.name;
        mappings[`Domain Card ${cardNum}, Domain`] = capitalize(card.system?.domain);
        mappings[`Domain Card ${cardNum}, Effects`] = stripHtml(card.system?.description);
        mappings[`Domain Card ${cardNum}, Level`] = String(card.system?.level ?? 0);
        mappings[`Domain Card ${cardNum}, Recall Cost`] = String(card.system?.recallCost ?? 0);
        mappings[`Domain Card ${cardNum}, Type`] = capitalize(card.system?.type);

        // PDF Checkboxes usually require string toggles like 'Yes' or 'Off'
        // If inVault is false (or undefined, meaning active), it's in the loadout.
        const isInLoadout = card.system?.inVault === false || card.system?.inVault === undefined;
        mappings[`Domain Card ${cardNum}, Loadout`] = isInLoadout ? true : false;
    }

    return mappings
}

export function getAllDomains(itemData: FoundryItem) {
    const classItems = itemData.filter(item => item.type === 'class')
    let allDomains: string[] = []

    classItems.forEach(item => {
        if (item.system.domains) {
            allDomains = [...allDomains, ...item.system.domains]
        }
    })

    return allDomains.map(domain => capitalize(domain)).join(', ')
}

function calcEvasionMods(systemData: FoundrySystem, itemData: FoundryItem) {
    let totalEvasionMod = 0

    // Apply advancements
    totalEvasionMod += calcLevelUpMods(systemData, 'evasion')

    // Apply features
    totalEvasionMod = calcFeatureMods(itemData, 'system.evasion', totalEvasionMod)

    // Apply domain cards
    totalEvasionMod = calcDomainCardMods(itemData, 'system.evasion', totalEvasionMod)

    return totalEvasionMod
}

export function getTotalEvasion(systemData: FoundrySystem, itemData: FoundryItem) {
    const mainClass = itemData.find(item => item.type === 'class' && !item.system.isMultiClass)
    const baseEvasion = mainClass?.system?.evasion ? mainClass.system.evasion : 0
    const evasionMod = calcEvasionMods(systemData, itemData)
    return baseEvasion + evasionMod
}

export function compileExperiencesMappings(systemData: FoundrySystem) {
    const mappings: Record<string, string> = {}
    const MAX_EXPERIENCES = 5

    const experiences = systemData?.experiences

    // 1. Setup the tracker using the random string IDs
    // Shape: { "rAndOmId": { name: "Thief", total: 2 } }
    const expTracker: Record<string, { name: string, total: number }> = {}

    if (experiences) {
        for (const [id, expData] of Object.entries(experiences)) {
            expTracker[id] = {
                name: expData.name ?? '',
                total: Number(expData.value ?? 0),
            }
        }
    }

    // 2. Scan Level-ups for modifiers and apply them to the tracker
    const levelups = systemData?.levelData?.levelups
    const currentLevel = systemData?.levelData?.level?.current ?? 1

    if (levelups) {
        for (let lvl = 2; lvl <= currentLevel; lvl++) {
            const levelKey = String(lvl)
            const levelupData = levelups[levelKey]

            if (levelupData && Array.isArray(levelupData.selections)) {
                levelupData.selections.forEach(selection => {
                    // Check top-level selections
                    if (selection?.type === 'experience') {
                        const bonus = Number(selection?.value ?? 0)
                        const targetIds = selection?.data

                        // Loop through all IDs modified by this specific level-up
                        if (Array.isArray(targetIds) && !isNaN(bonus)) {
                            targetIds.forEach(id => {
                                if (expTracker[id]) {
                                    expTracker[id].total += bonus;
                                }
                            });
                        }
                    }

                    // Failsafe: Check nested selections arrays (common in Foundry structures)
                    if (Array.isArray(selection?.selections)) {
                        selection.selections.forEach(subSelection => {
                            if (subSelection?.type === 'experience') {
                                const bonus = Number(subSelection.value ?? 0);
                                const targetIds = subSelection.data;
                                
                                if (Array.isArray(targetIds) && !isNaN(bonus)) {
                                    targetIds.forEach(id => {
                                        if (expTracker[id]) {
                                            expTracker[id].total += bonus;
                                        }
                                    });
                                }
                            }
                        });
                    }
                })
            }
        }
    }

    // 3. Convert the accumulated tracker data into the exact PDF field names
    const finalExperiences = Object.values(expTracker)

    for (let i = 0; i < MAX_EXPERIENCES; i++) {
        const exp = finalExperiences[i]
        const slotNum = i + 1 // 1 to 5

        if (exp) {
            mappings[`Experience ${slotNum}`] = exp.name
            mappings[`Experience ${slotNum} Bonus`] = getModString(exp.total) || ''
        } else {
            // Fill empty slots so the PDF doesn't display undefined or old data
            mappings[`Experience ${slotNum}`] = '';
            mappings[`Experience ${slotNum} Bonus`] = '';
        }
    }

    return mappings
}

export function compileHopeGained(systemData: FoundrySystem) {
    const mappings: Record<string, boolean> = {}
    const MAX_HOPE = systemData?.resources?.hope?.max ?? 6

    // Safely extract the value, defaulting to 0 if missing
    const currentHope = systemData?.resources?.hope?.value ?? 0

    for (let i = 1; i <= MAX_HOPE; i++) {
        mappings[`Hope ${i}`] = i <= currentHope;
    }

    return mappings
}

export function compileHitPointMarks(systemData: FoundrySystem) {
    const mappings: Record<string, boolean> = {}
    const MAX_HP_BOXES = 12

    // Safely extract the value, defaulting to 0 if missing
    const currentHP = systemData?.resources?.hitPoints?.value ?? 0

    for (let i = 1; i <= MAX_HP_BOXES; i++) {
        mappings[`HP ${i}`] = i <= currentHP;
    }

    return mappings
}

export function compileHeritageFeatures(itemsData: FoundryItem) {
    const ancestryLines: string[] = []
    const communityLines: string[] = []

    // --- 1. Process Ancestry ---
    const ancestryItem = itemsData.find(item => item.type === 'ancestry')

    if (ancestryItem) {
        ancestryLines.push(`Ancestry: ${ancestryItem.name ?? 'Unknown'}`)

        // Find primary feature
        const primaryFeature = itemsData.find(item =>
            item.type === 'feature' &&
            item.system?.originItemType === 'ancestry' &&
            item.system?.identifier === 'primary'
        )

        if (primaryFeature) {
            ancestryLines.push(`${primaryFeature.name}: ${stripHtml(primaryFeature.system.description)}`)
        }

        // Find secondary feature
        const secondaryFeature = itemsData.find(item =>
            item.type === 'feature' &&
            item.system?.originItemType === 'ancestry' &&
            item.system?.identifier === 'secondary'
        )

        if (secondaryFeature) {
            ancestryLines.push(`${secondaryFeature.name}: ${stripHtml(secondaryFeature.system.description)}`)
        }
    }

    // --- 2. Process Community ---
    const communityItem = itemsData.find(item => item.type === 'community')

    if (communityItem) {
        communityLines.push(`Community: ${communityItem?.name ?? 'Unknown'}`)

        if (communityItem.system?.description) {
            communityLines.push(`${communityItem.name}: ${stripHtml(communityItem.system?.description)}`)
        }
    }

    // --- 3. Assemble final output ---
    const finalBlocks: string[] = []

    if (ancestryLines.length > 0) {
        finalBlocks.push(ancestryLines.join('\n'))
    }

    if (communityLines.length > 0) {
        finalBlocks.push(communityLines.join('\n'))
    }

    return finalBlocks.join('\n\n')
}

function calcHpMods(systemData: FoundrySystem, itemData: FoundryItem) {
    let totalHpMod = 0

    // Apply advancements
    totalHpMod += calcLevelUpMods(systemData, 'hitPoint')

    // Apply features
    // totalHpMod = calcFeatureMods(itemData, 'system.resources.hitPoints.max', totalHpMod)

    // Apply domain cards
    totalHpMod = calcDomainCardMods(itemData, 'system.resources.hitPoints.max', totalHpMod)

    return totalHpMod
}

function calcLevelUpMods(systemData: FoundrySystem, selectionType: string) {
    let totalMods = 0

    const levelups = systemData?.levelData?.levelups
    const currentLevel = systemData.levelData?.level?.current ?? 1

    if (levelups) {
        for (let lvl = 2; lvl <= currentLevel; lvl++) {
            const levelKey = String(lvl)
            const levelupData = levelups[levelKey]

            if (levelupData && Array.isArray(levelupData.selections)) {
                levelupData.selections.forEach(selection => {
                    // Check if the top-level selection is flagged as an HP upgrade
                    if (selection?.type === selectionType) {
                        const parsedValue = Number(selection.value ?? 0);
                        if (!isNaN(parsedValue)) {
                            totalMods += parsedValue;
                        }
                    }

                    // Failsafe: Just in case the HP choice is buried one layer deeper
                    // in a sub-selection array (similar to how Traits are stored)
                    if (Array.isArray(selection?.selections)) {
                        selection.selections.forEach(subSelection => {
                            if (subSelection?.type === selectionType) {
                                const parsedValue = Number(subSelection.value ?? 0);
                                if (!isNaN(parsedValue)) {
                                    totalMods += parsedValue;
                                }
                            }
                        });
                    }
                })
            }
        }
    }

    return totalMods
}

function calcDomainCardMods(itemData: FoundryItem, resourceKey: string, currentTotal: number) {
    let runningTotal = currentTotal

    const domainCards = itemData.filter(item => item.type === 'domainCard')

    domainCards.forEach(card => {
        // 1. Determine if the card is affecting the player right now
        const isEquipped = card.system?.inVault === false
        const isPermanentlyActive = card.system?.inVault === true && card.system?.vaultActive === true

        if (isEquipped || isPermanentlyActive) {
            // Loop through the active effects
            if (Array.isArray(card.effects)) {
                card.effects.forEach(effect => {
                    // Skip if the effect is explicitly turned off
                    if (effect.disabled === true) return

                    const changes = effect.system?.changes

                    if (Array.isArray(changes)) {
                        changes.forEach(change => {
                            runningTotal = applyEffectChange(change, resourceKey, runningTotal)
                        })
                    }
                })
            }
        }
    })

    return runningTotal
}

export function getTotalHp(systemData: FoundrySystem, itemData: FoundryItem) {
    const mainClass = itemData.find(item => item.type === 'class' && !item.system.isMultiClass)
    const baseHp = mainClass?.system?.hitPoints ?? 0
    const hpMod = calcHpMods(systemData, itemData)
    return baseHp + hpMod
}

export function getInventory(itemData: FoundryItem) {
    const inventory = itemData
                        .filter(item => item.type === 'consumable' || item.type === 'loot')
                        .map(item => item.name)
    return inventory.join('\n')
}

function calcFeatureMods(itemData: FoundryItem, resourceKey: string, currentTotal: number) {
    let runningTotal = currentTotal

    const features = itemData.filter(item => item.type === 'feature')

    features.forEach(feature => {
        if (Array.isArray(feature.effects)) {
            feature.effects.forEach(effect => {
                // Skip if the effect itself is explicitly turned off
                if (effect.disabled === true) return

                const changes = effect.system?.changes

                if (Array.isArray(changes)) {
                    changes.forEach(change => {
                        runningTotal = applyEffectChange(change, resourceKey, runningTotal)
                    })
                }
            })
        }
    })

    return runningTotal
}

function applyEffectChange(change: FoundryEffectChange, resourceKey: string, currentTotal: number) {
    // 1. If the key doesn't match the target, return the total unchanged
    if (change.key !== resourceKey) return currentTotal

    // 2. Extract the numeric value safely
    const rawValue = change.value
    const mathValue = Number(
        typeof rawValue === 'object' && rawValue !== null
            ? (rawValue.max ?? rawValue.current ?? 0)
            : rawValue
    )

    // 3. If the value is invalid, bail out and return the total unchanged
    if (isNaN(mathValue)) return currentTotal

    // 4. Determine the operation (coerced to string for safe switch matching)
    const opType = String(change.type ?? 'add')

    // 5. Apply the math and return the new result
    switch (opType) {
        case 'add':
            return currentTotal + mathValue
        case 'subtract':
            return currentTotal - mathValue
        case 'multiply':
            return currentTotal * mathValue
        case 'override':
            return mathValue
        default:
            return currentTotal + mathValue
    }
}