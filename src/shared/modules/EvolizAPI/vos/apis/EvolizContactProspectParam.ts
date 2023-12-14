import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import EvolizContactProspectVO from "../contact_prospects/EvolizContactProspectVO";

export default class EvolizContactProspectParam implements IAPIParamTranslator<EvolizContactProspectParam> {

    public static fromParams(contact: EvolizContactProspectVO): EvolizContactProspectParam {
        return new EvolizContactProspectParam(contact);
    }

    public static getAPIParams(param: EvolizContactProspectParam): any[] {
        return [param.contact];
    }

    public constructor(
        public contact: EvolizContactProspectVO
    ) { }
}

export const EvolizContactProspectParamStatic: IAPIParamTranslatorStatic<EvolizContactProspectParam> = EvolizContactProspectParam;