import { cloneDeep, isArray } from "lodash";
import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleDAO from "../../../../../shared/modules/DAO/ModuleDAO";
import Datatable from "../../../../../shared/modules/DAO/vos/datatable/Datatable";
import DatatableField from "../../../../../shared/modules/DAO/vos/datatable/DatatableField";
import ManyToManyReferenceDatatableField from "../../../../../shared/modules/DAO/vos/datatable/ManyToManyReferenceDatatableField";
import ManyToOneReferenceDatatableField from "../../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableField";
import OneToManyReferenceDatatableField from "../../../../../shared/modules/DAO/vos/datatable/OneToManyReferenceDatatableField";
import RefRangesReferenceDatatableField from "../../../../../shared/modules/DAO/vos/datatable/RefRangesReferenceDatatableField";
import SimpleDatatableField from "../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField";
import IDistantVOBase from "../../../../../shared/modules/IDistantVOBase";
import ModuleTableField from "../../../../../shared/modules/ModuleTableField";
import TableFieldTypesManager from "../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager";
import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import { all_promises } from "../../../../../shared/tools/PromiseTools";
import RangeHandler from "../../../../../shared/tools/RangeHandler";

export default class DatatableRowController {

    public static ACTIONS_COLUMN_ID: string = "__actions_column__";
    public static MULTISELECT_COLUMN_ID: string = "__multiselect_column__";

    public static getInstance(): DatatableRowController {
        if (!DatatableRowController.instance) {
            DatatableRowController.instance = new DatatableRowController();
        }
        return DatatableRowController.instance;
    }

    private static instance: DatatableRowController;

    public get_exportable_datatable_row_data(raw_data: IDistantVOBase, datatable: Datatable<any>, exportable_datatable_columns: string[] = null): any {

        let cloned_data = cloneDeep(raw_data);

        if (!!cloned_data[DatatableRowController.MULTISELECT_COLUMN_ID]) {
            delete cloned_data[DatatableRowController.MULTISELECT_COLUMN_ID];
        }
        if (!!cloned_data[DatatableRowController.ACTIONS_COLUMN_ID]) {
            delete cloned_data[DatatableRowController.ACTIONS_COLUMN_ID];
        }

        for (let column in cloned_data) {

            // On allège le vo en gardant que les colonne à exporter
            if (exportable_datatable_columns && (exportable_datatable_columns.indexOf(column) < 0)) {
                cloned_data[column] = undefined;
            }

            /**
             * On doit aussi traduire les colonnes de type références multiples pour ne pas exporter un objet mais un texte
             */
            let datatable_field = datatable.getFieldByDatatableFieldUID(column);
            if (!datatable_field) {
                // Ex: id
                continue;
            }

            let field_as_simple = (datatable_field as SimpleDatatableField<any, any>);

            // Si c'est un custom :
            if (TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers && field_as_simple && field_as_simple.moduleTableField &&
                TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[field_as_simple.moduleTableField.field_type] &&
                TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[field_as_simple.moduleTableField.field_type].getIHMToExportString) {
                cloned_data[column] = TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[
                    field_as_simple.moduleTableField.field_type].getIHMToExportString(cloned_data, field_as_simple, datatable);
                continue;
            }

            switch (datatable_field.type) {
                case DatatableField.MANY_TO_MANY_FIELD_TYPE:
                case DatatableField.ONE_TO_MANY_FIELD_TYPE:

                    let values = cloned_data[column];
                    let res = "";
                    for (let valuei in values) {
                        let value = values[valuei];

                        if (!value) {
                            continue;
                        }

                        res += ((res && res.length) ? ', ' : '') + value['label'];
                    }
                    cloned_data[column] = res;
                    break;
                default:
                    break;
            }
        }

        return cloned_data;
    }

    public get_datatable_row_data(
        raw_data: IDistantVOBase, datatable: Datatable<any>,
        getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } },
        prepared_ref_fields_data_for_update: { [datatable_field_uid: string]: { [baseData_id: number]: { [dest_id: number]: IDistantVOBase } } }): any {

        if (!raw_data) {
            return raw_data;
        }

        if (!!datatable.conditional_show) {
            if (!datatable.conditional_show(raw_data)) {
                return raw_data;
            }
        }

        let resData: IDistantVOBase = {
            id: raw_data.id,
            _type: raw_data._type
        };

        for (let i in datatable.fields) {
            let field: DatatableField<any, any> = datatable.fields[i];

            this.get_datatable_row_field_data(raw_data, resData, field, getStoredDatas, prepared_ref_fields_data_for_update);
        }
        return resData;
    }

    public get_datatable_row_field_data(
        raw_data: IDistantVOBase, resData: any, field: DatatableField<any, any>,
        getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } },
        prepared_ref_fields_data_for_update: { [datatable_field_uid: string]: { [baseData_id: number]: { [dest_id: number]: IDistantVOBase } } }): any {

        try {

            switch (field.type) {

                case DatatableField.CRUD_ACTIONS_FIELD_TYPE:
                    resData[field.datatable_field_uid] = raw_data[field.datatable_field_uid];
                    break;

                case DatatableField.SIMPLE_FIELD_TYPE:
                    let simpleField: SimpleDatatableField<any, any> = (field) as SimpleDatatableField<any, any>;

                    let value = field.dataToReadIHM(raw_data[simpleField.moduleTableField.field_id], raw_data);
                    // Limite à 300 cars si c'est du html et strip html
                    if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html) {

                        if (value) {
                            try {
                                value = value.replace(/&nbsp;/gi, ' ');
                                value = value.replace(/<\/div>/gi, '\n');
                                value = value.replace(/<\/span>/gi, '\n');
                                value = value.replace(/<\/ul>/gi, '\n');
                                value = value.replace(/<\/li>/gi, '\n');
                                value = value.replace(/<\/p>/gi, '\n');
                                value = value.replace(/<br>/gi, '\n');
                                value = value.replace(/<(?:.|\n)*?>/gm, '');
                                // value = $("<p>" + value + "</p>").text();
                            } catch (error) {
                                value = value;
                            }

                            if (value.length > 300) {
                                value = value.substring(0, 300) + '...';
                            }
                        }
                    }

                    if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html_array) {

                        for (let vi in value) {
                            let v = value[vi];

                            try {

                                v = v.replace(/&nbsp;/gi, ' ');
                                v = v.replace(/<\/div>/gi, '\n');
                                v = v.replace(/<\/span>/gi, '\n');
                                v = v.replace(/<\/ul>/gi, '\n');
                                v = v.replace(/<\/li>/gi, '\n');
                                v = v.replace(/<\/p>/gi, '\n');
                                v = v.replace(/<br>/gi, '\n');
                                v = v.replace(/<(?:.|\n)*?>/gm, '');
                                // v = $("<p>" + v + "</p>").text();
                            } catch (error) {
                                v = v;
                            }

                            if (v.length > 300) {
                                v = v.substring(0, 300) + '...';
                            }

                            value[vi] = v;
                        }
                    }


                    resData[field.datatable_field_uid] = value;
                    break;

                case DatatableField.COMPUTED_FIELD_TYPE:
                    resData[field.datatable_field_uid] = field.dataToReadIHM(null, raw_data);
                    break;

                case DatatableField.COMPONENT_FIELD_TYPE:
                    resData[field.datatable_field_uid] = null;
                    break;

                case DatatableField.FILE_FIELD_TYPE:
                    resData[field.datatable_field_uid] = null;
                    break;

                case DatatableField.MANY_TO_ONE_FIELD_TYPE:
                    let manyToOneField: ManyToOneReferenceDatatableField<any> = (field) as ManyToOneReferenceDatatableField<any>;

                    // On va chercher la valeur du champs depuis la valeur de la donnée liée
                    if (getStoredDatas && getStoredDatas[manyToOneField.targetModuleTable.vo_type]) {
                        let ref_data: IDistantVOBase = getStoredDatas[manyToOneField.targetModuleTable.vo_type][raw_data[manyToOneField.srcField.field_id]];
                        resData[field.datatable_field_uid] = manyToOneField.dataToHumanReadable(ref_data);
                        resData[field.datatable_field_uid + "___id___"] = raw_data[manyToOneField.srcField.field_id];
                        resData[field.datatable_field_uid + "___type___"] = manyToOneField.targetModuleTable.vo_type;
                    }
                    break;

                case DatatableField.ONE_TO_MANY_FIELD_TYPE:
                    let oneToManyField: OneToManyReferenceDatatableField<any> = (field) as OneToManyReferenceDatatableField<any>;

                    resData[field.datatable_field_uid] = [];

                    // for (let oneToManyTargetId in this.getStoredDatas[oneToManyField.targetModuleTable.vo_type]) {
                    //     let targetVo = this.getStoredDatas[oneToManyField.targetModuleTable.vo_type][oneToManyTargetId];

                    //     if ((!!targetVo) && (targetVo[oneToManyField.destField.field_id] == raw_data.id)) {

                    //         resData[field.datatable_field_uid].push({
                    //             id: oneToManyTargetId,
                    //             label: oneToManyField.dataToHumanReadable(targetVo)
                    //         });
                    //     }
                    // }

                    if ((!!prepared_ref_fields_data_for_update) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid]) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id])) {
                        for (let oneToManyTargetId in prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id]) {
                            resData[field.datatable_field_uid].push({
                                id: oneToManyTargetId,
                                label: oneToManyField.dataToHumanReadable(prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id][oneToManyTargetId])
                            });
                        }
                    }
                    break;

                case DatatableField.MANY_TO_MANY_FIELD_TYPE:
                    let manyToManyField: ManyToManyReferenceDatatableField<any, any> = (field) as ManyToManyReferenceDatatableField<any, any>;

                    resData[field.datatable_field_uid] = [];
                    // let dest_ids: number[] = [];
                    // let interTargetRefField = manyToManyField.interModuleTable.getRefFieldFromTargetVoType(manyToManyField.targetModuleTable.vo_type);
                    // let interSrcRefField = manyToManyField.interModuleTable.getRefFieldFromTargetVoType(manyToManyField.moduleTable.vo_type);

                    // for (let interi in this.getStoredDatas[manyToManyField.interModuleTable.vo_type]) {
                    //     let intervo = this.getStoredDatas[manyToManyField.interModuleTable.vo_type][interi];

                    //     if (intervo && (intervo[interSrcRefField.field_id] == raw_data.id) && (dest_ids.indexOf(intervo[interTargetRefField.field_id]) < 0)) {
                    //         dest_ids.push(intervo[interTargetRefField.field_id]);
                    //     }
                    // }

                    // for (let desti in dest_ids) {
                    //     resData[field.datatable_field_uid].push({
                    //         id: dest_ids[desti],
                    //         label: manyToManyField.dataToHumanReadable(this.getStoredDatas[manyToManyField.targetModuleTable.vo_type][dest_ids[desti]])
                    //     });
                    // }

                    if ((!!prepared_ref_fields_data_for_update) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid]) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id])) {
                        for (let oneToManyTargetId in prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id]) {
                            resData[field.datatable_field_uid].push({
                                id: oneToManyTargetId,
                                label: manyToManyField.dataToHumanReadable(prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id][oneToManyTargetId])
                            });
                        }
                    }

                    break;

                case DatatableField.REF_RANGES_FIELD_TYPE:
                    let refField: RefRangesReferenceDatatableField<any> = (field) as RefRangesReferenceDatatableField<any>;

                    resData[field.datatable_field_uid] = [];

                    if (getStoredDatas && getStoredDatas[refField.targetModuleTable.vo_type]) {

                        RangeHandler.getInstance().foreach_ranges_sync(raw_data[refField.srcField.field_id], (id: number) => {
                            let ref_data: IDistantVOBase = getStoredDatas[refField.targetModuleTable.vo_type][id];
                            resData[field.datatable_field_uid].push({
                                id: id,
                                label: refField.dataToHumanReadable(ref_data)
                            });
                        });
                    }
                    break;

                default:
                    break;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            resData[field.datatable_field_uid] = null;
        }
    }

    public async get_datatable_row_field_data_async(
        raw_data: IDistantVOBase, resData: any, field: DatatableField<any, any>,
        prepared_ref_fields_data_for_update: { [datatable_field_uid: string]: { [baseData_id: number]: { [dest_id: number]: IDistantVOBase } } }
    ): Promise<any> {

        try {

            resData[field.datatable_field_uid + '__raw'] = raw_data[field.datatable_field_uid];

            switch (field.type) {

                case DatatableField.CRUD_ACTIONS_FIELD_TYPE:
                    resData[field.datatable_field_uid] = raw_data[field.datatable_field_uid];
                    break;

                case DatatableField.SIMPLE_FIELD_TYPE:
                    let simpleField: SimpleDatatableField<any, any> = (field) as SimpleDatatableField<any, any>;
                    let module_table_field_id = field.semaphore_auto_update_datatable_field_uid_with_vo_type ?
                        simpleField.moduleTableField.module_table.vo_type + '___' + simpleField.moduleTableField.field_id :
                        simpleField.moduleTableField.field_id;

                    let value = field.dataToReadIHM(raw_data[module_table_field_id], raw_data);
                    // Limite à 300 cars si c'est du html et strip html
                    if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html) {

                        if (value) {
                            try {
                                value = value.replace(/&nbsp;/gi, ' ');
                                value = value.replace(/<\/div>/gi, '\n');
                                value = value.replace(/<\/span>/gi, '\n');
                                value = value.replace(/<\/ul>/gi, '\n');
                                value = value.replace(/<\/li>/gi, '\n');
                                value = value.replace(/<\/p>/gi, '\n');
                                value = value.replace(/<br>/gi, '\n');
                                value = value.replace(/<(?:.|\n)*?>/gm, '');
                                // value = $("<p>" + value + "</p>").text();
                            } catch (error) {
                                value = value;
                            }

                            if (value.length > 300) {
                                value = value.substring(0, 300) + '...';
                            }
                        }
                    }

                    if (simpleField.moduleTableField.field_type == ModuleTableField.FIELD_TYPE_html_array) {

                        for (let vi in value) {
                            let v = value[vi];

                            try {

                                v = v.replace(/&nbsp;/gi, ' ');
                                v = v.replace(/<\/div>/gi, '\n');
                                v = v.replace(/<\/span>/gi, '\n');
                                v = v.replace(/<\/ul>/gi, '\n');
                                v = v.replace(/<\/li>/gi, '\n');
                                v = v.replace(/<\/p>/gi, '\n');
                                v = v.replace(/<br>/gi, '\n');
                                v = v.replace(/<(?:.|\n)*?>/gm, '');
                                // v = $("<p>" + v + "</p>").text();
                            } catch (error) {
                                v = v;
                            }

                            if (v.length > 300) {
                                v = v.substring(0, 300) + '...';
                            }

                            value[vi] = v;
                        }
                    }


                    resData[field.datatable_field_uid] = value;
                    break;

                case DatatableField.COMPUTED_FIELD_TYPE:
                    resData[field.datatable_field_uid] = field.dataToReadIHM(null, raw_data);
                    break;

                case DatatableField.COMPONENT_FIELD_TYPE:
                    resData[field.datatable_field_uid] = null;
                    break;

                case DatatableField.FILE_FIELD_TYPE:
                    resData[field.datatable_field_uid] = null;
                    break;

                case DatatableField.MANY_TO_ONE_FIELD_TYPE:
                    let manyToOneField: ManyToOneReferenceDatatableField<any> = (field) as ManyToOneReferenceDatatableField<any>;

                    let src_module_table_field_id = field.semaphore_auto_update_datatable_field_uid_with_vo_type ?
                        manyToOneField.srcField.module_table.vo_type + '___' + manyToOneField.srcField.field_id :
                        manyToOneField.srcField.field_id;

                    // On va chercher la valeur du champs depuis la valeur de la donnée liée
                    if (!!raw_data[src_module_table_field_id]) {
                        let ref_data: IDistantVOBase = await query(manyToOneField.targetModuleTable.vo_type).filter_by_id(raw_data[src_module_table_field_id]).select_vo();
                        resData[field.datatable_field_uid] = manyToOneField.dataToHumanReadable(ref_data);
                        resData[field.datatable_field_uid + "___id___"] = raw_data[src_module_table_field_id];
                        resData[field.datatable_field_uid + "___type___"] = manyToOneField.targetModuleTable.vo_type;
                    }
                    break;

                case DatatableField.ONE_TO_MANY_FIELD_TYPE:
                    let oneToManyField: OneToManyReferenceDatatableField<any> = (field) as OneToManyReferenceDatatableField<any>;

                    resData[field.datatable_field_uid] = [];

                    // if ((!!prepared_ref_fields_data_for_update) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid]) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id])) {
                    //     for (let oneToManyTargetId in prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id]) {
                    //         resData[field.datatable_field_uid].push({
                    //             id: oneToManyTargetId,
                    //             label: oneToManyField.dataToHumanReadable(prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id][oneToManyTargetId])
                    //         });
                    //     }
                    // }

                    if (!!raw_data[field.datatable_field_uid]) {
                        let vo_ids: any[] = raw_data[field.datatable_field_uid];

                        if (!isArray(vo_ids)) {
                            vo_ids = [vo_ids];
                        }

                        let promises = [];

                        for (let i in vo_ids) {
                            promises.push((async () => {
                                let ref_data: IDistantVOBase = await query(manyToManyField.targetModuleTable.vo_type).filter_by_id(vo_ids[i]).select_vo();

                                resData[field.datatable_field_uid].push({
                                    id: ref_data.id,
                                    label: manyToManyField.dataToHumanReadable(ref_data)
                                });
                            })());
                        }

                        await all_promises(promises);
                    }
                    break;

                case DatatableField.MANY_TO_MANY_FIELD_TYPE:
                    let manyToManyField: ManyToManyReferenceDatatableField<any, any> = (field) as ManyToManyReferenceDatatableField<any, any>;

                    resData[field.datatable_field_uid] = [];

                    // if ((!!prepared_ref_fields_data_for_update) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid]) && (!!prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id])) {
                    //     for (let oneToManyTargetId in prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id]) {
                    //         resData[field.datatable_field_uid].push({
                    //             id: oneToManyTargetId,
                    //             label: manyToManyField.dataToHumanReadable(prepared_ref_fields_data_for_update[field.datatable_field_uid][raw_data.id][oneToManyTargetId])
                    //         });
                    //     }
                    // }

                    if (!!raw_data[field.datatable_field_uid]) {
                        let vo_ids: any[] = raw_data[field.datatable_field_uid];

                        if (!isArray(vo_ids)) {
                            vo_ids = [vo_ids];
                        }

                        let promises = [];

                        for (let i in vo_ids) {
                            promises.push((async () => {
                                let ref_data: IDistantVOBase = await query(manyToManyField.targetModuleTable.vo_type).filter_by_id(vo_ids[i]).select_vo();

                                resData[field.datatable_field_uid].push({
                                    id: ref_data.id,
                                    label: manyToManyField.dataToHumanReadable(ref_data)
                                });
                            })());
                        }

                        await all_promises(promises);
                    }

                    break;

                case DatatableField.REF_RANGES_FIELD_TYPE:
                    let refField: RefRangesReferenceDatatableField<any> = (field) as RefRangesReferenceDatatableField<any>;

                    resData[field.datatable_field_uid] = [];

                    let refField_src_module_table_field_id = field.semaphore_auto_update_datatable_field_uid_with_vo_type ?
                        refField.srcField.module_table.vo_type + '___' + refField.srcField.field_id :
                        refField.srcField.field_id;

                    await RangeHandler.getInstance().foreach_ranges_batch_await(raw_data[refField_src_module_table_field_id], async (id: number) => {
                        let ref_data: IDistantVOBase = await query(refField.targetModuleTable.vo_type).filter_by_id(id).select_vo();
                        resData[field.datatable_field_uid].push({
                            id: id,
                            label: refField.dataToHumanReadable(ref_data)
                        });
                    });
                    break;

                default:
                    break;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            resData[field.datatable_field_uid] = null;
        }
    }
}