/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from '../../API/interfaces/IAPIParamTranslator';
import IAPIParamTranslatorStatic from '../../API/interfaces/IAPIParamTranslatorStatic';
import IDistantVOBase from '../../IDistantVOBase';
import Datatable from './datatable/Datatable';

export default class APIDAODATATABLEVOParamVO implements IAPIParamTranslator<APIDAODATATABLEVOParamVO> {

    public static fromParams(
        datatable_vo: IDistantVOBase,
        datatable: Datatable<any>): APIDAODATATABLEVOParamVO {

        return new APIDAODATATABLEVOParamVO(datatable_vo, datatable);
    }

    public static getAPIParams(param: APIDAODATATABLEVOParamVO): any[] {
        return [param.datatable_vo, param.datatable];
    }

    public constructor(
        public datatable_vo: IDistantVOBase,
        public datatable: Datatable<any>) {
    }
}

export const APIDAODATATABLEVOParamVOStatic: IAPIParamTranslatorStatic<APIDAODATATABLEVOParamVO> = APIDAODATATABLEVOParamVO;