import * as $ from 'jquery';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
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
import ModuleVocus from '../../../../../shared/modules/Vocus/ModuleVocus';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../../shared/tools/DateHandler';
import AjaxCacheClientController from '../../../modules/AjaxCache/AjaxCacheClientController';
import { ModuleAlertAction } from '../../alert/AlertStore';
import { ModuleCRUDAction, ModuleCRUDGetter } from '../../crud/store/CRUDStore';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import DatatableComponent from '../../datatable/component/DatatableComponent';
import VueComponentBase from '../../VueComponentBase';
import CRUDComponentManager from '../CRUDComponentManager';
import "./CRUDComponent.scss";

@Component({
    template: require('./CRUDComponent.pug'),
    components: {
        Datatable: DatatableComponent
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

    @ModuleAlertAction
    private clear_alerts: () => void;
    @ModuleAlertAction
    private register_alerts: (alerts: Alert[]) => void;

    @Prop()
    private crud: CRUD<IDistantVOBase>;

    @Prop({ default: false })
    private embed: boolean;
    @Prop({ default: false })
    private modal_show_update: boolean;
    @Prop({ default: false })
    private modal_show_create: boolean;
    @Prop({ default: false })
    private modal_show_delete: boolean;

    @Prop()
    private modal_vo_id: number;
    @Prop({ default: null })
    private vo_init: IDistantVOBase;

    @Prop({ default: null })
    private read_query: any;

    @Prop({ default: null })
    private perpage: number;

    @Prop({ default: true })
    private sort_id_descending: boolean;

    @Prop({ default: true })
    private display_filters: boolean;

    @Prop({ default: null })
    private embed_filter: { [field_id: string]: any };

    @Prop({ default: null })
    private classname: string;

    @Prop({ default: true })
    private show_insert_or_update_target: boolean;

    @Prop({ default: false })
    private bootstrap_3_modal_fallback: boolean;

    private editableVO: IDistantVOBase = null;
    private newVO: IDistantVOBase = null;

    private api_types_involved: string[] = [];

    private can_access_vocus: boolean = false;
    private can_delete_all: boolean = false;

    private creating_vo: boolean = false;
    private updating_vo: boolean = false;
    private deleting_vo: boolean = false;
    private is_only_readable: boolean = false;

    private crud_createDatatable_key: number = 0;
    private crud_updateDatatable_key: number = 0;

    // get updateDatatable_select_options_enabled_by_datatable_field_uid(): { [datatable_field_uid: string]: number[] } {
    //     let res: { [datatable_field_uid: string]: number[] } = {};

    //     for (let i in this.crud.updateDatatable.fields) {
    //         let field = this.crud.updateDatatable.fields[i];
    //         res[field.datatable_field_uid] = field.select_options_enabled;
    //     }

    //     return res;
    // }

    // get createDatatable_select_options_enabled_by_datatable_field_uid(): { [datatable_field_uid: string]: number[] } {
    //     let res: { [datatable_field_uid: string]: number[] } = {};

    //     for (let i in this.crud.createDatatable.fields) {
    //         let field = this.crud.createDatatable.fields[i];
    //         res[field.datatable_field_uid] = field.select_options_enabled;
    //     }

    //     return res;
    // }

    public async mounted() {
        if (this.read_query) {
            this.$router.replace({ query: this.read_query });
        }
        await this.reload_datas();
        await this.handle_modal_show_hide();
    }

    @Watch("vo_init")
    private async on_change_vo_init() {
        await this.prepareNewVO();
    }
    // @Watch("embed_filter")
    // private on_change_filter() {
    //     console.log('CRUDComponent');
    //     console.dir(this.embed_filter);
    // }
    @Watch("$route")
    @Watch("modal_show_create")
    @Watch("modal_show_update")
    @Watch("modal_show_delete")
    private async handle_modal_show_hide() {
        this.crud.createDatatable.refresh();
        this.crud_createDatatable_key = this.crud.createDatatable.key;

        if (this.crud.updateDatatable != this.crud.createDatatable) {
            this.crud.updateDatatable.refresh();
            this.crud_updateDatatable_key = this.crud.updateDatatable.key;
        } else {
            if (this.crud_updateDatatable_key != this.crud_createDatatable_key) {
                this.crud_updateDatatable_key = this.crud_createDatatable_key;
            }
        }


        this.clear_alerts();

        if (!this.embed) {
            if (this.read_query) {
                this.$router.replace({ query: this.read_query });
            }
        }

        let embed_append: string = '';
        if (this.embed) {
            embed_append = '_' + this.crud.readDatatable.API_TYPE_ID;
        }

        let modal_type: string = null;

        if (!this.modal_show_create) {
            $('#createData' + embed_append).modal('hide');
        }
        if (!this.modal_show_update) {
            $('#updateData' + embed_append).modal('hide');
        }
        if (!this.modal_show_delete) {
            $('#deleteData' + embed_append).modal('hide');
        }

        let vo: IDistantVOBase = null;

        if (!this.embed) {
            if (this.crud && this.crud.updateDatatable && this.crud.updateDatatable.API_TYPE_ID && this.getStoredDatas && this.getStoredDatas[this.crud.updateDatatable.API_TYPE_ID] && this.getStoredDatas[this.crud.updateDatatable.API_TYPE_ID][this.modal_vo_id]) {
                vo = this.getStoredDatas[this.crud.updateDatatable.API_TYPE_ID][this.modal_vo_id];
            }

            $("#updateData,#createData,#deleteData").on("hidden.bs.modal", () => {
                this.$router.push(this.callback_route);
            });
        } else {
            vo = this.getSelectedVOs[0];
            $('#createData' + embed_append).on("hidden.bs.modal", () => {
                this.hideCrudModal(this.crud.readDatatable.API_TYPE_ID, 'create');
            });
            $('#updateData' + embed_append).on("hidden.bs.modal", () => {
                this.hideCrudModal(this.crud.readDatatable.API_TYPE_ID, 'update');
            });
            $('#deleteData' + embed_append).on("hidden.bs.modal", () => {
                this.hideCrudModal(this.crud.readDatatable.API_TYPE_ID, 'delete');
            });
        }

        if (this.modal_show_create) {
            modal_type = 'create';
        }
        if (this.modal_show_update) {
            modal_type = 'update';
        }
        if (this.modal_show_delete) {
            modal_type = 'delete';
        }

        if (this.crud && this.crud.callback_handle_modal_show_hide) {
            await this.crud.callback_handle_modal_show_hide(vo, modal_type);
        }

        if (this.modal_show_create) {
            $('#createData' + embed_append).modal('show');
            modal_type = 'create';
            return;
        }
        if (this.modal_show_update) {
            this.setSelectedVOs([vo]);
            $('#updateData' + embed_append).modal('show');
            modal_type = 'update';
            return;
        }
        if (this.modal_show_delete) {
            this.setSelectedVOs([vo]);
            $('#deleteData' + embed_append).modal('show');
            modal_type = 'delete';
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

        this.can_access_vocus = await ModuleAccessPolicy.getInstance().testAccess(ModuleVocus.POLICY_BO_ACCESS);
        this.can_delete_all = await ModuleAccessPolicy.getInstance().testAccess(this.crud.delete_all_access_right);

        await Promise.all(this.loadDatasFromDatatable(this.crud.readDatatable));
        this.nextLoadingStep();
        await Promise.all(this.loadDatasFromDatatable(this.crud.createDatatable));
        this.nextLoadingStep();
        await Promise.all(this.loadDatasFromDatatable(this.crud.updateDatatable));
        this.nextLoadingStep();

        await this.prepareNewVO();
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
            (load_from_datatable_field.type == DatatableField.MANY_TO_MANY_FIELD_TYPE) ||
            (load_from_datatable_field.type == DatatableField.REF_RANGES_FIELD_TYPE)) {
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

    private showCrudModal(vo_type: string, action: string) {
        this.$emit('show-crud-modal', vo_type, action);
    }

    private hideCrudModal(vo_type: string, action: string) {
        this.$emit('hide-crud-modal', vo_type, action);
    }

    private async prepareNewVO() {

        let obj = {
            _type: this.crud.readDatatable.API_TYPE_ID,
            id: null
        };

        // Si on a un VO à init, on le fait
        if (CRUDComponentManager.getInstance().getIDistantVOInit(false)) {
            obj = CRUDComponentManager.getInstance().getIDistantVOInit();
        }
        // en mode "embed" on n'est pas passé par le CRUDComponentManager donc on init le VO autrement
        if ((this.embed) && (!!this.vo_init)) {
            obj = this.vo_init;
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
        this.newVO = this.dataToIHM(obj, this.crud.createDatatable, false);

        if (!!this.crud.hook_prepare_new_vo_for_creation) {
            await this.crud.hook_prepare_new_vo_for_creation(this.newVO);
        }

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

    private async createVO() {

        let self = this;
        self.snotify.async(self.label('crud.create.starting'), () =>
            new Promise(async (resolve, reject) => {


                self.creating_vo = true;
                let createdVO = null;

                if ((!self.newVO) || (self.newVO._type !== self.crud.readDatatable.API_TYPE_ID)) {
                    self.creating_vo = false;
                    reject({
                        body: self.label('crud.create.errors.newvo_failure'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                    return;
                }

                if (!!self.newVO.id) {
                    self.newVO.id = null;
                }

                try {

                    if (!self.checkForm(self.newVO, self.crud.createDatatable)) {
                        self.creating_vo = false;
                        reject({
                            body: self.label('crud.check_form.field_required'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        return;
                    }

                    // On passe la traduction depuis IHM sur les champs
                    let apiokVo = self.IHMToData(self.newVO, self.crud.createDatatable, false);

                    // On utilise le trigger si il est présent sur le crud
                    if (self.crud.preCreate) {
                        let errorMsg = await self.crud.preCreate(apiokVo, self.newVO);
                        //comme il a eut une erreur on abandonne la création
                        if (errorMsg) {
                            self.creating_vo = false;
                            reject({
                                body: self.label(errorMsg),
                                config: {
                                    timeout: 10000,
                                    showProgressBar: true,
                                    closeOnClick: false,
                                    pauseOnHover: true,
                                },
                            });
                            return;
                        }
                    }

                    let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(apiokVo);
                    if ((!res) || (!res.id)) {
                        self.creating_vo = false;
                        reject({
                            body: self.label('crud.create.errors.create_failure'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        return;
                    }

                    let id = res.id ? res.id : null;
                    self.newVO.id = id;

                    createdVO = await ModuleDAO.getInstance().getVoById<any>(self.crud.readDatatable.API_TYPE_ID, id);
                    if ((!createdVO) || (createdVO.id !== id) || (createdVO._type !== self.crud.readDatatable.API_TYPE_ID)) {
                        self.creating_vo = false;
                        reject({
                            body: self.label('crud.create.errors.create_failure'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        return;
                    }

                    // On doit mettre à jour les OneToMany, et ManyToMany dans les tables correspondantes
                    await self.updateManyToMany(self.newVO, self.crud.createDatatable, createdVO);
                    await self.updateOneToMany(self.newVO, self.crud.createDatatable, createdVO);

                    self.storeData(createdVO);

                    if (self.crud.postCreate) {
                        await self.crud.postCreate(createdVO);
                    }
                } catch (error) {
                    ConsoleHandler.getInstance().error(error);
                    self.creating_vo = false;
                    reject({
                        body: self.label('crud.create.errors.create_failure') + ": " + error,
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                    return;
                }

                self.creating_vo = false;

                if (self.embed) {
                    self.$emit(self.newVO._type + '_create', createdVO);
                    if (self.crud.reset_newvo_after_each_creation) {
                        await self.prepareNewVO();
                    }
                    self.hideCrudModal(self.newVO._type, 'create');
                } else {
                    self.$router.push(self.callback_route);
                    await self.callCallbackFunctionCreate();
                    if (CRUDComponentManager.getInstance().cruds_by_api_type_id[self.crud.api_type_id].reset_newvo_after_each_creation) {
                        await self.prepareNewVO();
                    }
                }

                self.crud.createDatatable.refresh();
                self.crud_createDatatable_key = self.crud.createDatatable.key;

                resolve({
                    body: self.label('crud.create.success'),
                    config: {
                        timeout: 10000,
                        showProgressBar: true,
                        closeOnClick: false,
                        pauseOnHover: true,
                    },
                });
            })
        );
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
            ConsoleHandler.getInstance().error(error);
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
                let interSrcRefField = field.interSrcRefFieldId ? field.interModuleTable.getFieldFromId(field.interSrcRefFieldId) : field.interModuleTable.getRefFieldFromTargetVoType(db_vo._type);
                let actual_links: IDistantVOBase[] = await ModuleDAO.getInstance().getVosByRefFieldIds(field.interModuleTable.vo_type, interSrcRefField.field_id, [db_vo.id]);
                let interDestRefField = field.interTargetRefFieldId ? field.interModuleTable.getFieldFromId(field.interTargetRefFieldId) : field.interModuleTable.getRefFieldFromTargetVoType(field.targetModuleTable.vo_type);
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
                        need_add_links[linki].id = insertOrDeleteQueryResult.id;
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
            ConsoleHandler.getInstance().error(error);
        }
    }

    private checkForm(vo: IDistantVOBase, datatable: Datatable<IDistantVOBase>): boolean {
        this.clear_alerts();

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
            this.register_alerts(alerts);
            return false;
        }

        return true;
    }

    private async updateVO() {
        let self = this;
        self.snotify.async(self.label('crud.update.starting'), () =>
            new Promise(async (resolve, reject) => {

                self.updating_vo = true;
                let updatedVO = null;

                if ((!self.selectedVO) || (!self.editableVO) || (self.editableVO.id !== self.selectedVO.id) || (self.editableVO._type !== self.selectedVO._type)) {
                    self.updating_vo = false;
                    reject({
                        body: self.label('crud.update.errors.selection_failure'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                    return;
                }

                try {

                    if (!self.checkForm(self.editableVO, self.crud.updateDatatable)) {
                        self.updating_vo = false;
                        reject({
                            body: self.label('crud.check_form.field_required'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        return;
                    }

                    // On passe la traduction depuis IHM sur les champs
                    let apiokVo = self.IHMToData(self.editableVO, self.crud.updateDatatable, true);

                    // On utilise le trigger si il est présent sur le crud
                    if (self.crud.preUpdate) {
                        let errorMsg = await self.crud.preUpdate(apiokVo, self.editableVO);
                        if (errorMsg) {
                            self.updating_vo = false;
                            reject({
                                body: self.label(errorMsg),
                                config: {
                                    timeout: 10000,
                                    showProgressBar: true,
                                    closeOnClick: false,
                                    pauseOnHover: true,
                                },
                            });
                            return;
                        }
                    }

                    let res = await ModuleDAO.getInstance().insertOrUpdateVO(apiokVo);
                    let id = (res && res.id) ? parseInt(res.id.toString()) : null;

                    if ((!res) || (!id) || (id != self.selectedVO.id)) {
                        self.updating_vo = false;
                        reject({
                            body: self.label('crud.update.errors.update_failure'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        return;
                    }

                    updatedVO = await ModuleDAO.getInstance().getVoById<any>(self.selectedVO._type, self.selectedVO.id);
                    if ((!updatedVO) || (updatedVO.id !== self.selectedVO.id) || (updatedVO._type !== self.selectedVO._type)) {
                        self.updating_vo = false;
                        reject({
                            body: self.label('crud.update.errors.update_failure'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        return;
                    }

                    // On doit mettre à jour les OneToMany, et ManyToMany dans les tables correspondantes
                    await self.updateManyToMany(self.editableVO, self.crud.createDatatable, updatedVO);
                    await self.updateOneToMany(self.editableVO, self.crud.createDatatable, updatedVO);

                    self.updateData(updatedVO);

                    if (self.crud.postUpdate) {
                        await self.crud.postUpdate(updatedVO);
                    }
                } catch (error) {
                    ConsoleHandler.getInstance().error(error);
                    self.updating_vo = false;
                    reject({
                        body: self.label('crud.update.errors.update_failure') + ": " + error,
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                    return;
                }

                if (!self.embed) {
                    self.$router.push(self.callback_route);
                }
                self.updating_vo = false;

                if (self.embed) {
                    self.$emit(self.newVO._type + '_update', updatedVO);
                    self.hideCrudModal(self.newVO._type, 'update');
                } else {
                    await self.callCallbackFunctionUpdate();
                }

                resolve({
                    body: self.label('crud.update.success'),
                    config: {
                        timeout: 10000,
                        showProgressBar: true,
                        closeOnClick: false,
                        pauseOnHover: true,
                    },
                });
            })
        );
    }

    private async deleteVO() {
        let self = this;
        self.snotify.async(self.label('crud.delete.starting'), () =>
            new Promise(async (resolve, reject) => {

                this.deleting_vo = true;
                let deletedVO = null;

                if (!this.selectedVO) {
                    this.deleting_vo = false;
                    reject({
                        body: self.label('crud.delete.errors.selection_failure'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                    return;
                }

                try {

                    await ModuleDAO.getInstance().deleteVOs([this.selectedVO]);

                    // On invalide le cache pour éviter de récupérer le même vo depuis le cache
                    AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved([this.selectedVO._type]);

                    deletedVO = await ModuleDAO.getInstance().getVoById<any>(this.selectedVO._type, this.selectedVO.id);
                    if (deletedVO && deletedVO.id) {
                        this.deleting_vo = false;
                        reject({
                            body: self.label('crud.delete.errors.delete_failure'),
                            config: {
                                timeout: 10000,
                                showProgressBar: true,
                                closeOnClick: false,
                                pauseOnHover: true,
                            },
                        });
                        return;
                    }

                    this.removeData({
                        API_TYPE_ID: this.selectedVO._type,
                        id: this.selectedVO.id
                    });
                    if (this.crud.postDelete) {
                        await this.crud.postDelete(this.selectedVO);
                    }
                } catch (error) {
                    ConsoleHandler.getInstance().error(error);
                    this.deleting_vo = false;
                    reject({
                        body: self.label('crud.delete.errors.delete_failure') + ": " + error,
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                    return;
                }

                if (this.embed) {
                    this.$emit(this.newVO._type + '_delete', deletedVO);
                    this.hideCrudModal(this.newVO._type, 'delete');
                } else {
                    this.$router.push(this.callback_route);
                }
                this.deleting_vo = false;
                resolve({
                    body: self.label('crud.delete.success'),
                    config: {
                        timeout: 10000,
                        showProgressBar: true,
                        closeOnClick: false,
                        pauseOnHover: true,
                    },
                });
            })
        );
    }

    private onChangeVO(vo: IDistantVOBase) {
        if (this.crud_createDatatable_key != this.crud.createDatatable.key) {
            this.crud_createDatatable_key = this.crud.createDatatable.key;
        }
        if (this.crud_updateDatatable_key != this.crud.updateDatatable.key) {
            this.crud_updateDatatable_key = this.crud.updateDatatable.key;
        }

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
        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved(this.api_types_involved);
        this.api_types_involved = [];
        await this.loaddatas();
    }

    private async callCallbackFunctionCreate(): Promise<void> {
        if (this.crud && this.crud.callback_function_create) {
            await this.crud.callback_function_create(this.newVO);
        }
    }

    private async callCallbackFunctionUpdate(): Promise<void> {
        if (this.crud && this.crud.callback_function_update) {
            await this.crud.callback_function_update(this.editableVO);
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

    get has_createDatatable(): boolean {
        if (this.crud && this.crud.createDatatable && this.crud.createDatatable.fields) {
            return true;
        }

        return false;
    }

    private async delete_all() {
        let self = this;

        // On demande confirmation avant toute chose.
        // si on valide, on lance la suppression
        self.snotify.confirm(self.label('crud.actions.delete_all.confirmation.body'), self.label('crud.actions.delete_all.confirmation.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: self.t('YES'),
                    action: async (toast) => {
                        self.$snotify.remove(toast.id);
                        self.snotify.info(self.label('crud.actions.delete_all.start'));

                        await ModuleDAO.getInstance().truncate(self.api_type_id);
                        await self.reload_datas();
                    },
                    bold: false
                },
                {
                    text: self.t('NO'),
                    action: (toast) => {
                        self.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }
}