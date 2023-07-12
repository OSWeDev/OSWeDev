/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";

export default class APIDAOselectUsersForCheckUnicityVO implements IAPIParamTranslator<APIDAOselectUsersForCheckUnicityVO> {

    public static fromParams(
        name: string,
        email: string,
        phone: string,
        user_id: number): APIDAOselectUsersForCheckUnicityVO {

        return new APIDAOselectUsersForCheckUnicityVO(name, email, phone, user_id);
    }

    public static getAPIParams(param: APIDAOselectUsersForCheckUnicityVO): any[] {
        return [param.name, param.email, param.phone, param.user_id];
    }

    public constructor(
        public name: string,
        public email: string,
        public phone: string,
        public user_id: number) {
    }
}

export const APIDAOselectUsersForCheckUnicityVOStatic: IAPIParamTranslatorStatic<APIDAOselectUsersForCheckUnicityVO> = APIDAOselectUsersForCheckUnicityVO;