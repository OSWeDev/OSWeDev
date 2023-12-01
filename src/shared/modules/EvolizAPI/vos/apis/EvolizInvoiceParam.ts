/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import EvolizInvoiceVO from "../invoices/EvolizInvoiceVO";

export default class EvolizInvoiceParam implements IAPIParamTranslator<EvolizInvoiceParam> {

    public static fromParams(invoice: EvolizInvoiceVO): EvolizInvoiceParam {
        return new EvolizInvoiceParam(invoice);
    }

    public static getAPIParams(param: EvolizInvoiceParam): any[] {
        return [param.invoice];
    }

    public constructor(
        public invoice: EvolizInvoiceVO
    ) { }
}

export const EvolizInvoiceParamStatic: IAPIParamTranslatorStatic<EvolizInvoiceParam> = EvolizInvoiceParam;