import { cloneDeep } from 'lodash';
import Alert from '../../../../../shared/modules/Alert/vos/Alert';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import CRUD from '../../../../../shared/modules/DAO/vos/CRUD';
import Datatable from '../../../../../shared/modules/DAO/vos/datatable/Datatable';
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ManyToManyReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ManyToManyReferenceDatatableField';
import ManyToOneReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableField';
import OneToManyReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/OneToManyReferenceDatatableField';
import ReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ReferenceDatatableField';
import RefRangesReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/RefRangesReferenceDatatableField';
import SimpleDatatableField from '../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import FileVO from '../../../../../shared/modules/File/vos/FileVO';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import TableFieldTypesManager from '../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../../shared/tools/DateHandler';
import VueComponentBase from '../../VueComponentBase';
import CRUDComponentManager from '../CRUDComponentManager';

export default class CRUDFormServices {

    public static getInstance() {
        if (!CRUDFormServices._instance) {
            CRUDFormServices._instance = new CRUDFormServices();
        }

        return CRUDFormServices._instance;
    }

    private static _instance: CRUDFormServices = null;

    public loadDatasFromDatatable(
        datatable: Datatable<IDistantVOBase>,
        api_types_involved: string[],
        storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void,
        only_fields: boolean = false
    ): Array<Promise<any>> {
        let res: Array<Promise<any>> = [];

        if (api_types_involved.indexOf(datatable.API_TYPE_ID) < 0) {
            api_types_involved.push(datatable.API_TYPE_ID);

            if (!only_fields) {

                res.push(
                    (async () => {
                        let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<
                            IDistantVOBase
                        >(datatable.API_TYPE_ID);
                        storeDatas({
                            API_TYPE_ID: datatable.API_TYPE_ID,
                            vos: vos
                        });
                    })()
                );
            }

            for (let i in datatable.fields) {
                let field = datatable.fields[i];

                res = res.concat(this.loadDatasFromDatatableField(field, api_types_involved, storeDatas));
            }
        }

        return res;
    }

    public loadDatasFromDatatableField(
        load_from_datatable_field: DatatableField<any, any>,
        api_types_involved: string[],
        storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void
    ): Array<Promise<any>> {
        let res: Array<Promise<any>> = [];
        let self = this;

        if (load_from_datatable_field.type == DatatableField.SIMPLE_FIELD_TYPE) {
            return res;
        }

        if ((load_from_datatable_field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) ||
            (load_from_datatable_field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) ||
            (load_from_datatable_field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) ||
            (load_from_datatable_field.type == DatatableField.REF_RANGES_FIELD_TYPE)) {
            let reference: ReferenceDatatableField<any> = load_from_datatable_field as ReferenceDatatableField<any>;
            if (api_types_involved.indexOf(reference.targetModuleTable.vo_type) < 0) {
                api_types_involved.push(reference.targetModuleTable.vo_type);
                res.push(
                    (async () => {
                        let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<IDistantVOBase>(reference.targetModuleTable.vo_type);
                        storeDatas({
                            API_TYPE_ID: reference.targetModuleTable.vo_type,
                            vos: vos
                        });
                    })()
                );
            }
            for (let i in reference.sortedTargetFields) {
                res = res.concat(
                    this.loadDatasFromDatatableField(reference.sortedTargetFields[i], api_types_involved, storeDatas)
                );
            }
        }

        if (load_from_datatable_field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) {
            let reference: ManyToManyReferenceDatatableField<any, any> = load_from_datatable_field as ManyToManyReferenceDatatableField<any, any>;

            if (api_types_involved.indexOf(reference.interModuleTable.vo_type) < 0) {
                api_types_involved.push(reference.interModuleTable.vo_type);

                res.push(
                    (async () => {
                        let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<IDistantVOBase>(reference.interModuleTable.vo_type);
                        storeDatas({
                            API_TYPE_ID: reference.interModuleTable.vo_type,
                            vos: vos
                        });
                    })()
                );
            }
        }

        return res;
    }

    public async getNewVO(
        crud: CRUD<any>,
        vo_init: IDistantVOBase,
        onChangeVO: (vo: IDistantVOBase) => void): Promise<IDistantVOBase> {

        let obj = {
            _type: crud.readDatatable.API_TYPE_ID,
            id: null
        };

        // On peut init soit en passant par le CRUDComponentManager soit via une prop
        // Si on a le choix, on priorise la prop
        if (!!vo_init) {
            obj = vo_init;
        }

        // Si on a un VO à init, on le fait
        if ((!vo_init) && CRUDComponentManager.getInstance().getIDistantVOInit(false)) {
            obj = CRUDComponentManager.getInstance().getIDistantVOInit();
        }

        for (let i in crud.createDatatable.fields) {
            let field: DatatableField<any, any> = crud.createDatatable.fields[i];

            if (field.datatable_field_uid != field.module_table_field_id) {
                continue;
            }

            switch (field.type) {
                case DatatableField.SIMPLE_FIELD_TYPE:
                    obj[field.datatable_field_uid] = ((obj[field.datatable_field_uid]) ? obj[field.datatable_field_uid] : (field as SimpleDatatableField<any, any>).moduleTableField.field_default);
                    break;
                case DatatableField.MANY_TO_ONE_FIELD_TYPE:
                    obj[field.datatable_field_uid] = ((obj[field.datatable_field_uid]) ? obj[field.datatable_field_uid] : (field as ManyToOneReferenceDatatableField<any>).srcField.field_default);
                    break;
                case DatatableField.REF_RANGES_FIELD_TYPE:
                    obj[field.datatable_field_uid] = ((obj[field.datatable_field_uid]) ? obj[field.datatable_field_uid] : (field as RefRangesReferenceDatatableField<any>).srcField.field_default);
                    break;

                default:
                // obj[field.datatable_field_uid] = null;
            }
        }

        // On passe la traduction en IHM sur les champs
        let newVO = this.dataToIHM(obj, crud.createDatatable, false);

        if (!!crud.hook_prepare_new_vo_for_creation) {
            await crud.hook_prepare_new_vo_for_creation(newVO);
        }

        onChangeVO(newVO);

        return newVO;
    }

    public dataToIHM(vo: IDistantVOBase, datatable: Datatable<any>, isUpdate: boolean): IDistantVOBase {

        let res = Object.assign({}, vo);

        for (let i in datatable.fields) {
            let field = datatable.fields[i];

            if (field.datatable_field_uid != field.module_table_field_id) {
                continue;
            }


            if (isUpdate) {

                res[field.datatable_field_uid] = field.dataToUpdateIHM(res[field.datatable_field_uid], res);
            } else {

                res[field.datatable_field_uid] = field.dataToCreateIHM(res[field.datatable_field_uid], res);
            }

            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                let simpleFieldType = (field as SimpleDatatableField<any, any>).moduleTableField.field_type;

                if (simpleFieldType == ModuleTableField.FIELD_TYPE_daterange) {

                    if (res[field.datatable_field_uid]) {

                        let value = res[field.datatable_field_uid];
                        let parts: string[] = value.split('-');

                        if ((!parts) || (parts.length <= 0)) {
                            continue;
                        }

                        if (parts[0] && parts[0].trim() && (parts[0].trim() != "")) {
                            res[field.datatable_field_uid + "_start"] = DateHandler.getInstance().formatDayForIndex(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[0].trim()).unix());
                        }
                        if (parts[1] && parts[1].trim() && (parts[1].trim() != "")) {
                            res[field.datatable_field_uid + "_end"] = DateHandler.getInstance().formatDayForIndex(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[1].trim()).unix());
                        }
                    }
                }

                if (simpleFieldType == ModuleTableField.FIELD_TYPE_refrange_array) {
                    // TODO FIXME ASAP VARS
                }
                if (simpleFieldType == ModuleTableField.FIELD_TYPE_numrange_array) {
                    // TODO FIXME ASAP VARS
                }

                if (simpleFieldType == ModuleTableField.FIELD_TYPE_isoweekdays) {
                    // TODO FIXME ASAP VARS
                }

                // if (simpleFieldType == ModuleTableField.FIELD_TYPE_daterange_array) {
                //     // TODO FIXME ASAP VARS
                // }

                if (simpleFieldType == ModuleTableField.FIELD_TYPE_tstzrange_array) {
                    // TODO FIXME ASAP VARS
                }

                if ((simpleFieldType == ModuleTableField.FIELD_TYPE_tstz_array) ||
                    (simpleFieldType == ModuleTableField.FIELD_TYPE_int_array) ||
                    (simpleFieldType == ModuleTableField.FIELD_TYPE_string_array) ||
                    (simpleFieldType == ModuleTableField.FIELD_TYPE_html_array)) {
                    res[field.datatable_field_uid] = !!res[field.datatable_field_uid] ? Array.from(res[field.datatable_field_uid]) : null;
                }

                for (let j in TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers) {
                    let tableFieldTypeController = TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[j];

                    if (simpleFieldType == tableFieldTypeController.name) {
                        tableFieldTypeController.dataToIHM(vo, (field as SimpleDatatableField<any, any>), res, datatable, isUpdate);
                    }
                }
            }
        }

        return res;
    }

    public IHMToData(vo: IDistantVOBase, datatable: Datatable<any>, isUpdate: boolean): IDistantVOBase {

        let res = Object.assign({}, vo);

        for (let i in datatable.fields) {
            let field = datatable.fields[i];

            if (field.datatable_field_uid != field.module_table_field_id) {
                continue;
            }

            if ((field.type == ReferenceDatatableField.MANY_TO_MANY_FIELD_TYPE) || (field.type == ReferenceDatatableField.ONE_TO_MANY_FIELD_TYPE)) {
                continue;
            }

            if (isUpdate) {

                res[field.datatable_field_uid] = field.UpdateIHMToData(res[field.datatable_field_uid], res);
            } else {

                res[field.datatable_field_uid] = field.CreateIHMToData(res[field.datatable_field_uid], res);
            }

            if (field.type == DatatableField.SIMPLE_FIELD_TYPE) {
                let simpleFieldType = (field as SimpleDatatableField<any, any>).moduleTableField.field_type;

                if (simpleFieldType == ModuleTableField.FIELD_TYPE_daterange) {
                    if (simpleFieldType == ModuleTableField.FIELD_TYPE_daterange) {
                        res[field.datatable_field_uid + "_start"] = undefined;
                        res[field.datatable_field_uid + "_end"] = undefined;
                    }

                    if (simpleFieldType == ModuleTableField.FIELD_TYPE_refrange_array) {
                        // TODO FIXME ASAP VARS
                    }
                    if (simpleFieldType == ModuleTableField.FIELD_TYPE_numrange_array) {
                        // TODO FIXME ASAP VARS
                    }
                    if (simpleFieldType == ModuleTableField.FIELD_TYPE_isoweekdays) {
                        // TODO FIXME ASAP VARS
                    }

                    // if (simpleFieldType == ModuleTableField.FIELD_TYPE_daterange_array) {
                    //     // TODO FIXME ASAP VARS
                    // }

                    if (simpleFieldType == ModuleTableField.FIELD_TYPE_tstzrange_array) {
                        // TODO FIXME ASAP VARS
                    }

                    for (let j in TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers) {
                        let tableFieldTypeController = TableFieldTypesManager.getInstance().registeredTableFieldTypeControllers[j];

                        if (simpleFieldType == tableFieldTypeController.name) {
                            tableFieldTypeController.IHMToData(vo, field as SimpleDatatableField<any, any>, res, datatable, isUpdate);
                        }
                    }
                }
            }
        }

        return res;
    }

    /**
     * Méthode qui prend tous les champs ManyToMany de la table et met à jour les tables intermédiaires si besoin
     * @param vo
     */
    public async updateOneToMany(
        datatable_vo: IDistantVOBase, datatable: Datatable<IDistantVOBase>, db_vo: IDistantVOBase,
        getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } },
        updateData: (vo: IDistantVOBase) => void
    ) {
        try {

            for (let i in datatable.fields) {

                if (datatable.fields[i].type != ReferenceDatatableField.ONE_TO_MANY_FIELD_TYPE) {
                    continue;
                }

                let field: OneToManyReferenceDatatableField<any> = datatable.fields[i] as OneToManyReferenceDatatableField<any>;
                let actual_links: IDistantVOBase[] = await ModuleDAO.getInstance().getVosByRefFieldIds(field.targetModuleTable.vo_type, field.destField.field_id, [db_vo.id]);
                let new_links_target_ids: number[] = cloneDeep(datatable_vo[field.module_table_field_id]);

                let need_update_links: IDistantVOBase[] = [];

                if (new_links_target_ids) {
                    for (let j in actual_links) {
                        let actual_link = actual_links[j];

                        if (new_links_target_ids.indexOf(actual_link.id) < 0) {

                            actual_link[field.destField.field_id] = null;
                            need_update_links.push(actual_link);
                            continue;
                        }

                        new_links_target_ids.splice(new_links_target_ids.indexOf(actual_link.id), 1);
                    }

                    for (let j in new_links_target_ids) {
                        let new_link_target_id = new_links_target_ids[j];

                        if ((!getStoredDatas[field.targetModuleTable.vo_type]) || (!getStoredDatas[field.targetModuleTable.vo_type][new_link_target_id])) {
                            continue;
                        }
                        getStoredDatas[field.targetModuleTable.vo_type][new_link_target_id][field.destField.field_id] = db_vo.id;
                        need_update_links.push(getStoredDatas[field.targetModuleTable.vo_type][new_link_target_id]);
                    }
                }

                if (need_update_links.length > 0) {

                    await ModuleDAO.getInstance().insertOrUpdateVOs(need_update_links);
                    for (let linki in need_update_links) {

                        updateData(need_update_links[linki]);
                    }
                }
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
    }


    /**
     * Méthode qui prend tous les champs ManyToMany de la table et met à jour les tables intermédiaires si besoin
     * @param vo
     */
    public async updateManyToMany(
        datatable_vo: IDistantVOBase, datatable: Datatable<IDistantVOBase>, db_vo: IDistantVOBase,
        removeData: (infos: { API_TYPE_ID: string, id: number }) => void,
        storeData: (vo: IDistantVOBase) => void, component: VueComponentBase
    ) {
        try {

            for (let i in datatable.fields) {

                if (datatable.fields[i].type != ReferenceDatatableField.MANY_TO_MANY_FIELD_TYPE) {
                    continue;
                }

                let field: ManyToManyReferenceDatatableField<any, any> = datatable.fields[i] as ManyToManyReferenceDatatableField<any, any>;
                let interSrcRefField = field.interSrcRefFieldId ? field.interModuleTable.getFieldFromId(field.interSrcRefFieldId) : field.interModuleTable.getRefFieldFromTargetVoType(db_vo._type);
                let actual_links: IDistantVOBase[] = await ModuleDAO.getInstance().getVosByRefFieldIds(field.interModuleTable.vo_type, interSrcRefField.field_id, [db_vo.id]);
                let interDestRefField = field.interTargetRefFieldId ? field.interModuleTable.getFieldFromId(field.interTargetRefFieldId) : field.interModuleTable.getRefFieldFromTargetVoType(field.targetModuleTable.vo_type);
                let new_links_target_ids: number[] = cloneDeep(datatable_vo[field.module_table_field_id]);

                let need_add_links: IDistantVOBase[] = [];
                let need_delete_links: IDistantVOBase[] = [];

                let sample_vo: IDistantVOBase = {
                    id: undefined,
                    _type: field.interModuleTable.vo_type,
                    [interSrcRefField.field_id]: db_vo.id
                };

                if (new_links_target_ids) {
                    for (let j in actual_links) {
                        let actual_link = actual_links[j];

                        if (new_links_target_ids.indexOf(actual_link[interDestRefField.field_id]) < 0) {

                            need_delete_links.push(actual_link);
                            continue;
                        }

                        new_links_target_ids.splice(new_links_target_ids.indexOf(actual_link[interDestRefField.field_id]), 1);
                    }

                    for (let j in new_links_target_ids) {
                        let new_link_target_id = new_links_target_ids[j];

                        let link_vo: IDistantVOBase = Object.assign({}, sample_vo);

                        link_vo[interDestRefField.field_id] = new_link_target_id;

                        need_add_links.push(link_vo);
                    }
                }

                if (need_add_links.length > 0) {
                    for (let linki in need_add_links) {

                        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(need_add_links[linki]);
                        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                            component.snotify.error(component.label('crud.create.errors.many_to_many_failure'));
                            continue;
                        }
                        need_add_links[linki].id = insertOrDeleteQueryResult.id;
                        storeData(need_add_links[linki]);
                    }
                }
                if (need_delete_links.length > 0) {
                    await ModuleDAO.getInstance().deleteVOs(need_delete_links);
                    for (let linki in need_delete_links) {
                        removeData({
                            API_TYPE_ID: field.interModuleTable.vo_type,
                            id: need_delete_links[linki].id
                        });
                    }
                }
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
    }

    public checkForm(
        vo: IDistantVOBase, datatable: Datatable<IDistantVOBase>,
        clear_alerts: () => void, register_alerts: (alerts: Alert[]) => void): boolean {

        clear_alerts();

        let alerts: Alert[] = [];


        // On check que tous les champs obligatoire soient bien remplis
        for (let i in datatable.fields) {
            let field: DatatableField<any, any> = datatable.fields[i];

            if (field.is_readonly) {
                continue;
            }

            // Si c'est required et que j'ai pas de valeur, j'affiche une erreur
            if (!field.is_required) {
                continue;
            }

            if ((vo[field.datatable_field_uid] !== null && vo[field.datatable_field_uid] !== undefined) && vo[field.datatable_field_uid].toString().length > 0) {
                continue;
            }

            alerts.push(new Alert(field.alert_path, 'crud.field_required', Alert.TYPE_ERROR));
        }

        if (alerts.length > 0) {
            register_alerts(alerts);
            return false;
        }

        return true;
    }

    /**
     * Cas spécifique du FileVo sur lequel on a un champ fichier qui crée l'objet que l'on souhaite update ou create.
     * Si on est en cours d'update, il faut conserver l'ancien vo (pour maintenir les liaisons vers son id)
     *  et lui mettre en path le nouveau fichier. On garde aussi le nouveau file, pour archive de l'ancien fichier
     * @param vo
     * @param field
     * @param fileVo
     */
    public async uploadedFile(
        vo: IDistantVOBase, field: DatatableField<any, any>, fileVo: FileVO,
        api_type_id: string, editableVO: IDistantVOBase, updateData: (vo: IDistantVOBase) => void,
        component: VueComponentBase) {
        if ((!fileVo) || (!fileVo.id)) {
            return;
        }
        if (api_type_id != FileVO.API_TYPE_ID) {
            return;
        }


        if (vo && vo.id) {
            let tmp = editableVO[field.datatable_field_uid];
            editableVO[field.datatable_field_uid] = fileVo[field.datatable_field_uid];
            fileVo[field.datatable_field_uid] = tmp;

            await ModuleDAO.getInstance().insertOrUpdateVOs([editableVO, fileVo]);
            updateData(editableVO);
            updateData(fileVo);
        }

        component.$emit('close');
    }
}