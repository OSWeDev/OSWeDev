// import * as moment from 'moment';
// import { Moment } from 'moment';
// import FakeDataParamVO from './vos/FakeDataParamVO';
// import VarDataParamControllerBase from '../../../../src/shared/modules/Var/VarDataParamControllerBase';
// import VarsController from '../../../../src/shared/modules/Var/VarsController';
// import TimeSegment from '../../../../src/shared/modules/DataRender/vos/TimeSegment';

// export default class FakeDataParamController extends VarDataParamControllerBase<FakeDataParamVO> {

//     public static getInstance() {
//         if (!FakeDataParamController.instance) {
//             FakeDataParamController.instance = new FakeDataParamController();
//         }

//         return FakeDataParamController.instance;
//     }

//     private static instance: FakeDataParamController = null;

//     public segment_type: number = TimeSegment.TYPE_DAY;

//     protected constructor() {
//         super();
//     }

//     public getParamFromCompteurName(compteur_name: string, fake_vo_id: number, date_index: string): FakeDataParamVO {

//         let res: FakeDataParamVO = new FakeDataParamVO();
//         res.date_index = date_index;
//         res.fake_vo_id = fake_vo_id;
//         res.var_id = VarsController.getInstance().getVarConf(compteur_name) ? VarsController.getInstance().getVarConf(compteur_name).id : null;
//         return res;
//     }

//     public getParamFromCompteurId(compteur_id: number, fake_vo_id: number, date_index: string): FakeDataParamVO {

//         let res: FakeDataParamVO = new FakeDataParamVO();
//         res.date_index = date_index;
//         res.fake_vo_id = fake_vo_id;
//         res.var_id = compteur_id;
//         return res;
//     }

//     public getImpactedParamsList(paramUpdated: FakeDataParamVO, paramsRegisteredByIndex: { [index: string]: FakeDataParamVO }): FakeDataParamVO[] {
//         if ((!paramUpdated) || (!paramUpdated.date_index) || (!paramsRegisteredByIndex)) {
//             return null;
//         }

//         let res: FakeDataParamVO[] = [];

//         for (let index in paramsRegisteredByIndex) {
//             let paramRegistered: FakeDataParamVO = paramsRegisteredByIndex[index];

//             if ((paramRegistered.var_id == paramUpdated.var_id) &&
//                 (paramUpdated.fake_vo_id == paramRegistered.fake_vo_id) &&
//                 moment(paramRegistered.date_index).isAfter(moment(paramUpdated.date_index))) {
//                 res.push(paramRegistered);
//             }
//         }
//         return res;
//     }

//     public getIndex(param: FakeDataParamVO): string {
//         let res: string = "";

//         res += param.var_id;

//         res += "_" + (param.fake_vo_id ? param.fake_vo_id : "");
//         res += "_" + (param.date_index ? param.date_index : "");

//         return res;
//     }

//     /**
//      * Renvoie une nouvelle instance de data param en remplaçant les champs date et/ou var_id
//      * @param src Le param de départ
//      * @param date_index Null pour garder la valeur source
//      * @param var_id Null pour garder la valeur source
//      */
//     public getParam(src: FakeDataParamVO, var_id: number, date_index: string): FakeDataParamVO {
//         let res: FakeDataParamVO = Object.assign(new FakeDataParamVO(), src);

//         res.var_id = ((var_id != null) && (typeof var_id != 'undefined')) ? var_id : res.var_id;
//         res.date_index = ((date_index != null) && (typeof date_index != 'undefined')) ? date_index : res.date_index;

//         return res;
//     }

//     protected compareParams(paramA: FakeDataParamVO, paramB: FakeDataParamVO) {

//         if ((!paramA) || (!paramB)) {
//             return null;
//         }

//         let employee_diff: number = paramA.fake_vo_id - paramB.fake_vo_id;

//         if (employee_diff) {
//             return employee_diff;
//         }

//         let momentA: Moment = moment(paramA.date_index);
//         let momentB: Moment = moment(paramB.date_index);

//         return momentA.diff(momentB);
//     }
// }