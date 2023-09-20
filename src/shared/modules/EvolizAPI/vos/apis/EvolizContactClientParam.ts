import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import EvolizContactClientVO from "../contact_clients/EvolizContactClientVO";

export default class EvolizContactClientParam implements IAPIParamTranslator<EvolizContactClientParam> {

    public static fromParams(client: EvolizContactClientVO): EvolizContactClientParam {
        return new EvolizContactClientParam(client);
    }

    public static getAPIParams(param: EvolizContactClientParam): any[] {
        return [param.client];
    }

    public constructor(
        public client: EvolizContactClientVO
    ) { }
}

export const EvolizContactClientParamStatic: IAPIParamTranslatorStatic<EvolizContactClientParam> = EvolizContactClientParam;