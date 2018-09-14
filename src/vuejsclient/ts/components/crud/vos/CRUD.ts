import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import Datatable from '../../datatable/vos/Datatable';
import ManyToOneReferenceDatatableField from '../../datatable/vos/ManyToOneReferenceDatatableField';
import SimpleDatatableField from '../../datatable/vos/SimpleDatatableField';


export default class CRUD<T extends IDistantVOBase> {

    /**
     * Fonction pour créer un datatable à iso du moduletable sans plus de paramétrage
     */
    public static getNewCRUD<T extends IDistantVOBase>(API_TYPE_ID: string): CRUD<T> {

        let readDatatable: Datatable<T> = new Datatable(API_TYPE_ID);
        let crud: CRUD<T> = new CRUD(readDatatable);
        let moduleTable = VOsTypesManager.getInstance().moduleTables_by_voType[API_TYPE_ID];

        for (let i in moduleTable.fields) {
            let field: ModuleTableField<any> = moduleTable.fields[i];

            // On ignore les 2 fields de service
            if (field.field_id == "id") {
                continue;
            }
            if (field.field_id == "_type") {
                continue;
            }

            if ((field.field_type == ModuleTableField.FIELD_TYPE_foreign_key) || (field.field_type == ModuleTableField.FIELD_TYPE_file_ref)) {

                let default_target_label_field_id = field.default_label_field;

                if (default_target_label_field_id) {
                    crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
                        field.field_id,
                        VOsTypesManager.getInstance().moduleTables_by_voType[field.manyToOne_target_moduletable.vo_type], [
                            new SimpleDatatableField(default_target_label_field_id.field_id)
                        ]));
                }
            } else {
                crud.readDatatable.pushField(new SimpleDatatableField(field.field_id));
            }
        }

        return crud;
    }

    /**
     * La fonction doit retourner le code_text du label d'erreur ou null. Si erreur, l'update n'aura pas lieu
     */
    public preUpdate: (dataVO: IDistantVOBase, ihmVO: IDistantVOBase) => Promise<string>;

    /**
     * By default, just the readDatatable is enough for the crud configuration, but the update and create views can be separatly defined.
     * @param readDatatable Datatable and fieds used to populate the data table itself
     * @param createDatatable Datatable and fieds used to populate the create data modal. Defaults to the update datatable if not defined, or the read datatable if none defined.
     * @param updateDatatable Datatable and fieds used to populate the update data modal. Defaults to the create datatable if not defined, or the read datatable if none defined.
     */
    public constructor(
        public readDatatable: Datatable<T>,
        public createDatatable: Datatable<T> = null,
        public updateDatatable: Datatable<T> = null) {

        this.createDatatable = this.createDatatable ? this.createDatatable : (this.updateDatatable ? this.updateDatatable : this.readDatatable);
        this.updateDatatable = this.updateDatatable ? this.updateDatatable : (this.createDatatable ? this.createDatatable : this.readDatatable);
        this.preUpdate = null;
    }

    /**
     *
     * @param preUpdate La fonction doit retourner le code_text du label d'erreur ou null. Si erreur, l'update n'aura pas lieu
     */
    public setPreUpdate(preUpdate: (dataVO: IDistantVOBase, ihmVO: IDistantVOBase) => Promise<string>): CRUD<T> {
        this.preUpdate = preUpdate;

        return this;
    }
}