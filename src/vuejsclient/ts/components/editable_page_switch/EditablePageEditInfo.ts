import DatatableField from '../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';

export default class EditablePageEditInfo {
    public callback: (editablePageEditInfo: EditablePageEditInfo, is_ok: boolean) => Promise<void> = null;

    public constructor(
        public UID: string,
        public vo: IDistantVOBase,
        public field: DatatableField<any, any>,
        public field_value: any) { }

    public set_callback(callback: (editablePageEditInfo: EditablePageEditInfo, is_ok: boolean) => Promise<void>): EditablePageEditInfo {
        this.callback = callback;
        return this;
    }
}