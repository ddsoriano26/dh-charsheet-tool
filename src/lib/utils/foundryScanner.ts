import {
    capitalize,
    stripHtml,
    type FoundryEffectChange,
    type FoundryItem,
    type FoundryItemSingle,
    type FoundrySystem,
    type LevelSchema,
    type LevelUpSelections,
    type SubclassUnlockState,
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

function calcArmorMods(systemData: FoundrySystem, itemData: FoundryItem) {
    let totalArmorMod = 0

    // 1. Grab the unlock state
    const unlockedTiers = getUnlockedSubclassTiers(systemData)

    const features = itemData?.filter(item => item.type === 'feature') ?? []

    features.forEach(item => {
        // 2. Subclass unlock check
        if (!isSubclassUnlocked(item, unlockedTiers)) return

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

export function getTotalArmor(systemData: FoundrySystem, itemData: FoundryItem) {
    const baseArmor = Number(itemData.find(item => item.type === 'armor')?.system.armor?.max)
    const armorMod = calcArmorMods(systemData, itemData)
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
    majorThreshold = calcFeatureMods(systemData, itemData, 'system.damageThresholds.major', majorThreshold)

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
    severeThreshold = calcFeatureMods(systemData, itemData, 'system.damageThresholds.severe', severeThreshold)

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

export function compileClassFeatures(systemData: FoundrySystem, itemData: FoundryItem) {
    const blocks: string[] = []

    // --- 1. Identify main class and subclasses ---
    const allClasses = itemData.filter(item => item.type === 'class')
    const mainClass = allClasses.find(item => !item.system?.isMultiClass)
    const secondaryClasses = allClasses.filter(item => item !== mainClass)

    const allSubclasses = itemData.filter(item => item.type === 'subclass')
    const mainSubclass = allSubclasses.find(item => !item.system?.multiclassOrigin)
    const secondarySubclasses = allSubclasses.filter(item => item !== mainSubclass)

    // --- 2. Calculate tier/level-up unlocks ---
    const unlockedTiers = getUnlockedSubclassTiers(systemData)
    const features = itemData.filter(item => item.type === 'feature')

    // --- 3. Filter standard class features ---
    const mainClassFeatures = features.filter(feature => feature.system?.identifier === 'class' && !feature.system?.multiclassOrigin)
    const secondaryClassFeatures = features.filter(feature => feature.system?.identifier === 'class' && feature.system?.multiclassOrigin)

    // --- 4. Filter subclass features ---
    const subclassTiers = ['foundation', 'specialization', 'mastery']

    const mainSubclassFeatures = features.filter(feature =>
        feature.system?.identifier &&
        subclassTiers.includes(feature.system.identifier) &&
        !feature.system?.multiclassOrigin &&
        isSubclassUnlocked(feature, unlockedTiers)
    )
    const secondarySubclassFeatures = features.filter(feature =>
        feature.system?.identifier &&
        subclassTiers.includes(feature.system.identifier) &&
        feature.system?.multiclassOrigin === true &&
        isSubclassUnlocked(feature, unlockedTiers)
    )

    // --- 5. Helper: Build subclass tiers ---
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

    // --- 6. Assemble the Output ---

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
    totalEvasionMod = calcFeatureMods(systemData, itemData, 'system.evasion', totalEvasionMod)

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
    totalHpMod = calcFeatureMods(systemData, itemData, 'system.resources.hitPoints.max', totalHpMod)

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

function calcFeatureMods(
    systemData: FoundrySystem,
    itemData: FoundryItem,
    resourceKey: string,
    currentTotal: number
){
    let runningTotal = currentTotal

    // 1. Grab the unlock state
    const unlockedTiers = getUnlockedSubclassTiers(systemData)

    const features = itemData.filter(item => item.type === 'feature')

    features.forEach(feature => {
        // 2. Subclass unlock check
        if (!isSubclassUnlocked(feature, unlockedTiers)) return

        // 3. Process the math effects if it passes the check
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

function isSubclassUnlocked(
    feature: FoundryItemSingle,
    unlockedTiers: { main: SubclassUnlockState, secondary: SubclassUnlockState },
){
    const identifier = feature.system?.identifier as keyof SubclassUnlockState

    // 1. If it's not a subclass feature at all, it passes automatically
    if (identifier !== 'foundation' && identifier !== 'specialization' && identifier !== 'mastery') return true

    // 2. Check the unlock state based on its origin
    const isSecondary = feature.system?.multiclassOrigin === true

    if (isSecondary) {
        return !!unlockedTiers.secondary[identifier]
    } else {
        return !!unlockedTiers.main[identifier]
    }
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

export function getUnlockedSubclassTiers(systemData: FoundrySystem) {
    let mainAdvances = 0
    let secondaryAdvances = 0

    const levelups = systemData?.levelData?.levelups
    const currentLevel = systemData?.levelData?.level?.current ?? 1

    if (levelups) {
        for (let lvl = 2; lvl <= currentLevel; lvl++) {
            const levelupData = levelups[String(lvl)]
            if (levelupData && Array.isArray(levelupData.selections)) {
                // Helper to check advancement type
                const processSelection = (selection: LevelUpSelections) => {
                    if (selection?.type === 'subclass') {
                        if (selection.secondaryData?.isMulticlass === "true") {
                            secondaryAdvances += 1
                        } else if (selection.secondaryData?.isMulticlass === "false") {
                            mainAdvances += 1
                        }
                    }
                }

                levelupData.selections.forEach(selection => {
                    processSelection(selection)
                })
            }
        }
    }

    return {
        main: {
            foundation: true, // Always available if they have the class
            specialization: mainAdvances >= 1,
            mastery: mainAdvances >= 2,
        },
        secondary: {
            foundation: true, // Always available if they multiclassed
            specialization: secondaryAdvances >= 1,
            mastery: secondaryAdvances >= 2,
        }
    }
}

export function getNotes(systemData: FoundrySystem) {
    const background = systemData.biography.background
    const connections = systemData.biography.connections
    const allNotes: string[] = []

    if (background) {
        allNotes.push(`BACKGROUND:${replaceHtml(background, '\n')}`)
    }

    if (connections) {
        allNotes.push(`CONNECTIONS:${replaceHtml(connections, '\n')}`)
    }

    return allNotes.join('\n')
}

function replaceHtml(text: string, replaceChar: string) {
    return text.replace(/(<[^>]+>)+/g, replaceChar)
}

export function compileProficiencyMarks(systemData: FoundrySystem) {
    const mappings: Record<string, boolean> = {}
    const MAX_PROF_BOXES = 6

    let currentProficiency = getTierFromLevel(systemData.levelData.level.current ?? 1)

    currentProficiency += calcLevelUpMods(systemData, 'proficiency')

    for (let i = 1; i <= MAX_PROF_BOXES; i++) {
        mappings[`Proficiency ${i}`] = i <= currentProficiency;
    }

    return mappings
}

export function getTierFromLevel(level: number) {
    // Failsafe for invalid/missing data or level 1
    if (level <= 1) return 1;
    
    // Levels 2, 3, and 4
    if (level <= 4) return 2;
    
    // Levels 5, 6, and 7
    if (level <= 7) return 3;
    
    // Levels 8, 9, 10 (and catches any homebrew levels above 10)
    return 4; 
}

export function getSpellcastTrait(itemData: FoundryItem) {
    const mainSubclass = itemData.find(item => item.type === 'subclass' && !item.system.isMultiClass)
    return capitalize(mainSubclass?.system.spellcastingTrait)
}

export function calcStressMods(systemData: FoundrySystem, itemData: FoundryItem) {
    let totalStressMod = 0

    // Apply advancements
    totalStressMod += calcLevelUpMods(systemData, 'stress')

    // Apply features
    totalStressMod = calcFeatureMods(systemData, itemData, 'system.resources.stress.max', totalStressMod)

    // Apply domain cards
    totalStressMod = calcDomainCardMods(itemData, 'system.resources.stress.max', totalStressMod)

    return totalStressMod
}

export function compileStressMarks(systemData: FoundrySystem) {
    const mappings: Record<string, boolean> = {}
    const MAX_STRESS_BOXES = 12

    // Safely extract the value, defaulting to 0 if missing
    const currentStress = systemData?.resources?.stress.value ?? 0

    for (let i = 1; i <= MAX_STRESS_BOXES; i++) {
        mappings[`Stress ${i}`] = i <= currentStress;
    }

    return mappings
}

export function getAllSubclasses(itemData: FoundryItem) {
    const subclassItems = itemData.filter(item => item.type === 'subclass')
    
    if (subclassItems.length <= 0) return 'No subclass'

    const mainSubclass = subclassItems.find(subclassItem => !subclassItem.system?.isMultiClass)
    const mainSubclassName = mainSubclass ? mainSubclass.name : subclassItems[0].name

    if (subclassItems.length === 1) return mainSubclassName

    const secondarySubclasses = subclassItems.filter(item => item !== mainSubclass)
    const secondarySubclassNames = secondarySubclasses.map(item => item.name)

    return [mainSubclassName, ...secondarySubclassNames].join(' / ')
}

export function compileAdvancementMappings(systemData: FoundrySystem) {
    const mappings: Record<string, boolean> = {}

    // 1. Initialize slot counters for each tier
    const tierCounts = {
        2: {
            domainCard: 0,
            evasion: 0,
            experience: 0,
            hitPoint: 0,
            stress: 0,
            trait: 0,
            subclass: 0,
            proficiency: 0,
            multiclass: 0,
        },
        3: {
            domainCard: 0,
            evasion: 0,
            experience: 0,
            hitPoint: 0,
            stress: 0,
            trait: 0,
            subclass: 0,
            proficiency: 0,
            multiclass: 0,
        },
        4: {
            domainCard: 0,
            evasion: 0,
            experience: 0,
            hitPoint: 0,
            stress: 0,
            trait: 0,
            subclass: 0,
            proficiency: 0,
            multiclass: 0,
        },
    }

    const levelups = systemData?.levelData?.levelups

    if (levelups) {
        for (const [levelKey, levelupData] of Object.entries(levelups)) {
            const currentLevel = Number(levelKey)
            const currentTier = getTierFromLevel(currentLevel)

            if (levelupData && Array.isArray((levelupData as LevelSchema).selections)) {
                const processSelection = (selection: LevelUpSelections) => {
                    const type = selection?.type
                    if (!type) return

                    const targetTier = Number(selection.tier) || currentTier

                    if (targetTier >= 2 && targetTier <= 4) {
                        const value = selection.value === null || selection.value === undefined ? 1 : Number(selection.value)
                        const minCost = Number(selection.minCost ?? 1)
                        const totalSlots = value * minCost

                        const bucket = tierCounts[targetTier as 2 | 3 | 4]

                        // --- The Check Router ---
                        if (type === 'domainCard') bucket.domainCard += totalSlots
                        else if (type === 'hitPoint') bucket.hitPoint += totalSlots
                        else if (type === 'evasion') bucket.evasion += totalSlots
                        else if (type === 'stress') bucket.stress += totalSlots
                        else if (type === 'experience') bucket.experience += totalSlots
                        else if (type === 'trait') bucket.trait += totalSlots
                        else if (type === 'subclass') bucket.subclass += totalSlots
                        else if (type === 'proficiency') bucket.proficiency += totalSlots
                        else if (type === 'multiclass') bucket.multiclass += totalSlots
                    }
                }

                levelupData.selections.forEach(selection => {
                    processSelection(selection)
                })
            }
        }
    }

    [2, 3, 4].forEach(tier => {
        const counts = tierCounts[tier as 2 | 3 | 4]

        // Single slot items
        mappings[`Tier ${tier}, Domain Card`] = counts.domainCard >= 1
        mappings[`Tier ${tier}, Evasion`] = counts.evasion >= 1
        mappings[`Tier ${tier}, Experiences`] = counts.experience >= 1

        // Hit point (2 slots)
        mappings[`Tier ${tier}, Hit Point, Slot 1`] = counts.hitPoint >= 1
        mappings[`Tier ${tier}, Hit Point, Slot 2`] = counts.hitPoint >= 2

        // Stress (2 slots)
        mappings[`Tier ${tier}, Stress, Slot 1`] = counts.stress >= 1
        mappings[`Tier ${tier}, Stress, Slot 2`] = counts.stress >= 2

        // Traits (3 slots)
        mappings[`Tier ${tier}, Traits, Slot 1`] = counts.trait >= 1
        mappings[`Tier ${tier}, Traits, Slot 2`] = counts.trait >= 2
        mappings[`Tier ${tier}, Traits, Slot 3`] = counts.trait >= 3

        // Enhanced subclass and proficiency (Tiers 3 and 4 only)
        if (tier >= 3) {
            mappings[`Tier ${tier}, Enhanced Subclass`] = counts.subclass >= 1
            mappings[`Tier ${tier}, Proficiency`] = counts.proficiency >= 1
        }
    })

    // 3. Shared Tier 3-4 multiclassing field
    mappings[`Tier 3-4, Multiclassing`] = tierCounts[3].multiclass >= 1 || tierCounts[4].multiclass >= 1

    return mappings
}

export function compileWeaponMappings(itemData: FoundryItem) {
    const mappings: Record<string, string | boolean> = {}
    const MAX_WEAPONS = 4

    // 1. Isolate and safely sort weapons: Equipped Primary > Equipped Secondary > Unequipped Primary > Uneqipped Secondary
    const weapons = itemData
                        .filter(item => item.type === 'weapon')
                        .sort((a, b) => {
                            const aEquipped = a.system?.equipped ? 1 : 0
                            const bEquipped = b.system?.equipped ? 1 : 0
                            if (aEquipped !== bEquipped) return bEquipped - aEquipped

                            // If equipped status is the same, put primary (secondary === false) first
                            const aPrimary = a.system?.secondary ? 0 : 1
                            const bPrimary = b.system?.secondary ? 0 : 1
                            return bPrimary - aPrimary
                        })

    // 2. The Hand Allocator state
    let hand1Taken = false
    let hand2Taken = false

    // 3. Process up to 4 weapon slots
    for (let i = 0; i < MAX_WEAPONS; i++) {
        const weaponOrder = i +1
        const weapon = weapons[i]

        // Failsafe: Clear out remaining slots if character has fewer than 4 weapons
        if (!weapon) {
            mappings[`Weapon ${weaponOrder} Active`] = false
            mappings[`Weapon ${weaponOrder} Damage and Type`] = ''
            mappings[`Weapon ${weaponOrder} Feature`] = ''
            mappings[`Weapon ${weaponOrder} Hand 1`] = false
            mappings[`Weapon ${weaponOrder} Hand 2`] = false
            mappings[`Weapon ${weaponOrder} Label`] = ''
            mappings[`Weapon ${weaponOrder} Trait and Range`] = ''
            mappings[`Weapon ${weaponOrder} Type`] = ''
            continue
        }

        const system = weapon.system || {}
        const isEquipped = system.equipped === true
        const isSecondary = system.secondary === true
        const burden = system.burden

        // --- Hand Allocation Logic ---
        let weaponHand1 = false
        let weaponHand2 = false

        if (isEquipped) {
            if (burden === 'twoHanded' && !hand1Taken && !hand2Taken) {
                weaponHand1 = true
                weaponHand2 = true
                hand1Taken = true
                hand2Taken = true
            } else if (burden === 'oneHanded') {
                if (!isSecondary && !hand1Taken) {
                    weaponHand1 = true
                    hand1Taken = true
                } else if (isSecondary && !hand2Taken) {
                    weaponHand2 = true
                    hand2Taken = true
                }
            }
        }

        // --- Damage and Type Logic ---
        const dmgValue = system.attack?.damage?.value
        const dice = system.attack?.roll?.diceRolling?.dice
        const rawBonus = Number(dmgValue?.bonus) || 0
        const multiplier = system.attack?.roll?.diceRolling?.multiplier

        let bonusStr = ''
        if (rawBonus > 0) bonusStr += ` + ${rawBonus}`
        else if (rawBonus < 0) bonusStr += ` - ${Math.abs(rawBonus)}`

        let damageStr = ''
        if (multiplier === 'prof') {
            damageStr += `${dice}${bonusStr} proficiency`.trim()
        } else {
            const parsedMult = Number(multiplier)
            const finalMult = isNaN(parsedMult) || parsedMult === 0 ? '1' : String(parsedMult)
            damageStr += `${finalMult}${dice}${bonusStr}`.trim()
        }

        const typeArr = Array.isArray(system.attack?.damage?.type) ? system.attack.damage.type: []
        const typeStr = typeArr.map(type => capitalize(type)).join(', ')
        const finalDamageAndType = typeStr ? `${damageStr}, ${typeStr}` : damageStr

        // --- Feature logic ---
        const effectsArr = Array.isArray(weapon.effects) ? weapon.effects : []
        const featuresStr = effectsArr
                                .map(effect => `${effect.name}: ${stripHtml(effect.description)}`)
                                .join('\n')

        // --- Trait and Range logic ---
        const trait = capitalize(system.attack?.roll?.trait)
        const range = capitalize(system.attack?.range)
        let traitAndRange = ''
        if (trait && range) traitAndRange = `${trait} / ${range}`
        else if (trait) traitAndRange = trait
        else if (range) traitAndRange = range

        // --- Mapping Assignments ---
        mappings[`Weapon ${weaponOrder} Active`] = isEquipped
        mappings[`Weapon ${weaponOrder} Damage and Type`] = finalDamageAndType
        mappings[`Weapon ${weaponOrder} Feature`] = featuresStr
        mappings[`Weapon ${weaponOrder} Hand 1`] = weaponHand1
        mappings[`Weapon ${weaponOrder} Hand 2`] = weaponHand2
        mappings[`Weapon ${weaponOrder} Label`] = weapon.name || ''
        mappings[`Weapon ${weaponOrder} Trait and Range`] = traitAndRange
        mappings[`Weapon ${weaponOrder} Type`] = isSecondary ? 'Secondary' : 'Primary'
    }

    return mappings
}