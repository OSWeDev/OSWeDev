import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import ObjectHandler from '../../../../../shared/tools/ObjectHandler';

export default class Datatable<T extends IDistantVOBase> {

    /**
     * La fonction doit true pour accepter l'affichage ou false pour refuser
     */
    public conditional_show: (dataVO: IDistantVOBase) => boolean;

    protected sortedFields: Array<DatatableField<any, any>> = [];

    constructor(public API_TYPE_ID: string) { }

    /**
     * Fonction qui permet de rajouter ou filtrer des datas dans le set loadé de la base
     */
    public data_set_hook: (datas_by_ids: { [id: number]: IDistantVOBase }) => IDistantVOBase[] = (datas_by_ids: { [id: number]: IDistantVOBase }) => {
        return ObjectHandler.getInstance().arrayFromMap(datas_by_ids);
    }

    public getFieldByDatatableFieldUID(datatable_field_uid: string): DatatableField<any, any> {

        for (let i in this.fields) {
            let field = this.fields[i];

            if (field.datatable_field_uid == datatable_field_uid) {
                return field;
            }
        }
    }

    public set_conditional_show(conditional_show: (dataVO: IDistantVOBase) => boolean): Datatable<T> {
        this.conditional_show = conditional_show;

        return this;
    }

    public set_data_set_hook(data_set_hook: (datas_by_ids: { [id: number]: IDistantVOBase }) => IDistantVOBase[]): Datatable<T> {
        this.data_set_hook = data_set_hook;

        return this;
    }

    public unshiftField(field: DatatableField<any, any>) {
        field.setModuleTable(VOsTypesManager.getInstance().moduleTables_by_voType[this.API_TYPE_ID]);
        this.sortedFields.unshift(field);
    }

    public pushField(field: DatatableField<any, any>) {
        field.setModuleTable(VOsTypesManager.getInstance().moduleTables_by_voType[this.API_TYPE_ID]);
        this.sortedFields.push(field);
    }

    public removeFields(module_table_field_ids: string[]) {

        let fields: Array<DatatableField<any, any>> = [];

        for (let i in this.fields) {
            let field: DatatableField<any, any> = this.sortedFields[i];

            if (module_table_field_ids.indexOf(field.module_table_field_id) < 0) {
                fields.push(field);
            }
        }
        this.sortedFields = fields;
    }

    public define_fields_order_by_datatableFieldUIDs(datatable_field_uids: string[]) {

        if ((!datatable_field_uids) || (!this.fields)) {
            return;
        }

        /*let new_field_list: Array<DatatableField<any, any>> = [];

        for (let i in datatable_field_uids) {
            let datatable_field_uid: string = datatable_field_uids[i];

            new_field_list.push(this.getFieldByDatatableFieldUID(datatable_field_uid));
        }
        this.sortedFields = new_field_list;

        return;*/
        this.sortedFields.sort((a: DatatableField<any, any>, b: DatatableField<any, any>) => {
            return datatable_field_uids.indexOf(a.datatable_field_uid) - datatable_field_uids.indexOf(b.datatable_field_uid);
        });
    }

    get fields(): Array<DatatableField<any, any>> {
        return this.sortedFields;
    }
}