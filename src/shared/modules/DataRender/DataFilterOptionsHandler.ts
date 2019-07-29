import DataFilterOption from './vos/DataFilterOption';

export default class DataFilterOptionsHandler {
    public static getInstance(): DataFilterOptionsHandler {
        if (!DataFilterOptionsHandler.instance) {
            DataFilterOptionsHandler.instance = new DataFilterOptionsHandler();
        }
        return DataFilterOptionsHandler.instance;
    }

    private static instance: DataFilterOptionsHandler = null;

    private constructor() { }

    public sort_options(options: DataFilterOption[]) {
        options.sort((a: DataFilterOption, b: DataFilterOption) => {
            return (a.label < b.label) ? -1 : ((a.label > b.label) ? 1 : 0);
        });
    }
}