import ModuleAccessPolicy from '../../AccessPolicy/ModuleAccessPolicy';
import ModuleTableFieldVO from '../../DAO/vos/ModuleTableFieldVO';
import ModuleTableVO from '../../DAO/vos/ModuleTableVO';
import IDistantVOBase from '../../IDistantVOBase';
import Module from '../../Module';
import ModulesManager from '../../ModulesManager';
import VOsTypesManager from '../../VO/manager/VOsTypesManager';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';
import ModuleDAO from '../ModuleDAO';
import ModuleTableController from '../ModuleTableController';
import ModuleTableFieldController from '../ModuleTableFieldController';
import ComputedDatatableFieldVO from './datatable/ComputedDatatableFieldVO';
import Datatable from './datatable/Datatable';
import DatatableField from './datatable/DatatableField';
import ManyToManyReferenceDatatableFieldVO from './datatable/ManyToManyReferenceDatatableFieldVO';
import ManyToOneReferenceDatatableFieldVO from './datatable/ManyToOneReferenceDatatableFieldVO';
import OneToManyReferenceDatatableFieldVO from './datatable/OneToManyReferenceDatatableFieldVO';
import RefRangesReferenceDatatableFieldVO from './datatable/RefRangesReferenceDatatableFieldVO';
import ReferenceDatatableField from './datatable/ReferenceDatatableField';
import SimpleDatatableFieldVO from './datatable/SimpleDatatableFieldVO';


export default class CRUD<T extends IDistantVOBase> {

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

    public postCreate: (dataVO: IDistantVOBase) => Promise<void>;
    public postUpdate: (dataVO: IDistantVOBase) => Promise<void>;
    public postDelete: (dataVO: IDistantVOBase) => Promise<void>;

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
        this.postCreate = null;
        this.postUpdate = null;
        this.postDelete = null;
        this.api_type_id = this.readDatatable.API_TYPE_ID;
    }

    public static copy_datatable<T extends IDistantVOBase>(datatable: Datatable<T>): Datatable<T> {
        const res: Datatable<T> = new Datatable(datatable.API_TYPE_ID);

        Object.assign(res, datatable, { sortedFields: [] });

        for (const i in datatable.fields) {
            const field: DatatableField<any, any> = datatable.fields[i];

            res.pushField(field);
        }
        return res;
    }

    public static getDefaultCRUDDatatable<V extends IVersionedVO>(api_type_id: string): CRUD<V> {
        const moduleTable: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[api_type_id];
        const crud: CRUD<V> = CRUD.getNewCRUD(moduleTable.vo_type);

        crud.readDatatable.removeFields(['version_num', 'trashed', 'parent_id']);

        crud.updateDatatable = CRUD.copy_datatable(crud.readDatatable);
        crud.createDatatable = CRUD.copy_datatable(crud.readDatatable);

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

        const readDatatable: Datatable<T> = new Datatable(API_TYPE_ID);
        const crud: CRUD<T> = new CRUD(readDatatable);
        const moduleTable = ModuleTableController.module_tables_by_vo_type[API_TYPE_ID];
        const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[moduleTable.vo_type];

        for (const i in fields) {
            const field: ModuleTableFieldVO = fields[i];

            // On ignore les 2 fields de service
            if (field.field_id == "id") {
                continue;
            }
            if (field.field_id == "_type") {
                continue;
            }

            if (field.do_not_add_to_crud) {
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

            // Si le champs est un champs calculé, on ne l'ajoute pas aux formulaires de modification
            // Conscient qu'il y a un crud pour le read, mais a priori on ne l'utilise pas, on n'utilise que l'update et create non ?
            // et en plus pas toujours avec la méthode getDefaultCRUDDatatable...
            if (field.is_custom_computed) {
                continue;
            }

            const dt_field: DatatableField<any, any> = this.get_dt_field(field);

            if ((!!dt_field) && field.hidden_print) {
                dt_field.hide_print();
            }

            if (dt_field) {
                crud.readDatatable.pushField(dt_field);
            }
        }

        // Une fois qu'on a fait le tour des fields, on s'intéresse aux manyToMany et oneToMany potentiels
        //  Donc on fait le tour des tables existantes pour identifier les manyToOne qui font référence à cette table
        CRUD.addManyToManyFields(crud, moduleTable);
        CRUD.addOneToManyFields(crud, moduleTable);

        return crud;
    }

    public static get_dt_field(field: ModuleTableFieldVO): DatatableField<any, any> {
        let dt_field: DatatableField<any, any> = null;
        const table = ModuleTableController.module_tables_by_vo_type[field.module_table_vo_type];
        const foreign_table = ModuleTableController.module_tables_by_vo_type[field.foreign_ref_vo_type];

        if (field.foreign_ref_vo_type) {

            let dt_fields: Array<DatatableField<any, any>> = [
                ComputedDatatableFieldVO.createNew(
                    field.field_id + '__target_label',
                    ModuleDAO.instance.get_compute_function_uid(field.foreign_ref_vo_type)
                )
            ];

            if (foreign_table.default_label_field) {
                dt_fields = [
                    SimpleDatatableFieldVO.createNew(foreign_table.default_label_field.field_id)
                ];
            }

            if (field.field_type == ModuleTableFieldVO.FIELD_TYPE_refrange_array) {
                dt_field = RefRangesReferenceDatatableFieldVO.createNew(
                    field.field_id,
                    ModuleTableController.module_tables_by_vo_type[field.foreign_ref_vo_type],
                    dt_fields
                );

            } else {
                if (VOsTypesManager.isManyToManyModuleTable(table)) {
                    if (foreign_table.default_label_field) {
                        dt_field = ManyToManyReferenceDatatableFieldVO.createNew(
                            field.field_id,
                            foreign_table,
                            table,
                            [
                                SimpleDatatableFieldVO.createNew(foreign_table.default_label_field.field_id)
                            ]
                        );
                    }

                    const label_function = ModuleTableController.table_label_function_by_vo_type[field.foreign_ref_vo_type];
                    if (label_function) {
                        dt_field = ManyToManyReferenceDatatableFieldVO.createNew(
                            field.field_id,
                            foreign_table,
                            table,
                            [
                                ComputedDatatableFieldVO.createNew(
                                    field.foreign_ref_vo_type + '__' + field.field_id + '__target_label',
                                    ModuleDAO.instance.get_compute_function_uid(field.foreign_ref_vo_type)
                                )
                            ]);
                    }
                } else {
                    dt_field = ManyToOneReferenceDatatableFieldVO.createNew(
                        field.field_id,
                        ModuleTableController.module_tables_by_vo_type[field.foreign_ref_vo_type],
                        dt_fields
                    ).setModuleTable(table);
                }
            }
        } else {
            dt_field = SimpleDatatableFieldVO.createNew(field.field_id);

            switch (field.field_type) {
                case ModuleTableFieldVO.FIELD_TYPE_refrange_array: {
                    if (!foreign_table) {
                        return dt_field;
                    }

                    const dt_fields: Array<DatatableField<any, any>> = [
                        ComputedDatatableFieldVO.createNew(
                            field.field_id + '__target_label',
                            ModuleDAO.instance.get_compute_function_uid(field.foreign_ref_vo_type)
                        )
                    ];

                    dt_field = RefRangesReferenceDatatableFieldVO.createNew(
                        field.field_id,
                        ModuleTableController.module_tables_by_vo_type[field.foreign_ref_vo_type],
                        dt_fields
                    );
                    break;
                }

                default:

                    break;
            }
        }

        return dt_field;
    }

    public static addManyToManyFields<T extends IDistantVOBase>(
        crud: CRUD<T>,
        moduleTable: ModuleTableVO,
        except_table_names: string[] = null) {

        //  On fait le tour des tables manyToMany pour identifier les fields qui font référence à cette table
        const manyToManyModuleTables: ModuleTableVO[] = VOsTypesManager.get_manyToManyModuleTables();
        for (const i in manyToManyModuleTables) {
            const otherModuleTable: ModuleTableVO = manyToManyModuleTables[i];

            if ((!otherModuleTable.module_name) || (!ModulesManager.getModuleByNameAndRole(otherModuleTable.module_name, Module.SharedModuleRoleName)) || (!ModulesManager.getModuleByNameAndRole(otherModuleTable.module_name, Module.SharedModuleRoleName).actif)) {
                continue;
            }

            if (otherModuleTable.full_name == moduleTable.full_name) {
                continue;
            }

            if (!otherModuleTable.any_to_many_default_behaviour_show) {
                continue;
            }

            const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[otherModuleTable.vo_type];
            for (const j in fields) {
                const field: ModuleTableFieldVO = fields[j];

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

                if (!field.foreign_ref_vo_type) {
                    continue;
                }

                if (field.foreign_ref_vo_type != moduleTable.vo_type) {
                    continue;
                }

                const table = ModuleTableController.module_tables_by_vo_type[field.module_table_vo_type];

                if (except_table_names && (except_table_names.indexOf(table.name) >= 0)) {
                    continue;
                }

                const otherField: ModuleTableFieldVO = VOsTypesManager.getManyToManyOtherField(table, field);
                const foreign_table = ModuleTableController.module_tables_by_vo_type[otherField.foreign_ref_vo_type];

                if ((!otherField) || (!foreign_table)) {
                    continue;
                }

                if (foreign_table.default_label_field) {
                    crud.readDatatable.pushField(ManyToManyReferenceDatatableFieldVO.createNew(
                        table.full_name + '_' + field.field_id,
                        foreign_table,
                        table,
                        [
                            SimpleDatatableFieldVO.createNew(foreign_table.default_label_field.field_id)
                        ]
                    ));
                    continue;
                }

                const label_function = ModuleTableController.table_label_function_by_vo_type[otherField.foreign_ref_vo_type];
                if (label_function) {
                    crud.readDatatable.pushField(ManyToManyReferenceDatatableFieldVO.createNew(
                        table.full_name + '_' + field.field_id,
                        foreign_table,
                        table,
                        [
                            ComputedDatatableFieldVO.createNew(
                                otherField.foreign_ref_vo_type + '__' + field.field_id + '__target_label',
                                ModuleDAO.instance.get_compute_function_uid(otherField.foreign_ref_vo_type)
                            )
                        ]));
                    continue;
                }
            }
        }
    }

    public static addOneToManyFields<T extends IDistantVOBase>(
        crud: CRUD<T>,
        moduleTable: ModuleTableVO,
        except_table_names: string[] = null) {

        //  On fait le tour des autres tables existantes pour identifier les manyToOne qui font référence à cette table (hors manytomany)
        for (const i in ModuleTableController.module_tables_by_vo_type) {
            const otherModuleTable: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[i];

            if ((!otherModuleTable.module_name) || (!ModulesManager.getModuleByNameAndRole(otherModuleTable.module_name, Module.SharedModuleRoleName)) || (!ModulesManager.getModuleByNameAndRole(otherModuleTable.module_name, Module.SharedModuleRoleName).actif)) {
                continue;
            }

            if (otherModuleTable.full_name == moduleTable.full_name) {
                continue;
            }

            if (VOsTypesManager.isManyToManyModuleTable(otherModuleTable)) {
                continue;
            }

            if (!otherModuleTable.any_to_many_default_behaviour_show) {
                continue;
            }

            const fields = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[otherModuleTable.vo_type];
            for (const j in fields) {
                const field: ModuleTableFieldVO = fields[j];

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

                if (!field.foreign_ref_vo_type) {
                    continue;
                }

                if (field.foreign_ref_vo_type != moduleTable.vo_type) {
                    continue;
                }

                if (except_table_names && (except_table_names.indexOf(field.foreign_ref_vo_type) >= 0)) {
                    continue;
                }

                const table = ModuleTableController.module_tables_by_vo_type[field.module_table_vo_type];
                if (table.default_label_field) {
                    crud.readDatatable.pushField(OneToManyReferenceDatatableFieldVO.createNew(
                        table.full_name + '_' + field.field_id,
                        table,
                        field,
                        [
                            SimpleDatatableFieldVO.createNew(table.default_label_field.field_id)
                        ]
                    ));
                    continue;
                }

                const label_function = ModuleTableController.table_label_function_by_vo_type[field.module_table_vo_type];
                if (label_function) {
                    crud.readDatatable.pushField(OneToManyReferenceDatatableFieldVO.createNew(
                        table.full_name + '_' + field.field_id,
                        table,
                        field,
                        [
                            ComputedDatatableFieldVO.createNew(
                                field.field_id + '__target_label',
                                ModuleDAO.instance.get_compute_function_uid(table.vo_type)
                            )
                        ]));
                    continue;
                }
            }
        }
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

    public setPostCreate(postCreate: (dataVO: IDistantVOBase) => Promise<void>): CRUD<T> {
        this.postCreate = postCreate;

        return this;
    }

    public setPostUpdate(postUpdate: (dataVO: IDistantVOBase) => Promise<void>): CRUD<T> {
        this.postUpdate = postUpdate;

        return this;
    }

    public setPostDelete(postDelete: (dataVO: IDistantVOBase) => Promise<void>): CRUD<T> {
        this.postDelete = postDelete;

        return this;
    }

    public setIsReadOnlyData<P extends IDistantVOBase>(isReadOnlyData: (dataVO: P) => boolean): CRUD<T> {
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