import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import Datatable from '../../datatable/vos/Datatable';
import ManyToOneReferenceDatatableField from '../../datatable/vos/ManyToOneReferenceDatatableField';
import SimpleDatatableField from '../../datatable/vos/SimpleDatatableField';
import ModuleTable from '../../../../../shared/modules/ModuleTable';
import ManyToManyReferenceDatatableField from '../../datatable/vos/ManyToManyReferenceDatatableField';
import OneToManyReferenceDatatableField from '../../datatable/vos/OneToManyReferenceDatatableField';
import ComputedDatatableField from '../../datatable/vos/ComputedDatatableField';
import ReferenceDatatableField from '../../datatable/vos/ReferenceDatatableField';
import IVersionedVO from '../../../../../shared/modules/Versioned/interfaces/IVersionedVO';


export default class CRUD<T extends IDistantVOBase> {

    public static getDefaultCRUDDatatable<V extends IVersionedVO>(api_type_id: string): CRUD<V> {
        let moduleTable: ModuleTable<V> = VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id];
        let crud: CRUD<V> = CRUD.getNewCRUD(moduleTable.vo_type);

        crud.readDatatable.removeFields(['version_num', 'trashed', 'parent_id']);

        crud.updateDatatable = Object.assign(new Datatable(api_type_id), crud.readDatatable);
        crud.createDatatable = Object.assign(new Datatable(api_type_id), crud.readDatatable);

        crud.updateDatatable.removeFields([
            'version_num', 'trashed', 'parent_id',
            'version_edit_author_id', 'version_author_id',
            'version_edit_timestamp', 'version_timestamp']);
        crud.createDatatable.removeFields([
            'version_num', 'trashed', 'parent_id',
            'version_edit_author_id', 'version_author_id',
            'version_edit_timestamp', 'version_timestamp']);

        return crud;
    }

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

            if (field.field_type == ReferenceDatatableField.ONE_TO_MANY_FIELD_TYPE) {
                continue;
            }

            if (field.field_type == ReferenceDatatableField.MANY_TO_MANY_FIELD_TYPE) {
                continue;
            }

            if (field.manyToOne_target_moduletable) {

                if (field.manyToOne_target_moduletable.default_label_field) {
                    crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
                        field.field_id,
                        VOsTypesManager.getInstance().moduleTables_by_voType[field.manyToOne_target_moduletable.vo_type], [
                            new SimpleDatatableField(field.manyToOne_target_moduletable.default_label_field.field_id)
                        ]));
                } else if (field.manyToOne_target_moduletable.table_label_function) {
                    crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
                        field.field_id,
                        VOsTypesManager.getInstance().moduleTables_by_voType[field.manyToOne_target_moduletable.vo_type], [
                            new ComputedDatatableField(field.field_id + '__target_label', field.manyToOne_target_moduletable.table_label_function)
                        ]));
                }
            } else {
                crud.readDatatable.pushField(new SimpleDatatableField(field.field_id));
            }
        }

        // Une fois qu'on a fait le tour des fields, on s'intéresse aux manyToMany et oneToMany potentiels
        //  Donc on fait le tour des tables existantes pour identifier les manyToOne qui font référence à cette table
        CRUD.addManyToManyFields(crud, moduleTable);
        CRUD.addOneToManyFields(crud, moduleTable);

        return crud;
    }

    public static addManyToManyFields<T extends IDistantVOBase>(
        crud: CRUD<T>,
        moduleTable: ModuleTable<any>) {

        //  On fait le tour des tables manyToMany pour identifier les fields qui font référence à cette table
        for (let i in VOsTypesManager.getInstance().manyToManyModuleTables) {
            let otherModuleTable: ModuleTable<any> = VOsTypesManager.getInstance().manyToManyModuleTables[i];

            if ((!otherModuleTable.module) || (!otherModuleTable.module.actif)) {
                continue;
            }

            if (otherModuleTable.full_name == moduleTable.full_name) {
                continue;
            }

            for (let j in otherModuleTable.fields) {
                let field: ModuleTableField<any> = otherModuleTable.fields[j];

                // On ignore les 2 fields de service
                if (field.field_id == "id") {
                    continue;
                }
                if (field.field_id == "_type") {
                    continue;
                }

                if (!field.manyToOne_target_moduletable) {
                    continue;
                }

                if (field.manyToOne_target_moduletable.full_name != moduleTable.full_name) {
                    continue;
                }

                let otherField: ModuleTableField<any> = VOsTypesManager.getInstance().getManyToManyOtherField(field.module_table, field);

                if ((!otherField) || (!otherField.manyToOne_target_moduletable)) {
                    continue;
                }

                if (otherField.manyToOne_target_moduletable.default_label_field) {
                    crud.readDatatable.pushField(new ManyToManyReferenceDatatableField<any, any>(
                        field.module_table.full_name,
                        otherField.manyToOne_target_moduletable,
                        field.module_table,
                        [
                            new SimpleDatatableField(otherField.manyToOne_target_moduletable.default_label_field.field_id)
                        ]
                    ));
                    continue;
                }

                if (field.manyToOne_target_moduletable.table_label_function) {
                    crud.readDatatable.pushField(new ManyToManyReferenceDatatableField<any, any>(
                        field.module_table.full_name,
                        otherField.manyToOne_target_moduletable,
                        field.module_table,
                        [
                            new ComputedDatatableField(
                                otherField.manyToOne_target_moduletable.default_label_field.field_id + '__target_label',
                                otherField.manyToOne_target_moduletable.table_label_function)
                        ]));
                    continue;
                }
            }
        }
    }

    public static addOneToManyFields<T extends IDistantVOBase>(
        crud: CRUD<T>,
        moduleTable: ModuleTable<any>) {

        //  On fait le tour des autres tables existantes pour identifier les manyToOne qui font référence à cette table (hors manytomany)
        for (let i in VOsTypesManager.getInstance().moduleTables_by_voType) {
            let otherModuleTable: ModuleTable<any> = VOsTypesManager.getInstance().moduleTables_by_voType[i];

            if ((!otherModuleTable.module) || (!otherModuleTable.module.actif)) {
                continue;
            }

            if (otherModuleTable.full_name == moduleTable.full_name) {
                continue;
            }

            if (VOsTypesManager.getInstance().isManyToManyModuleTable(otherModuleTable)) {
                continue;
            }

            for (let j in otherModuleTable.fields) {
                let field: ModuleTableField<any> = otherModuleTable.fields[j];

                // On ignore les 2 fields de service
                if (field.field_id == "id") {
                    continue;
                }
                if (field.field_id == "_type") {
                    continue;
                }

                if (!field.manyToOne_target_moduletable) {
                    continue;
                }

                if (field.manyToOne_target_moduletable.full_name != moduleTable.full_name) {
                    continue;
                }


                if (field.module_table.default_label_field) {
                    crud.readDatatable.pushField(new OneToManyReferenceDatatableField<any>(
                        field.module_table.full_name,
                        field.module_table,
                        field,
                        [
                            new SimpleDatatableField(field.module_table.default_label_field.field_id)
                        ]
                    ));
                    continue;
                }

                if (field.module_table.table_label_function) {
                    crud.readDatatable.pushField(new OneToManyReferenceDatatableField<any>(
                        field.module_table.full_name,
                        field.module_table,
                        field,
                        [
                            new ComputedDatatableField(
                                field.module_table.default_label_field.field_id + '__target_label',
                                field.module_table.table_label_function)
                        ]));
                    continue;
                }
            }
        }
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