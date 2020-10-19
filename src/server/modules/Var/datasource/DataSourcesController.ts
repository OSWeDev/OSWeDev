import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import DataSourceControllerBase from './DataSourceControllerBase';

export default class DataSourcesController {

    public static getInstance(): DataSourcesController {
        if (!DataSourcesController.instance) {
            DataSourcesController.instance = new DataSourcesController();
        }
        return DataSourcesController.instance;
    }

    /**
     * Local thread cache -----
     */

    private static instance: DataSourcesController = null;

    public registeredDataSourcesController: { [name: string]: DataSourceControllerBase } = {};
    public registeredDataSourcesControllerByVoTypeDep: { [vo_type: string]: DataSourceControllerBase[] } = {};
    /**
     * ----- Local thread cache
     */

    private constructor() { }

    public async load_node_datas(dss: DataSourceControllerBase[], node: VarDAGNode, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }): Promise<void> {
        for (let i in dss) {
            let ds = dss[i];

            if (!ds_cache[ds.name]) {
                ds_cache[ds.name] = {};
            }

            await ds.load_node_data(node, ds_cache[ds.name]);
        }
    }

    public registerDataSource(
        dataSourcesController: DataSourceControllerBase) {

        if (!!this.registeredDataSourcesController[dataSourcesController.name]) {
            return;
        }

        this.registeredDataSourcesController[dataSourcesController.name] = dataSourcesController;
        for (let i in dataSourcesController.vo_api_type_ids) {
            let vo_type_dep: string = dataSourcesController.vo_api_type_ids[i];

            if (!this.registeredDataSourcesControllerByVoTypeDep[vo_type_dep]) {
                this.registeredDataSourcesControllerByVoTypeDep[vo_type_dep] = [];
            }
            this.registeredDataSourcesControllerByVoTypeDep[vo_type_dep].push(dataSourcesController);
        }
    }
}