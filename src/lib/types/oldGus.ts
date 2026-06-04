export type Field = {
    name: string;
    type: 'PDFTextField' | 'PDFCheckBox';
    value: string | boolean | undefined;
}

export type Trait = 'agility' | 'strength' | 'finesse' | 'instinct' | 'knowledge' | 'presence'

export type SubclassUnlockState = {
    foundation: boolean;
    specialization: boolean;
    mastery: boolean;
}