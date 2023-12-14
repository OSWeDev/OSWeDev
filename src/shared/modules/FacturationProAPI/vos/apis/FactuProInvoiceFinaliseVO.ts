import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import FactuProInvoiceVO from "../invoices/FactuProInvoiceVO";

export default class FactuProInvoiceFinaliseVO implements IAPIParamTranslator<FactuProInvoiceFinaliseVO> {

    public static fromParams(firm_id: number, invoice_id: number, params: FactuProInvoiceVO): FactuProInvoiceFinaliseVO {
        return new FactuProInvoiceFinaliseVO(firm_id, invoice_id, params);
    }

    public static getAPIParams(param: FactuProInvoiceFinaliseVO): any[] {
        return [param.firm_id, param.invoice_id, param.params];
    }

    public constructor(
        public firm_id: number,
        public invoice_id: number,
        public params: FactuProInvoiceVO
    ) { }
}

export const FactuProInvoiceFinaliseVOStatic: IAPIParamTranslatorStatic<FactuProInvoiceFinaliseVO> = FactuProInvoiceFinaliseVO;