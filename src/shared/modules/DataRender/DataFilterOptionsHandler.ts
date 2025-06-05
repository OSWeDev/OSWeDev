import DataFilterOptionVO from '../DashboardBuilder/vos/widgets_options/tools/DataFilterOptionVO';

export default class DataFilterOptionVOsHandler {
    public static getInstance(): DataFilterOptionVOsHandler {
        if (!DataFilterOptionVOsHandler.instance) {
            DataFilterOptionVOsHandler.instance = new DataFilterOptionVOsHandler();
        }
        return DataFilterOptionVOsHandler.instance;
    }

    private static instance: DataFilterOptionVOsHandler = null;

    private constructor() { }

    /**
     * FIXME:TODO/ Est-ce que les groupes devraient pas êtreordonnés aussi ? (.options)
     */
    public sort_options(options: DataFilterOptionVO[]) {
        options.sort((a: DataFilterOptionVO, b: DataFilterOptionVO) => {
            return (a.label < b.label) ? -1 : ((a.label > b.label) ? 1 : 0);
        });
    }
}