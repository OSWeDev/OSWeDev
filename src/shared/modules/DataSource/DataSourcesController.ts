import IDataSourceController from './interfaces/IDataSourceController';
import IVarDataParamVOBase from '../Var/interfaces/IVarDataParamVOBase';
import IDistantVOBase from '../IDistantVOBase';

export default class DataSourcesController {

    public static getInstance(): DataSourcesController {
        if (!DataSourcesController.instance) {
            DataSourcesController.instance = new DataSourcesController();
        }
        return DataSourcesController.instance;
    }

    private static BATCH_UID: number = 0;

    private static instance: DataSourcesController = null;

    public registeredDataSourcesController: { [name: string]: IDataSourceController<any, any> } = {};
    public registeredDataSourcesControllerByVoTypeDep: { [vo_type: string]: Array<IDataSourceController<any, any>> } = {};

    private constructor() { }

    public async initialize() {
    }

    public registerDataSource(
        dataSourcesController: IDataSourceController<any, any>,
        vo_type_deps: string[]) {

        if (!!this.registeredDataSourcesController[dataSourcesController.name]) {
            return;
        }

        this.registeredDataSourcesController[dataSourcesController.name] = dataSourcesController;
        for (let i in vo_type_deps) {
            let vo_type_dep: string = vo_type_deps[i];

            if (!this.registeredDataSourcesControllerByVoTypeDep[vo_type_dep]) {
                this.registeredDataSourcesControllerByVoTypeDep[vo_type_dep] = [];
            }
            this.registeredDataSourcesControllerByVoTypeDep[vo_type_dep].push(dataSourcesController);
        }
    }

    public getUpdatedParamsFromVoUpdate(vo_before_update: IDistantVOBase, vo_after_update: IDistantVOBase): { [index: string]: IVarDataParamVOBase } {

        let res_before: { [index: string]: IVarDataParamVOBase } = this.getUpdatedParamsFromVo(vo_before_update);
        let res_after: { [index: string]: IVarDataParamVOBase } = this.getUpdatedParamsFromVo(vo_after_update);

        return Object.assign(res_before, res_after);
    }

    private getUpdatedParamsFromVo(vo: IDistantVOBase): { [index: string]: IVarDataParamVOBase } {

        if ((!vo) || (!vo._type) || (!this.registeredDataSourcesControllerByVoTypeDep[vo._type])) {
            return {};
        }

        let res: { [index: string]: IVarDataParamVOBase } = {};

        for (let i in this.registeredDataSourcesControllerByVoTypeDep[vo._type]) {
            let dataSourceController: IDataSourceController<any, any> = this.registeredDataSourcesControllerByVoTypeDep[vo._type][i];

            let temps: { [index: string]: IVarDataParamVOBase } = dataSourceController.get_updated_params_from_vo_update(vo);

            for (let index in temps) {

                res[index] = temps[index];
            }
        }

        return res;
    }
}