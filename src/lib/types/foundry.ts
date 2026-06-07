import { z } from 'zod';

export const LevelupSelectionSchema = z.looseObject({
    data: z.array(z.string()),
    optionKey: z.string(),
    type: z.string(),
    value: z.number().nullable(),
    secondaryData: z.looseObject({
        featureState: z.string().optional(),
        isMulticlass: z.string().optional(),
    }).optional(),
    tier: z.number().optional(),
    minCost: z.number(),
})

export const LevelupSchema = z.looseObject({
    achievements: z.looseObject({
        domainCards: z.array(z.looseObject({
            uuid: z.string(),
        })),
        experiences: z.looseObject({}),
        proficiency: z.number().nullable(),
    }),
    selections: z.array(LevelupSelectionSchema),
})

export const EffectChangeSchema = z.looseObject({
    key: z.string().optional(),
    type: z.string(),
    value: z.string().or(z.number()).or(z.looseObject({
        current: z.number().or(z.string()).or(z.looseObject({

        })).optional(),
        max: z.number().or(z.string()).or(z.looseObject({
            
        })).optional(),
    })),
    disabled: z.boolean().optional(),
})

export const FoundrySingleItem = z.looseObject({
    name: z.string(),
    type: z.string(),
    effects: z.array(z.looseObject({
        name: z.string(),
        description: z.string(),
        system: z.looseObject({
            changes: z.array(EffectChangeSchema).optional(),
        }),
        disabled: z.boolean().optional(),
    })),
    system: z.looseObject({
        description: z.string(),
        armor: z.looseObject({
            current: z.number(),
            max: z.number(),
        }).optional(),
        baseThresholds: z.looseObject({
            major: z.number(),
            severe: z.number(),
        }).optional(),
        isMultiClass: z.boolean().optional(),
        identifier: z.string().optional(),
        multiclassOrigin: z.boolean().optional(),
        domain: z.string().optional(),
        inVault: z.boolean().optional(),
        vaultActive: z.boolean().optional(),
        level: z.number().optional(),
        loadoutIgnore: z.boolean().optional(),
        recallCost: z.number().optional(),
        type: z.string().optional(),
        domains: z.array(z.string()).optional(),
        evasion: z.number().optional(),
        hitPoints: z.number().optional(),
        originItemType: z.string().nullable().optional(),
        spellcastingTrait: z.string().optional(),
        attack: z.looseObject({
            actionType: z.string(),
            damage: z.looseObject({
                direct: z.boolean(),
                type: z.array(z.string()).optional(),
                value: z.looseObject({
                    bonus: z.number(),
                    custom: z.looseObject({
                        enabled: z.boolean(),
                        formula: z.string(),
                    }),
                }).optional(),
            }),
            roll: z.looseObject({
                trait: z.string(),
                type: z.string(),
                diceRolling: z.looseObject({
                    dice: z.string(),
                    flatMultiplier: z.number(),
                    multiplier: z.string(),
                }),
            }),
            range: z.string(),
        }).optional(),
        burden: z.string().optional(),
        secondary: z.boolean().optional(),
        equipped: z.boolean().optional(),
    }),
})

export const FoundrySchema = z.looseObject({
    name: z.string(),
    effects: z.array(z.looseObject({
        name: z.string(),
        description: z.string(),
    })),
    items: z.array(FoundrySingleItem),
    system: z.looseObject({
        biography: z.looseObject({
            background: z.string(),
            connections: z.string(),
            characteristics: z.looseObject({
                pronouns: z.string(),
            })
        }),
        bonuses: z.looseObject({
            damage: z.looseObject({}),
            healing: z.looseObject({}),
            maxLoadout: z.number(),
            roll: z.looseObject({}),
        }),
        damageThresholds: z.looseObject({
            major: z.number(),
            severe: z.number(),
        }),
        evasion: z.number(),
        experiences: z.record(
            z.string(), // The randomly generated keys
            z.looseObject({
                core: z.boolean(),
                name: z.string(),
                value: z.union([z.number(), z.string()]),
            })
        ),
        gold: z.looseObject({
            bags: z.number(),
            chests: z.number(),
            coins: z.number(),
            handfuls: z.number(),
        }),
        levelData: z.looseObject({
            level: z.looseObject({
                changed: z.number(),
                current: z.number(),
            }),
            levelups: z.record(z.string(), LevelupSchema),
            // levelups: z.looseObject({}),
        }),
        proficiency: z.number(),
        resistance: z.looseObject({
            magical: z.looseObject({
                resistance: z.boolean(),
                immunity: z.boolean(),
                reduction: z.number(),
            }),
            physical: z.looseObject({
                resistance: z.boolean(),
                immunity: z.boolean(),
                reduction: z.number(),
            }),
        }),
        resources: z.looseObject({
            hitPoints: z.looseObject({
                value: z.number(),
                max: z.number().nullable(),
            }),
            hope: z.looseObject({
                value: z.number(),
                max: z.number().nullable(),
            }),
            stress: z.looseObject({
                value: z.number(),
                max: z.number().nullable(),
            }),
        }),
        traits: z.looseObject({
            agility: z.looseObject({
                value: z.number(),
            }),
            finesse: z.looseObject({
                value: z.number(),
            }),
            instinct: z.looseObject({
                value: z.number(),
            }),
            knowledge: z.looseObject({
                value: z.number(),
            }),
            presence: z.looseObject({
                value: z.number(),
            }),
            strength: z.looseObject({
                value: z.number(),
            }),
        }),
    }),
});

export type Foundry = z.infer<typeof FoundrySchema>;
export type FoundrySystem = Foundry['system'];
export type FoundryItem = Foundry['items'];
export type FoundryEffectChange = z.infer<typeof EffectChangeSchema>;
export type LevelUpSelections = z.infer<typeof LevelupSelectionSchema>;
export type FoundryItemSingle = z.infer<typeof FoundrySingleItem>;
export type LevelSchema = z.infer<typeof LevelupSchema>;