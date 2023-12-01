import ImportTypeXLSXHandler from './ImportTypeXLSXHandler';

export default class ImportTypeXLSHandler extends ImportTypeXLSXHandler {
    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!ImportTypeXLSHandler.instance) {
            ImportTypeXLSHandler.instance = new ImportTypeXLSHandler();
        }
        return ImportTypeXLSHandler.instance;
    }

    protected static instance: ImportTypeXLSHandler = null;

    protected constructor() {
        super();
    }
}
