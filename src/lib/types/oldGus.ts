export type Field = {
    name: string;
    type: 'PDFTextField' | 'PDFCheckBox';
    value: string | boolean | undefined;
}