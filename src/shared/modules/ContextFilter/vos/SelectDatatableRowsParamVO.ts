import IAPIParamTranslator from "../../API/interfaces/IAPIParamTranslator";
import IAPIParamTranslatorStatic from "../../API/interfaces/IAPIParamTranslatorStatic";
import DatatableField from "../../DAO/vos/datatable/DatatableField";
import TableColumnDescVO from "../../DashboardBuilder/vos/TableColumnDescVO";
import ContextQueryVO from "./ContextQueryVO";

export default class SelectDatatableRowsParamVO implements IAPIParamTranslator<SelectDatatableRowsParamVO> {

    public static fromParams(
        context_query: ContextQueryVO,
        columns_by_field_id: { [datatable_field_uid: string]: TableColumnDescVO },
        fields: { [datatable_field_uid: string]: DatatableField<any, any> }
    ): SelectDatatableRowsParamVO {

        return new SelectDatatableRowsParamVO(context_query, columns_by_field_id, fields);
    }

    public static getAPIParams(param: SelectDatatableRowsParamVO): any[] {
        return [
            param.context_query,
            param.columns_by_field_id,
            param.fields
        ];
    }

    public constructor(
        public context_query: ContextQueryVO,
        public columns_by_field_id: { [datatable_field_uid: string]: TableColumnDescVO },
        public fields: { [datatable_field_uid: string]: DatatableField<any, any> }
    ) { }
}

export const SelectDatatableRowsParamVOStatic: IAPIParamTranslatorStatic<SelectDatatableRowsParamVO> = SelectDatatableRowsParamVO;