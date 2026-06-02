import { z } from 'zod';

export const LevelupSchema = z.looseObject({
    achievements: z.looseObject({
        domainCards: z.array(z.looseObject({
            uuid: z.string(),
        })),
        experiences: z.looseObject({}),
        proficiency: z.number().nullable(),
    }),
    selections: z.array(z.looseObject({
        data: z.array(z.string()),
        optionKey: z.string(),
        type: z.string(),
        value: z.number().nullable(),
    })),
})

export const FoundrySchema = z.looseObject({
    name: z.string(),
    effects: z.array(z.looseObject({
        name: z.string(),
        description: z.string(),
    })),
    items: z.array(z.looseObject({
        name: z.string(),
        type: z.string(),
        system: z.looseObject({}),
    })),
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
        experiences: z.looseObject({}),
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
            }),
            hope: z.looseObject({
                value: z.number(),
            }),
            stress: z.looseObject({
                value: z.number(),
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