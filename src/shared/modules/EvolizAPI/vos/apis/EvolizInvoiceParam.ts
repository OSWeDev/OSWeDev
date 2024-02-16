/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import EvolizInvoicePOSTVO from "../invoices/EvolizInvoicePOSTVO";

export default class EvolizInvoiceParam implements IAPIParamTranslator<EvolizInvoiceParam> {

    public static fromParams(invoice: EvolizInvoicePOSTVO): EvolizInvoiceParam {
        return new EvolizInvoiceParam(invoice);
    }

    public static getAPIParams(param: EvolizInvoiceParam): any[] {
        return [param.invoice];
    }

    public constructor(
        public invoice: EvolizInvoicePOSTVO
    ) { }
}

export const EvolizInvoiceParamStatic: IAPIParamTranslatorStatic<EvolizInvoiceParam> = EvolizInvoiceParam;