
export default class DataImportCronWorkersHandler {

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