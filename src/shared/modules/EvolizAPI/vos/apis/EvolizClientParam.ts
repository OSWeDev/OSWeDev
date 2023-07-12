/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import EvolizClientVO from "../clients/EvolizClientVO";

export default class EvolizClientParam implements IAPIParamTranslator<EvolizClientParam> {

    public static fromParams(client: EvolizClientVO): EvolizClientParam {
        return new EvolizClientParam(client);
    }

    public static getAPIParams(param: EvolizClientParam): any[] {
        return [param.client];
    }

    public constructor(
        public client: EvolizClientVO
    ) { }
}

export const EvolizClientParamStatic: IAPIParamTranslatorStatic<EvolizClientParam> = EvolizClientParam;