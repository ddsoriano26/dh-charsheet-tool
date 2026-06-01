import {
    PDFDocument,
    PDFTextField,
    PDFCheckBox,
    PDFDropdown,
    PDFOptionList,
    PDFRadioGroup
} from 'pdf-lib';

export async function extractFieldsAndValues(fileData: ArrayBuffer) {
    const pdfDoc = await PDFDocument.load(fileData);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    return fields.map(field => {
        const name = field.getName();
        let value = null;

        // Extract value based on the specific field type
        if (field instanceof PDFTextField) {
            value = field.getText();
        } else if (field instanceof PDFCheckBox) {
            value = field.isChecked(); // Returns true or false
        } else if (field instanceof PDFDropdown) {
            value = field.getSelected(); // Returns an array of selected strings
        } else if (field instanceof PDFOptionList) {
            value = field.getSelected(); // Returns an array of selected strings
        } else if (field instanceof PDFRadioGroup) {
            value = field.getSelected(); // Returns the selected string option
        }

        return {
            name,
            type: field.constructor.name,
            value,
        };
    });
}