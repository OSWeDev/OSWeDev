import ModuleAccessPolicy from '../../AccessPolicy/ModuleAccessPolicy';
import IDistantVOBase from '../../IDistantVOBase';
import ModuleTable from '../../ModuleTable';
import ModuleTableField from '../../ModuleTableField';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';
import VOsTypesManager from '../../VOsTypesManager';
import ComputedDatatableField from './datatable/ComputedDatatableField';
import Datatable from './datatable/Datatable';
import DatatableField from './datatable/DatatableField';
import ManyToManyReferenceDatatableField from './datatable/ManyToManyReferenceDatatableField';
import ManyToOneReferenceDatatableField from './datatable/ManyToOneReferenceDatatableField';
import OneToManyReferenceDatatableField from './datatable/OneToManyReferenceDatatableField';
import ReferenceDatatableField from './datatable/ReferenceDatatableField';
import RefRangesReferenceDatatableField from './datatable/RefRangesReferenceDatatableField';
import SimpleDatatableField from './datatable/SimpleDatatableField';


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

        for (let i in moduleTable.get_fields()) {
            let field: ModuleTableField<any> = moduleTable.get_fields()[i];

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

            if (!field.is_visible_datatable) {
                continue;
            }

            let dt_field: DatatableField<any, any> = null;
            if (field.manyToOne_target_moduletable) {

                let dt_fields: Array<DatatableField<any, any>> = [
                    new ComputedDatatableField(field.field_id + '__target_label', field.manyToOne_target_moduletable.table_label_function)
                ];
                if (field.manyToOne_target_moduletable.default_label_field) {
                    dt_fields = [
                        new SimpleDatatableField(field.manyToOne_target_moduletable.default_label_field.field_id).setValidatInputFunc(field.validate_input)
                    ];
                }

                if (field.field_type == ModuleTableField.FIELD_TYPE_refrange_array) {
                    dt_field = new RefRangesReferenceDatatableField<any>(
                        field.field_id,
                        VOsTypesManager.getInstance().moduleTables_by_voType[field.manyToOne_target_moduletable.vo_type],
                        dt_fields).setValidatInputFunc(field.validate_input);
                } else {
                    dt_field = new ManyToOneReferenceDatatableField<any>(
                        field.field_id,
                        VOsTypesManager.getInstance().moduleTables_by_voType[field.manyToOne_target_moduletable.vo_type],
                        dt_fields).setValidatInputFunc(field.validate_input);
                }
            } else {
                dt_field = new SimpleDatatableField(field.field_id).setValidatInputFunc(field.validate_input);
            }

            if ((!!dt_field) && field.hidden_print) {
                dt_field.hide_print();
            }

            if (!!dt_field) {
                crud.readDatatable.pushField(dt_field);
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
        moduleTable: ModuleTable<any>,
        except_table_names: string[] = null) {

        //  On fait le tour des tables manyToMany pour identifier les fields qui font référence à cette table
        let manyToManyModuleTables: Array<ModuleTable<any>> = VOsTypesManager.getInstance().get_manyToManyModuleTables();
        for (let i in manyToManyModuleTables) {
            let otherModuleTable: ModuleTable<any> = manyToManyModuleTables[i];

            if ((!otherModuleTable.module) || (!otherModuleTable.module.actif)) {
                continue;
            }

            if (otherModuleTable.full_name == moduleTable.full_name) {
                continue;
            }

            if (!otherModuleTable.any_to_many_default_behaviour_show) {
                continue;
            }

            for (let j in otherModuleTable.get_fields()) {
                let field: ModuleTableField<any> = otherModuleTable.get_fields()[j];

                if (!field.is_visible_datatable) {
                    continue;
                }

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

                if (except_table_names && (except_table_names.indexOf(field.module_table.name) >= 0)) {
                    continue;
                }

                let otherField: ModuleTableField<any> = VOsTypesManager.getInstance().getManyToManyOtherField(field.module_table, field);

                if ((!otherField) || (!otherField.manyToOne_target_moduletable)) {
                    continue;
                }

                if (otherField.manyToOne_target_moduletable.default_label_field) {
                    crud.readDatatable.pushField(new ManyToManyReferenceDatatableField<any, any>(
                        field.module_table.full_name + '_' + field.field_id,
                        otherField.manyToOne_target_moduletable,
                        field.module_table,
                        [
                            new SimpleDatatableField(otherField.manyToOne_target_moduletable.default_label_field.field_id)
                        ]
                    ));
                    continue;
                }

                if (otherField.manyToOne_target_moduletable.table_label_function) {
                    crud.readDatatable.pushField(new ManyToManyReferenceDatatableField<any, any>(
                        field.module_table.full_name + '_' + field.field_id,
                        otherField.manyToOne_target_moduletable,
                        field.module_table,
                        [
                            new ComputedDatatableField(
                                otherField.manyToOne_target_moduletable.vo_type + '__' + field.field_id + '__target_label',
                                otherField.manyToOne_target_moduletable.table_label_function)
                        ]));
                    continue;
                }
            }
        }
    }

    public static addOneToManyFields<T extends IDistantVOBase>(
        crud: CRUD<T>,
        moduleTable: ModuleTable<any>,
        except_table_names: string[] = null) {

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

            if (!otherModuleTable.any_to_many_default_behaviour_show) {
                continue;
            }

            for (let j in otherModuleTable.get_fields()) {
                let field: ModuleTableField<any> = otherModuleTable.get_fields()[j];

                if (!field.is_visible_datatable) {
                    continue;
                }

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

                if (except_table_names && (except_table_names.indexOf(field.module_table.name) >= 0)) {
                    continue;
                }

                if (field.module_table.default_label_field) {
                    crud.readDatatable.pushField(new OneToManyReferenceDatatableField<any>(
                        field.module_table.full_name + '_' + field.field_id,
                        field.module_table,
                        field,
                        [
                            new SimpleDatatableField(field.module_table.default_label_field.field_id)
                        ]
                    ).setValidatInputFunc(field.validate_input));
                    continue;
                }

                if (field.module_table.table_label_function) {
                    crud.readDatatable.pushField(new OneToManyReferenceDatatableField<any>(
                        field.module_table.full_name + '_' + field.field_id,
                        field.module_table,
                        field,
                        [
                            new ComputedDatatableField(
                                field.field_id + '__target_label',
                                field.module_table.table_label_function)
                        ]).setValidatInputFunc(field.validate_input));
                    continue;
                }
            }
        }
    }

    public forced_readonly: boolean = false;
    public forced_updateonly: boolean = false;
    public reset_newvo_after_each_creation: boolean = false;
    public api_type_id: string;

    public delete_all_access_right: string = ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS;

    /**
     * La fonction doit retourner le code_text du label d'erreur ou null. Si erreur, l'update n'aura pas lieu
     */
    public preUpdate: (dataVO: IDistantVOBase, ihmVO: IDistantVOBase) => Promise<string>;
    public preCreate: (dataVO: IDistantVOBase, ihmVO: IDistantVOBase) => Promise<string>;

    public isReadOnlyData: (dataVO: IDistantVOBase) => boolean;

    public callback_handle_modal_show_hide: (vo: IDistantVOBase, modal_type: string) => Promise<void>;

    public hook_prepare_new_vo_for_creation: (vo: IDistantVOBase) => Promise<void>;
    public callback_function_create: (vo: IDistantVOBase) => Promise<void>;

    public callback_function_update: (vo: IDistantVOBase) => Promise<void>;

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
        this.preCreate = null;
        this.api_type_id = this.readDatatable.API_TYPE_ID;
    }

    public set_delete_all_access_right(delete_all_access_right: string): CRUD<T> {
        this.delete_all_access_right = delete_all_access_right;

        return this;
    }

    public force_readonly(): CRUD<T> {
        this.forced_readonly = true;

        return this;
    }

    public isReadOnly(dataVO: IDistantVOBase): boolean {
        if (this.forced_readonly) {
            return this.forced_readonly;
        }

        if (this.isReadOnlyData) {
            return this.isReadOnlyData(dataVO);
        }

        return this.forced_readonly;
    }


    /**
     *
     * @param preUpdate La fonction doit retourner le code_text du label d'erreur ou null. Si erreur, l'update n'aura pas lieu
     */
    public setPreUpdate(preUpdate: (dataVO: IDistantVOBase, ihmVO: IDistantVOBase) => Promise<string>): CRUD<T> {
        this.preUpdate = preUpdate;

        return this;
    }

    public setPreCreate(preCreate: (dataVO: IDistantVOBase, ihmVO: IDistantVOBase) => Promise<string>): CRUD<T> {
        this.preCreate = preCreate;

        return this;
    }

    public setIsReadOnlyData(isReadOnlyData: (dataVO: IDistantVOBase) => boolean): CRUD<T> {
        this.isReadOnlyData = isReadOnlyData;

        return this;
    }

    public setCallbackHandleModalShowHide(callback_handle_modal_show_hide: (vo: IDistantVOBase, modal_type: string) => Promise<void>): CRUD<T> {
        this.callback_handle_modal_show_hide = callback_handle_modal_show_hide;

        return this;
    }

    public setCallbackFunctionCreate(callback_function_create: (vo: IDistantVOBase) => Promise<void>): CRUD<T> {
        this.callback_function_create = callback_function_create;

        return this;
    }

    public setCallbackFunctionUpdate(callback_function_update: (vo: IDistantVOBase) => Promise<void>): CRUD<T> {
        this.callback_function_update = callback_function_update;

        return this;
    }
}