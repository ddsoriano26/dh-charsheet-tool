// Reexport your entry components here
export { extractFieldsAndValues } from './utils/fileExtractionUtils.ts';
export { populateOldGus } from './utils/jsonPdf.ts';
export {
    getFinalTraits,
    getTraitModifier,
    isTraitMarked,
    compileArmorMarked,
    getTotalArmor,
    getLeveledBaseThresholds,
    getMajorThreshold,
    getSevereThreshold,
    getAllClasses,
    compileClassFeatures,
    getHopeFeature,
    getAllDomains,
    getTotalEvasion,
    compileExperiencesMappings,
    compileHopeGained,
    compileHitPointMarks,
    compileHeritageFeatures,
    getTotalHp,
    getInventory,
} from './utils/foundryScanner.ts';
export {
    capitalize,
    stripHtml,
} from './utils/stringManipulation.ts';

export { FoundrySchema } from './types/foundry.ts';

export type {
    Foundry,
    FoundrySystem,
    FoundryItem,
    FoundryEffectChange
}  from './types/foundry.ts';
export type { Field, Trait, SubclassUnlockState } from './types/oldGus.ts';