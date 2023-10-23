import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import EvolizProspectVO from "../prospects/EvolizProspectVO";

export default class EvolizProspectParam implements IAPIParamTranslator<EvolizProspectParam> {

    public static fromParams(prospect: EvolizProspectVO): EvolizProspectParam {
        return new EvolizProspectParam(prospect);
    }

    public static getAPIParams(param: EvolizProspectParam): any[] {
        return [param.prospect];
    }

    public constructor(
        public prospect: EvolizProspectVO
    ) { }
}

export const EvolizProspectParamStatic: IAPIParamTranslatorStatic<EvolizProspectParam> = EvolizProspectParam;