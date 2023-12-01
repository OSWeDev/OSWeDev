/* istanbul ignore file : nothing to test in ParamVOs */

import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";

export default class FactuProInvoiceVO implements IAPIParamTranslator<FactuProInvoiceVO> {

    public static fromParams(firm_id: number, invoice_id: string, original: boolean): FactuProInvoiceVO {
        return new FactuProInvoiceVO(firm_id, invoice_id, original);
    }

    public static getAPIParams(param: FactuProInvoiceVO): any[] {
        return [param.firm_id, param.invoice_id, param.original];
    }

    public constructor(
        public firm_id: number,
        public invoice_id: string,
        public original: boolean
    ) { }
}

export const FactuProInvoiceVOStatic: IAPIParamTranslatorStatic<FactuProInvoiceVO> = FactuProInvoiceVO;