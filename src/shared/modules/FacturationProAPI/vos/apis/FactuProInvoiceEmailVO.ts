import IAPIParamTranslator from "../../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../../API/interfaces/IAPIParamTranslatorStatic";
import FactuProInvoicesEmailParams from "../invoices/FactuProInvoicesEmailParams";

export default class FactuProInvoiceEmailVO implements IAPIParamTranslator<FactuProInvoiceEmailVO> {

    public static fromParams(firm_id: number, bill_id: number, params: FactuProInvoicesEmailParams): FactuProInvoiceEmailVO {
        return new FactuProInvoiceEmailVO(firm_id, bill_id, params);
    }

    public static getAPIParams(param: FactuProInvoiceEmailVO): any[] {
        return [param.firm_id, param.bill_id, param.params];
    }

    public constructor(
        public firm_id: number,
        public bill_id: number,
        public params: FactuProInvoicesEmailParams
    ) { }
}

export const FactuProInvoiceEmailVOStatic: IAPIParamTranslatorStatic<FactuProInvoiceEmailVO> = FactuProInvoiceEmailVO;