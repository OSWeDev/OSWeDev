/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class EvolizDocumentLinksParam implements IAPIParamTranslator<EvolizDocumentLinksParam> {

    public static fromParams(doc_type: string, doc_id: string): EvolizDocumentLinksParam {
        return new EvolizDocumentLinksParam(doc_type, doc_id);
    }

    public static getAPIParams(param: EvolizDocumentLinksParam): any[] {
        return [param.doc_type, param.doc_id];
    }

    public constructor(
        public doc_type: string,
        public doc_id: string
    ) { }
}

export const EvolizDocumentLinksParamStatic: IAPIParamTranslatorStatic<EvolizDocumentLinksParam> = EvolizDocumentLinksParam;