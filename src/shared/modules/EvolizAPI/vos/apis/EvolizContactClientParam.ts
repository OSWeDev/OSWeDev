import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import EvolizContactClientVO from "../contact_clients/EvolizContactClientVO";

export default class EvolizContactClientParam implements IAPIParamTranslator<EvolizContactClientParam> {

    public static fromParams(contact: EvolizContactClientVO): EvolizContactClientParam {
        return new EvolizContactClientParam(contact);
    }

    public static getAPIParams(param: EvolizContactClientParam): any[] {
        return [param.contact];
    }

    public constructor(
        public contact: EvolizContactClientVO
    ) { }
}

export const EvolizContactClientParamStatic: IAPIParamTranslatorStatic<EvolizContactClientParam> = EvolizContactClientParam;