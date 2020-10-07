// import IDistantVOBase from '../IDistantVOBase';
// import VarDataBaseVO from '../Var/vos/VarDataBaseVO';
// import DataSourceControllerBase from './DataSourceControllerBase';

// export default class DataSourcesController {

//     public static getInstance(): DataSourcesController {
//         if (!DataSourcesController.instance) {
//             DataSourcesController.instance = new DataSourcesController();
//         }
//         return DataSourcesController.instance;
//     }

//     /**
//      * Local thread cache -----
//      */

//     private static instance: DataSourcesController = null;

//     public registeredDataSourcesController: { [name: string]: DataSourceControllerBase<any> } = {};
//     public registeredDataSourcesControllerByVoTypeDep: { [vo_type: string]: Array<DataSourceControllerBase<any>> } = {};
//     /**
//      * ----- Local thread cache
//      */

//     private constructor() { }

//     public async initialize() {
//     }

//     public registerDataSource(
//         dataSourcesController: DataSourceControllerBase<any>) {

//         if (!!this.registeredDataSourcesController[dataSourcesController.name]) {
//             return;
//         }

//         this.registeredDataSourcesController[dataSourcesController.name] = dataSourcesController;
//         for (let i in dataSourcesController.vo_api_type_ids) {
//             let vo_type_dep: string = dataSourcesController.vo_api_type_ids[i];

//             if (!this.registeredDataSourcesControllerByVoTypeDep[vo_type_dep]) {
//                 this.registeredDataSourcesControllerByVoTypeDep[vo_type_dep] = [];
//             }
//             this.registeredDataSourcesControllerByVoTypeDep[vo_type_dep].push(dataSourcesController);
//         }
//     }

//     public getUpdatedParamsFromVoUpdate(vo_before_update: IDistantVOBase, vo_after_update: IDistantVOBase): { [index: string]: VarDataBaseVO } {

//         let res_before: { [index: string]: VarDataBaseVO } = this.getUpdatedParamsFromVo(vo_before_update);
//         let res_after: { [index: string]: VarDataBaseVO } = this.getUpdatedParamsFromVo(vo_after_update);

//         return Object.assign(res_before, res_after);
//     }

//     private getUpdatedParamsFromVo(vo: IDistantVOBase): { [index: string]: VarDataBaseVO } {

//         if ((!vo) || (!vo._type) || (!this.registeredDataSourcesControllerByVoTypeDep[vo._type])) {
//             return {};
//         }

//         let res: { [index: string]: VarDataBaseVO } = {};

//         for (let i in this.registeredDataSourcesControllerByVoTypeDep[vo._type]) {
//             let dataSourceController: DataSourceControllerBase<any> = this.registeredDataSourcesControllerByVoTypeDep[vo._type][i];

//             let temps: { [index: string]: VarDataBaseVO } = dataSourceController.get_updated_params_from_vo_update(vo);

//             for (let index in temps) {

//                 res[index] = temps[index];
//             }
//         }

//         return res;
//     }
// }