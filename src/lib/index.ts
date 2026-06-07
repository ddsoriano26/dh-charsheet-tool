// Reexport your entry components here
export { extractFieldsAndValues } from './utils/fileExtractionUtils.ts';
export { populateOldGus, generateAndDownload } from './utils/jsonPdf.ts';
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
    getNotes,
    compileProficiencyMarks,
    getTierFromLevel,
    getSpellcastTrait,
    calcStressMods,
    compileStressMarks,
    getAllSubclasses,
    compileAdvancementMappings,
    compileWeaponMappings,
} from './utils/foundryScanner.ts';
export {
    capitalize,
    stripHtml,
    sanitizeForPdf,
} from './utils/stringManipulation.ts';

export { FoundrySchema } from './types/foundry.ts';

export type {
    Foundry,
    FoundrySystem,
    FoundryItem,
    FoundryEffectChange,
    LevelUpSelections,
    FoundryItemSingle,
    LevelSchema,
}  from './types/foundry.ts';
export type {
    Field,
    Trait,
    SubclassUnlockState
} from './types/oldGus.ts';