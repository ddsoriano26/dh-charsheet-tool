// Reexport your entry components here
export { extractFieldsAndValues } from './utils/fileExtractionUtils.ts';
export { populateOldGus } from './utils/jsonPdf.ts';
export {
    getFinalTraits,
    getTraitModifier,
    isTraitMarked,
    compileArmorMarked,
    getTotalArmor,
    getAllClasses,
    compileClassFeatures,
    getHopeFeature,
    getAllDomains,
    getTotalEvasion,
    compileExperiencesMappings,
    compileHopeGained,
    compileHitPointMarks,
} from './utils/foundryScanner.ts';
export {
    capitalize,
    stripHtml,
} from './utils/stringManipulation.ts';

export { FoundrySchema } from './types/foundry.ts';

export type { Foundry, FoundrySystem, FoundryItem }  from './types/foundry.ts';
export type { Field, Trait } from './types/oldGus.ts';