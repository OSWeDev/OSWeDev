import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VarDAGNode from '../../../../shared/modules/Var/graph/VarDAGNode';
import VarDataBaseVO from '../../../../shared/modules/Var/vos/VarDataBaseVO';
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

    public registeredDataSourcesController: { [name: string]: DataSourceControllerBase<any> } = {};
    public registeredDataSourcesControllerByVoTypeDep: { [vo_type: string]: Array<DataSourceControllerBase<any>> } = {};
    /**
     * ----- Local thread cache
     */

    private constructor() { }

    public async load_node_datas(dss: Array<DataSourceControllerBase<any>>, node: VarDAGNode, ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } }): Promise<void> {
        for (let i in dss) {
            let ds = dss[i];

            if (typeof node.datasources[ds.name] !== 'undefined') {
                continue;
            }

            let data_index = ds.get_data_index(node.var_data);
            if (typeof ds_cache[data_index] === 'undefined') {
                let data = await ds.get_data(node.var_data);
                ds_cache[data_index] = ((typeof data === 'undefined') ? null : data);
            }
            node.datasources[ds.name] = ds_cache[data_index];
        }
    }

    public registerDataSource(
        dataSourcesController: DataSourceControllerBase<any>) {

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

    public getUpdatedParamsFromVoUpdate(vo_before_update: IDistantVOBase, vo_after_update: IDistantVOBase): { [index: string]: VarDataBaseVO } {

        let res_before: { [index: string]: VarDataBaseVO } = this.getUpdatedParamsFromVo(vo_before_update);
        let res_after: { [index: string]: VarDataBaseVO } = this.getUpdatedParamsFromVo(vo_after_update);

        return Object.assign(res_before, res_after);
    }

    private getUpdatedParamsFromVo(vo: IDistantVOBase): { [index: string]: VarDataBaseVO } {

        if ((!vo) || (!vo._type) || (!this.registeredDataSourcesControllerByVoTypeDep[vo._type])) {
            return {};
        }

        let res: { [index: string]: VarDataBaseVO } = {};

        for (let i in this.registeredDataSourcesControllerByVoTypeDep[vo._type]) {
            let dataSourceController: DataSourceControllerBase<any> = this.registeredDataSourcesControllerByVoTypeDep[vo._type][i];

            let temps: { [index: string]: VarDataBaseVO } = dataSourceController.get_updated_params_from_vo_update(vo);

            for (let index in temps) {

                res[index] = temps[index];
            }
        }

        return res;
    }
}