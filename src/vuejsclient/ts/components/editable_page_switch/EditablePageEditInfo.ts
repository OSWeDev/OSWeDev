import DatatableField from '../datatable/vos/DatatableField';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';

export default class EditablePageEditInfo {
    public constructor(
        public vo: IDistantVOBase,
        public field: DatatableField<any, any>,
        public field_value: any) { }
}