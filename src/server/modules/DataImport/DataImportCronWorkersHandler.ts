
export default class DataImportCronWorkersHandler {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!DataImportCronWorkersHandler.instance) {
            DataImportCronWorkersHandler.instance = new DataImportCronWorkersHandler();
        }
        return DataImportCronWorkersHandler.instance;
    }

    private static instance: DataImportCronWorkersHandler = null;

    private constructor() {
    }
}