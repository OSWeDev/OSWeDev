/**
 * @class ExportContextQueryToXLSXManager
 */
export default class ExportContextQueryToXLSXManager {

    // istanbul ignore next: nothing to test
    public static getInstance(): ExportContextQueryToXLSXManager {
        if (!ExportContextQueryToXLSXManager.instance) {
            ExportContextQueryToXLSXManager.instance = new ExportContextQueryToXLSXManager();
        }
        return ExportContextQueryToXLSXManager.instance;
    }

    private static instance: ExportContextQueryToXLSXManager = null;
}