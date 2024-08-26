/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import EvolizInvoiceEmailVO from "../invoices/EvolizInvoiceEmailVO";

export default class EvolizInvoiceEmailParam implements IAPIParamTranslator<EvolizInvoiceEmailParam> {

    public static fromParams(invoiceid: number, send_mail: EvolizInvoiceEmailVO): EvolizInvoiceEmailParam {
        return new EvolizInvoiceEmailParam(invoiceid, send_mail);
    }

    public static getAPIParams(param: EvolizInvoiceEmailParam): any[] {
        return [param.invoiceid, param.send_mail];
    }

    public constructor(
        public invoiceid: number,
        public send_mail: EvolizInvoiceEmailVO
    ) { }
}

export const EvolizInvoiceEmailParamStatic: IAPIParamTranslatorStatic<EvolizInvoiceEmailParam> = EvolizInvoiceEmailParam;