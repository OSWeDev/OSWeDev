import * as $ from 'jquery';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleAjaxCache from '../../../../../shared/modules/AjaxCache/ModuleAjaxCache';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import Datatable from '../../../../../shared/modules/DAO/vos/datatable/Datatable';
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ManyToManyReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ManyToManyReferenceDatatableField';
import ManyToOneReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableField';
import OneToManyReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/OneToManyReferenceDatatableField';
import ReferenceDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ReferenceDatatableField';
import SimpleDatatableField from '../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import FileVO from '../../../../../shared/modules/File/vos/FileVO';
import ModuleFormatDatesNombres from '../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import TableFieldTypesManager from '../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import DateHandler from '../../../../../shared/tools/DateHandler';
import ObjectHandler from '../../../../../shared/tools/ObjectHandler';
import { ModuleCRUDAction, ModuleCRUDGetter } from '../../crud/store/CRUDStore';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import DatatableComponent from '../../datatable/component/DatatableComponent';
import VueComponentBase from '../../VueComponentBase';
import CRUDComponentManager from '../CRUDComponentManager';
import CRUD from '../vos/CRUD';
import "./CRUDComponent.scss";
import CRUDComponentField from './field/CRUDComponentField';

@Component({
    template: require('./CRUDComponent.pug'),
    components: {
        datatable: DatatableComponent,
        crud_field: CRUDComponentField,
    },
})
export default class CRUDComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    public updateData: (vo: IDistantVOBase) => void;
    @ModuleDAOAction
    public removeData: (infos: { API_TYPE_ID: string, id: number }) => void;
    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;
    @ModuleCRUDAction
    public setSelectedVOs: (selectedVOs: IDistantVOBase[]) => void;

    @ModuleCRUDGetter
    public getSelectedVOs: IDistantVOBase[];

    @Prop()
    private crud: CRUD<IDistantVOBase>;

    @Prop({ default: false })
    private modal_show_update: boolean;
    @Prop({ default: false })
    private modal_show_create: boolean;
    @Prop({ default: false })
    private modal_show_delete: boolean;

    @Prop()
    private modal_vo_id: number;

    @Prop({ default: null })
    private read_query: any;

    @Prop({ default: false })
    private bootstrap_3_modal_fallback: boolean;

    private editableVO: IDistantVOBase = null;
    private newVO: IDistantVOBase = null;

    private api_types_involved: string[] = [];

    private creating_vo: boolean = false;
    private updating_vo: boolean = false;
    private deleting_vo: boolean = false;

    private is_only_readable: boolean = false;

    public async mounted() {
        if (this.read_query) {
            this.$router.replace({ query: this.read_query });
        }
        await this.reload_datas();
        await this.handle_modal_show_hide();
    }

    @Watch("$route")
    private async handle_modal_show_hide() {
        $("#updateData,#createData,#deleteData").on("hidden.bs.modal", () => {
            this.$router.push(this.callback_route);

        });

        if (this.read_query) {
            this.$router.replace({ query: this.read_query });
        }

        if (!this.modal_show_create) {
            $('#createData').modal('hide');
        }
        if (!this.modal_show_update) {
            $('#updateData').modal('hide');
        }
        if (!this.modal_show_delete) {
            $('#deleteData').modal('hide');
        }

        let vo: IDistantVOBase = null;

        if (this.crud && this.crud.updateDatatable && this.crud.updateDatatable.API_TYPE_ID && this.getStoredDatas && this.getStoredDatas[this.crud.updateDatatable.API_TYPE_ID] && this.getStoredDatas[this.crud.updateDatatable.API_TYPE_ID][this.modal_vo_id]) {
            vo = this.getStoredDatas[this.crud.updateDatatable.API_TYPE_ID][this.modal_vo_id];
        }

        if (CRUDComponentManager.getInstance().callback_handle_modal_show_hide) {
            await CRUDComponentManager.getInstance().callback_handle_modal_show_hide(vo);
        }

        if (this.modal_show_create) {
            $('#createData').modal('show');
            return;
        }
        if (this.modal_show_update) {
            this.setSelectedVOs([vo]);
            $('#updateData').modal('show');
            return;
        }
        if (this.modal_show_delete) {
            this.setSelectedVOs([vo]);
            $('#deleteData').modal('show');
            return;
        }
    }

    private async loaddatas() {

        this.isLoading = true;

        this.loadingProgression = 0;
        this.nbLoadingSteps = 5;

        if (!this.crud) {
            this.snotify.error(this.label('crud.errors.loading'));
            return;
        }

        await Promise.all(this.loadDatasFromDatatable(this.crud.readDatatable));
        this.nextLoadingStep();
        await Promise.all(this.loadDatasFromDatatable(this.crud.createDatatable));
        this.nextLoadingStep();
        await Promise.all(this.loadDatasFromDatatable(this.crud.updateDatatable));
        this.nextLoadingStep();

        this.prepareNewVO();
        this.nextLoadingStep();
        this.nextLoadingStep();

        this.isLoading = false;
    }

    // Handle Loading of stored data

    private loadDatasFromDatatable(
        datatable: Datatable<IDistantVOBase>
    ): Array<Promise<any>> {
        let res: Array<Promise<any>> = [];
        let self = this;

        if (self.api_types_involved.indexOf(datatable.API_TYPE_ID) < 0) {
            self.api_types_involved.push(datatable.API_TYPE_ID);

            res.push(
                (async () => {
                    let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<
                        IDistantVOBase
                    >(datatable.API_TYPE_ID);
                    self.storeDatas({
                        API_TYPE_ID: datatable.API_TYPE_ID,
                        vos: vos
                    });
                })()
            );

            for (let i in datatable.fields) {
                let field = datatable.fields[i];

                res = res.concat(this.loadDatasFromDatatableField(field));
            }
        }

        return res;
    }

    private loadDatasFromDatatableField(load_from_datatable_field: DatatableField<any, any>): Array<Promise<any>> {
        let res: Array<Promise<any>> = [];
        let self = this;

        if (load_from_datatable_field.type == DatatableField.SIMPLE_FIELD_TYPE) {
            return res;
        }

        if ((load_from_datatable_field.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) ||
            (load_from_datatable_field.type == DatatableField.ONE_TO_MANY_FIELD_TYPE) ||
            (load_from_datatable_field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE)) {
            let reference: ReferenceDatatableField<any> = load_from_datatable_field as ReferenceDatatableField<any>;
            if (self.api_types_involved.indexOf(reference.targetModuleTable.vo_type) < 0) {
                self.api_types_involved.push(reference.targetModuleTable.vo_type);
                res.push(
                    (async () => {
                        let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<IDistantVOBase>(reference.targetModuleTable.vo_type);
                        self.storeDatas({
                            API_TYPE_ID: reference.targetModuleTable.vo_type,
                            vos: vos
                        });
                    })()
                );
            }
            for (let i in reference.sortedTargetFields) {
                res = res.concat(
                    this.loadDatasFromDatatableField(reference.sortedTargetFields[i])
                );
            }
        }

        if (load_from_datatable_field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) {
            let reference: ManyToManyReferenceDatatableField<any, any> = load_from_datatable_field as ManyToManyReferenceDatatableField<any, any>;

            if (self.api_types_involved.indexOf(reference.interModuleTable.vo_type) < 0) {
                self.api_types_involved.push(reference.interModuleTable.vo_type);

                res.push(
                    (async () => {
                        let vos: IDistantVOBase[] = await ModuleDAO.getInstance().getVos<IDistantVOBase>(reference.interModuleTable.vo_type);
                        self.storeDatas({
                            API_TYPE_ID: reference.interModuleTable.vo_type,
                            vos: vos
                        });
                    })()
                );
            }
        }

        return res;
    }

    @Watch("crud")
    private async updatedCRUD() {
        await this.reload_datas();
    }

    private prepareNewVO() {

        let obj = {
            _type: this.crud.readDatatable.API_TYPE_ID,
            id: null
        };

        // Si on a un VO à init, on le fait
        if (CRUDComponentManager.getInstance().getIDistantVOInit(false)) {
            obj = CRUDComponentManager.getInstance().getIDistantVOInit();
        }

        for (let i in this.crud.createDatatable.fields) {
            let field: DatatableField<any, any> = this.crud.createDatatable.fields[i];

            if (field.datatable_field_uid != field.module_table_field_id) {
                continue;
            }

            switch (field.type) {
                case DatatableField.SIMPLE_FIELD_TYPE:
                    obj[field.datatable_field_uid] = ((obj[field.datatable_field_uid]) ? obj[field.datatable_field_uid] : (field as SimpleDatatableField<any, any>).moduleTableField.field_default);
                    break;

                default:
                // obj[field.datatable_field_uid] = null;
            }
        }

        // On passe la traduction en IHM sur les champs
        this.newVO = this.dataToIHM(obj, this.crud.createDatatable, false);

        this.onChangeVO(this.newVO);
    }

    get CRUDTitle(): string {
        if (!this.crud) {
            return null;
        }

        return this.label('crud.read.title', {
            datatable_title:
                this.t(VOsTypesManager.getInstance().moduleTables_by_voType[this.crud.readDatatable.API_TYPE_ID].label.code_text)
        });
    }

    get selectedVO(): IDistantVOBase {
        if ((!this.getSelectedVOs) || (!this.getSelectedVOs[0])) {
            return null;
        }

        return this.getSelectedVOs[0];
    }

    @Watch("selectedVO")
    private updateSelectedVO() {
        if (!this.selectedVO) {
            this.editableVO = null;
        }

        // On passe la traduction en IHM sur les champs
        this.editableVO = this.dataToIHM(this.getSelectedVOs[0], this.crud.updateDatatable, true);
        this.onChangeVO(this.editableVO);
    }

    private dataToIHM(vo: IDistantVOBase, datatable: Datatable<any>, isUpdate: boolean): IDistantVOBase {

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
                            res[field.datatable_field_uid + "_start"] = DateHandler.getInstance().formatDayForIndex(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[0].trim()));
                        }
                        if (parts[1] && parts[1].trim() && (parts[1].trim() != "")) {
                            res[field.datatable_field_uid + "_end"] = DateHandler.getInstance().formatDayForIndex(ModuleFormatDatesNombres.getInstance().getMomentFromFormatted_FullyearMonthDay(parts[1].trim()));
                        }
                    }
                }

                if (simpleFieldType == ModuleTableField.FIELD_TYPE_numrange_array) {
                    // TODO FIXME ASAP VARS
                }

                // if (simpleFieldType == ModuleTableField.FIELD_TYPE_daterange_array) {
                //     // TODO FIXME ASAP VARS
                // }

                if (simpleFieldType == ModuleTableField.FIELD_TYPE_tstzrange_array) {
                    // TODO FIXME ASAP VARS
                }

                if (simpleFieldType == ModuleTableField.FIELD_TYPE_int_array) {
                    res[field.datatable_field_uid] = !!res[field.datatable_field_uid] ? Array.from(res[field.datatable_field_uid]) : null;
                }
                if (simpleFieldType == ModuleTableField.FIELD_TYPE_string_array) {
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

    private IHMToData(vo: IDistantVOBase, datatable: Datatable<any>, isUpdate: boolean): IDistantVOBase {

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

                    if (simpleFieldType == ModuleTableField.FIELD_TYPE_numrange_array) {
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

    private async createVO() {
        this.snotify.info(this.label('crud.create.starting'));
        this.creating_vo = true;

        if ((!this.newVO) || (this.newVO.id) || (this.newVO._type !== this.crud.readDatatable.API_TYPE_ID)) {
            this.snotify.error(this.label('crud.create.errors.newvo_failure'));
            this.creating_vo = false;
            return;
        }

        try {

            // On passe la traduction depuis IHM sur les champs
            let apiokVo = this.IHMToData(this.newVO, this.crud.createDatatable, false);

            let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(apiokVo);
            if ((!res) || (!res.id)) {
                this.snotify.error(this.label('crud.create.errors.create_failure'));
                this.creating_vo = false;
                return;
            }

            let id = res.id ? parseInt(res.id.toString()) : null;
            this.newVO.id = id;

            let createdVO = await ModuleDAO.getInstance().getVoById<any>(this.crud.readDatatable.API_TYPE_ID, id);
            if ((!createdVO) || (createdVO.id !== id) || (createdVO._type !== this.crud.readDatatable.API_TYPE_ID)) {
                this.snotify.error(this.label('crud.create.errors.create_failure'));
                this.creating_vo = false;
                return;
            }

            // On doit mettre à jour les OneToMany, et ManyToMany dans les tables correspondantes
            await this.updateManyToMany(this.newVO, this.crud.createDatatable, createdVO);
            await this.updateOneToMany(this.newVO, this.crud.createDatatable, createdVO);

            this.storeData(createdVO);
        } catch (error) {
            this.snotify.error(this.label('crud.create.errors.create_failure') + ": " + error);
            this.creating_vo = false;
            return;
        }

        this.snotify.success(this.label('crud.create.success'));
        this.$router.push(this.callback_route);
        this.creating_vo = false;

        await this.callCallbackFunctionCreate();

        if (CRUDComponentManager.getInstance().cruds_by_api_type_id[this.crud.api_type_id].reset_newvo_after_each_creation) {
            this.prepareNewVO();
        }
    }


    /**
     * Méthode qui prend tous les champs ManyToMany de la table et met à jour les tables intermédiaires si besoin
     * @param vo
     */
    private async updateOneToMany(datatable_vo: IDistantVOBase, datatable: Datatable<IDistantVOBase>, db_vo: IDistantVOBase) {
        try {

            for (let i in datatable.fields) {

                if (datatable.fields[i].type != ReferenceDatatableField.ONE_TO_MANY_FIELD_TYPE) {
                    continue;
                }

                let field: OneToManyReferenceDatatableField<any> = datatable.fields[i] as OneToManyReferenceDatatableField<any>;
                let actual_links: IDistantVOBase[] = await ModuleDAO.getInstance().getVosByRefFieldIds(field.targetModuleTable.vo_type, field.destField.field_id, [db_vo.id]);
                let new_links_target_ids: number[] = datatable_vo[field.module_table_field_id];

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

                        if ((!this.getStoredDatas[field.targetModuleTable.vo_type]) || (!this.getStoredDatas[field.targetModuleTable.vo_type][new_link_target_id])) {
                            continue;
                        }
                        this.getStoredDatas[field.targetModuleTable.vo_type][new_link_target_id][field.destField.field_id] = db_vo.id;
                        need_update_links.push(this.getStoredDatas[field.targetModuleTable.vo_type][new_link_target_id]);
                    }
                }

                if (need_update_links.length > 0) {

                    await ModuleDAO.getInstance().insertOrUpdateVOs(need_update_links);
                    for (let linki in need_update_links) {

                        this.updateData(need_update_links[linki]);
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    }


    /**
     * Méthode qui prend tous les champs ManyToMany de la table et met à jour les tables intermédiaires si besoin
     * @param vo
     */
    private async updateManyToMany(datatable_vo: IDistantVOBase, datatable: Datatable<IDistantVOBase>, db_vo: IDistantVOBase) {
        try {

            for (let i in datatable.fields) {

                if (datatable.fields[i].type != ReferenceDatatableField.MANY_TO_MANY_FIELD_TYPE) {
                    continue;
                }

                let field: ManyToManyReferenceDatatableField<any, any> = datatable.fields[i] as ManyToManyReferenceDatatableField<any, any>;
                let interSrcRefField = field.interModuleTable.getRefFieldFromTargetVoType(db_vo._type);
                let actual_links: IDistantVOBase[] = await ModuleDAO.getInstance().getVosByRefFieldIds(field.interModuleTable.vo_type, interSrcRefField.field_id, [db_vo.id]);
                let interDestRefField = field.interModuleTable.getRefFieldFromTargetVoType(field.targetModuleTable.vo_type);
                let new_links_target_ids: number[] = datatable_vo[field.module_table_field_id];

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
                            this.snotify.error(this.label('crud.create.errors.many_to_many_failure'));
                            continue;
                        }
                        need_add_links[linki].id = parseInt(insertOrDeleteQueryResult.id.toString());
                        this.storeData(need_add_links[linki]);
                    }
                }
                if (need_delete_links.length > 0) {
                    await ModuleDAO.getInstance().deleteVOs(need_delete_links);
                    for (let linki in need_delete_links) {
                        this.removeData({
                            API_TYPE_ID: field.interModuleTable.vo_type,
                            id: need_delete_links[linki].id
                        });
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    }


    private async updateVO() {
        this.snotify.info(this.label('crud.update.starting'));
        this.updating_vo = true;

        if ((!this.selectedVO) || (!this.editableVO) || (this.editableVO.id !== this.selectedVO.id) || (this.editableVO._type !== this.selectedVO._type)) {
            this.snotify.error(this.label('crud.update.errors.selection_failure'));
            this.updating_vo = false;
            return;
        }

        try {

            // On passe la traduction depuis IHM sur les champs
            let apiokVo = this.IHMToData(this.editableVO, this.crud.updateDatatable, true);

            // On utilise le trigger si il est présent sur le crud
            if (this.crud.preUpdate) {
                let errorMsg = await this.crud.preUpdate(apiokVo, this.editableVO);
                if (errorMsg) {
                    this.snotify.error(this.label(errorMsg));
                    this.updating_vo = false;
                    return;
                }
            }

            let res = await ModuleDAO.getInstance().insertOrUpdateVO(apiokVo);
            let id = res.id ? parseInt(res.id.toString()) : null;

            if ((!res) || (!id) || (id != this.selectedVO.id)) {
                this.snotify.error(this.label('crud.update.errors.update_failure'));
                this.updating_vo = false;
                return;
            }

            let updatedVO = await ModuleDAO.getInstance().getVoById<any>(this.selectedVO._type, this.selectedVO.id);
            if ((!updatedVO) || (updatedVO.id !== this.selectedVO.id) || (updatedVO._type !== this.selectedVO._type)) {
                this.snotify.error(this.label('crud.update.errors.update_failure'));
                this.updating_vo = false;
                return;
            }

            // On doit mettre à jour les OneToMany, et ManyToMany dans les tables correspondantes
            await this.updateManyToMany(this.editableVO, this.crud.createDatatable, updatedVO);
            await this.updateOneToMany(this.editableVO, this.crud.createDatatable, updatedVO);

            this.updateData(updatedVO);
        } catch (error) {
            this.snotify.error(this.label('crud.update.errors.update_failure') + ": " + error);
            this.updating_vo = false;
            return;
        }

        this.snotify.success(this.label('crud.update.success'));
        this.$router.push(this.callback_route);
        this.updating_vo = false;

        await this.callCallbackFunctionUpdate();
    }

    private async deleteVO() {
        this.snotify.info(this.label('crud.delete.starting'));
        this.deleting_vo = true;

        if (!this.selectedVO) {
            this.snotify.error(this.label('crud.delete.errors.selection_failure'));
            this.deleting_vo = false;
            return;
        }

        try {

            await ModuleDAO.getInstance().deleteVOs([this.selectedVO]);

            let deletedVO = await ModuleDAO.getInstance().getVoById<any>(this.selectedVO._type, this.selectedVO.id);
            if (deletedVO && deletedVO.id) {
                this.snotify.error(this.label('crud.delete.errors.delete_failure'));
                this.deleting_vo = false;
                return;
            }

            this.removeData({
                API_TYPE_ID: this.selectedVO._type,
                id: this.selectedVO.id
            });
        } catch (error) {
            this.snotify.error(this.label('crud.delete.errors.delete_failure') + ": " + error);
            this.deleting_vo = false;
            return;
        }

        this.snotify.success(this.label('crud.delete.success'));
        this.$router.push(this.callback_route);
        this.deleting_vo = false;
    }

    private changeValue(vo: IDistantVOBase, field: DatatableField<any, any>, value: any, datatable: Datatable<IDistantVOBase>) {
        vo[field.datatable_field_uid] = value;

        for (let i in datatable.fields) {
            let field_datatable: DatatableField<any, any> = datatable.fields[i];
            if (field_datatable.type == DatatableField.MANY_TO_ONE_FIELD_TYPE) {

                let manyToOneField: ManyToOneReferenceDatatableField<any> = (field_datatable as ManyToOneReferenceDatatableField<any>);
                let options = this.getStoredDatas[manyToOneField.targetModuleTable.vo_type];

                if (!!manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne) {
                    options = manyToOneField.filterOptionsForUpdateOrCreateOnManyToOne(vo, options);
                }

                if (options) {
                    field_datatable.setSelectOptionsEnabled(ObjectHandler.getInstance().arrayFromMap(options).map((elem) => elem.id));
                }
            }

        }

        if (this.crud && this.crud.isReadOnlyData) {
            this.is_only_readable = this.crud.isReadOnlyData(vo);
        } else {
            this.is_only_readable = false;
        }
    }

    private validateMultiInput(values: any[], field: DatatableField<any, any>, vo: IDistantVOBase) {
        vo[field.datatable_field_uid] = values;
    }

    private onChangeVO(vo: IDistantVOBase) {

        if (this.crud && this.crud.isReadOnlyData) {
            this.is_only_readable = this.crud.isReadOnlyData(vo);
        } else {
            this.is_only_readable = false;
        }
    }

    /**
     * Cas spécifique du FileVo sur lequel on a un champ fichier qui crée l'objet que l'on souhaite update ou create.
     * Si on est en cours d'update, il faut conserver l'ancien vo (pour maintenir les liaisons vers son id)
     *  et lui mettre en path le nouveau fichier. On garde aussi le nouveau file, pour archive de l'ancien fichier
     * @param vo
     * @param field
     * @param fileVo
     */
    private async uploadedFile(vo: IDistantVOBase, field: DatatableField<any, any>, fileVo: FileVO) {
        if ((!fileVo) || (!fileVo.id)) {
            return;
        }
        if (this.api_type_id != FileVO.API_TYPE_ID) {
            return;
        }


        if (vo && vo.id) {
            let tmp = this.editableVO[field.datatable_field_uid];
            this.editableVO[field.datatable_field_uid] = fileVo[field.datatable_field_uid];
            fileVo[field.datatable_field_uid] = tmp;

            await ModuleDAO.getInstance().insertOrUpdateVOs([this.editableVO, fileVo]);
            this.updateData(this.editableVO);
            this.updateData(fileVo);
        }

        // On ferme la modal, devenue inutile
        this.$router.push(this.callback_route);
    }

    private async reload_datas() {
        ModuleAjaxCache.getInstance().invalidateCachesFromApiTypesInvolved(this.api_types_involved);
        this.api_types_involved = [];
        await this.loaddatas();
    }

    private async callCallbackFunctionCreate(): Promise<void> {
        if (CRUDComponentManager.getInstance().callback_function_create) {
            await CRUDComponentManager.getInstance().callback_function_create(this.newVO);
        }
    }

    private async callCallbackFunctionUpdate(): Promise<void> {
        if (CRUDComponentManager.getInstance().callback_function_update) {
            await CRUDComponentManager.getInstance().callback_function_update(this.editableVO);
        }
    }

    get callback_route(): string {
        let callback: string = this.getCRUDLink(this.api_type_id);
        if (CRUDComponentManager.getInstance().getCallbackRoute(false)) {
            callback = CRUDComponentManager.getInstance().getCallbackRoute();
        }

        return callback;
    }

    get isModuleParamTable() {
        return VOsTypesManager.getInstance().moduleTables_by_voType[this.crud.readDatatable.API_TYPE_ID] ?
            VOsTypesManager.getInstance().moduleTables_by_voType[this.crud.readDatatable.API_TYPE_ID].isModuleParamTable : false;
    }

    get api_type_id(): string {
        return this.crud.readDatatable.API_TYPE_ID;
    }

    get createDatatable(): Datatable<IDistantVOBase> {
        if (this.crud && this.crud.createDatatable && this.crud.createDatatable.fields) {
            return this.crud.createDatatable;
        }

        return null;
    }
}