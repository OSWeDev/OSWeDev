// import IDataSourceController from '../../../../src/shared/modules/DataSource/interfaces/IDataSourceController';
// import VarsCumulsController from '../../../../src/shared/modules/Var/cumuls/VarsCumulsController';
// import VarDAG from '../../../../src/shared/modules/Var/graph/var/VarDAG';
// import VarDAGNode from '../../../../src/shared/modules/Var/graph/var/VarDAGNode';
// import IVarDataParamVOBase from '../../../../src/shared/modules/Var/interfaces/IVarDataParamVOBase';
// import SimpleVarConfVO from '../../../../src/shared/modules/Var/simple_vars/SimpleVarConfVO';
// import VarCumulableControllerBase from '../../../../src/shared/modules/Var/VarCumulableControllerBase';
// import VarsController from '../../../../src/shared/modules/Var/VarsController';
// import FakeDataParamController from './FakeDataParamController';
// import FakeDataParamVO from './vos/FakeDataParamVO';
// import FakeDataVO from './vos/FakeDataVO';

// export default class FakeVarController extends VarCumulableControllerBase<FakeDataVO, FakeDataParamVO> {

//     public static COMPTEUR_NAME: string = 'FakeVarController';

//     public static getInstance(): FakeVarController {
//         if (!FakeVarController.instance) {
//             FakeVarController.instance = new FakeVarController();
//         }
//         return FakeVarController.instance;
//     }

//     protected static instance: FakeVarController = null;

//     protected constructor(conf: SimpleVarConfVO = null, controller: FakeDataParamController = null) {
//         super(
//             conf ? conf : {
//                 _type: SimpleVarConfVO.API_TYPE_ID,
//                 id: 1,
//                 var_data_vo_type: FakeDataVO.API_TYPE_ID,
//                 name: FakeVarController.COMPTEUR_NAME,
//             } as SimpleVarConfVO,
//             controller ? controller : FakeDataParamController.getInstance(),
//             [VarsCumulsController.CUMUL_WEEK_NAME, VarsCumulsController.CUMUL_MONTH_NAME, VarsCumulsController.CUMUL_YEAR_NAME],
//             () => new FakeDataVO());
//     }


//     public getVarsIdsDependencies(): number[] {
//         return [];
//     }


//     /**
//      * Returns the datasources this var depends on
//      */
//     public getDataSourcesDependencies(): Array<IDataSourceController<any, any>> {
//         return [
//         ];
//     }


//     /**
//      * Returns the dataparam needed to updateData of the given param. Example : Week sum of worked hours needs worked hours of each day of the given week
//      * @param BATCH_UID
//      * @param param
//      */
//     public async getParamDependencies(
//         varDAGNode: VarDAGNode,
//         varDAG: VarDAG): Promise<IVarDataParamVOBase[]> {
//         return null;
//     }


//     /**
//      * Fonction qui prépare la mise à jour d'une data
//      */
//     public async updateData(varDAGNode: VarDAGNode, varDAG: VarDAG) {

//         let param: FakeDataParamVO = varDAGNode.param as FakeDataParamVO;
//         let res: FakeDataVO = new FakeDataVO();

//         res.datafound = true;

//         res.date_index = param.date_index;
//         res.fake_vo_id = param.fake_vo_id;
//         res.var_id = this.varConf.id;

//         res.value = 42;

//         VarsController.getInstance().setVarData(res, true);
//     }
// }