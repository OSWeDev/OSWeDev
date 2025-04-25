import { cloneDeep, isEqual } from 'lodash';
import { Component, Prop, Watch } from 'vue-property-decorator';
import Throttle from '../../../../../../shared/annotations/Throttle';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import Alert from '../../../../../../shared/modules/Alert/vos/Alert';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../../../../shared/modules/DAO/ModuleTableController';
import CRUD from '../../../../../../shared/modules/DAO/vos/CRUD';
import CRUDFieldRemoverConfVO from '../../../../../../shared/modules/DAO/vos/CRUDFieldRemoverConfVO';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ModuleTableVO from '../../../../../../shared/modules/DAO/vos/ModuleTableVO';
import EventifyEventListenerConfVO from '../../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../../../shared/tools/ObjectHandler';
import { ModuleAlertAction } from '../../../alert/AlertStore';
import { ModuleDAOAction } from '../../../dao/store/DaoStore';
import DatatableComponent from '../../../datatable/component/DatatableComponent';
import VueComponentBase from '../../../VueComponentBase';
import CRUDComponentManager from '../../CRUDComponentManager';
import CRUDFormServices from '../CRUDFormServices';
import "./CRUDUpdateFormComponent.scss";

@Component({
    template: require('./CRUDUpdateFormComponent.pug'),
    components: {
        Datatable: DatatableComponent
    },
})
export default class CRUDUpdateFormComponent extends VueComponentBase {

    @ModuleDAOAction
    private storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    private updateData: (vo: IDistantVOBase) => void;
    @ModuleDAOAction
    private removeData: (infos: { API_TYPE_ID: string, id: number }) => void;
    @ModuleDAOAction
    private storeData: (vo: IDistantVOBase) => void;

    @ModuleAlertAction
    private clear_alerts: () => void;
    @ModuleAlertAction
    private register_alerts: (alerts: Alert[]) => void;

    @Prop({ default: true })
    private close_on_submit: boolean;

    @Prop()
    private selected_vo: IDistantVOBase;

    @Prop({ default: true })
    private show_insert_or_update_target: boolean;

    @Prop({ default: false })
    private show_placeholder: boolean;

    @Prop({ default: false })
    private show_delete_button: boolean;

    @Prop({ default: false })
    private inline_form_in_crud: boolean;

    private editableVO: IDistantVOBase = null;
    private editableVO_initial: IDistantVOBase = null;

    private api_types_involved: string[] = [];

    private updating_vo: boolean = false;
    private is_only_readable: boolean = false;

    private crud_updateDatatable_key: number = 0;
    private dao_store_loaded: boolean = false;
    private crud: CRUD<any> = null;

    private crud_field_remover_conf_edit: boolean = false;
    private crud_field_remover_conf: CRUDFieldRemoverConfVO = null;
    private POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS: boolean = false;
    private snotify_cancel = null;

    get api_type_id(): string {
        if (this.selected_vo) {
            return this.selected_vo._type;
        }

        if (!this.crud) {
            return null;
        }

        return this.crud.readDatatable.API_TYPE_ID;
    }

    get CRUDTitle(): string {
        if (!this.crud) {
            return null;
        }

        return this.label('crud.read.title', {
            datatable_title: this.datatable_title
        });
    }

    get datatable_title(): string {
        if (!this.crud) {
            return null;
        }

        return this.t(ModuleTableController.module_tables_by_vo_type[this.crud.readDatatable.API_TYPE_ID]?.label?.code_text);
    }

    get input_label(): string {
        if (this.inline_form_in_crud) {
            return this.label('crud.update.modal.save_continue');
        }

        return this.label('crud.update.modal.save');
    }

    @Watch("api_type_id", { immediate: true })
    private async onchange_api_type_id() {
        if ((!this.selected_vo) || (!this.selected_vo._type)) {
            if (this.crud) {
                this.crud = null;
            }
            return;
        }

        if (!CRUDComponentManager.getInstance().cruds_by_api_type_id[this.selected_vo._type]) {
            await CRUDComponentManager.getInstance().registerCRUD(
                this.api_type_id,
                null,
                null,
                null
            );
        }

        if ((!this.crud) || (this.crud.api_type_id != this.api_type_id)) {
            this.crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[this.api_type_id];

            try {
                this.crud_field_remover_conf = await query(CRUDFieldRemoverConfVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<CRUDFieldRemoverConfVO>().module_table_vo_type, this.api_type_id)
                    .filter_is_true(field_names<CRUDFieldRemoverConfVO>().is_update)
                    .select_vo<CRUDFieldRemoverConfVO>();
            } catch (error) {
                if (error.message == 'Multiple results on select_vo is not allowed : ' + this.api_type_id) {
                    /**
                     * On gère les doublons au cas où on ait un problème de synchronisation en supprimant les plus récents
                     */
                    const doublons = await query(CRUDFieldRemoverConfVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<CRUDFieldRemoverConfVO>().module_table_vo_type, this.api_type_id)
                        .filter_is_true(field_names<CRUDFieldRemoverConfVO>().is_update)
                        .set_sort(new SortByVO(CRUDFieldRemoverConfVO.API_TYPE_ID, field_names<CRUDFieldRemoverConfVO>().id, true))
                        .select_vos<CRUDFieldRemoverConfVO>();
                    doublons.shift();
                    await ModuleDAO.instance.deleteVOs(doublons);
                }
            }

            if (this.crud_field_remover_conf && this.crud_field_remover_conf.module_table_field_ids && this.crud_field_remover_conf.module_table_field_ids.length) {
                this.remove_fields(this.crud_field_remover_conf.module_table_field_ids);
            }
        }
    }

    // Handle Loading of stored data

    @Watch("crud", { immediate: true })
    private async updatedCRUD() {

        if (this.crud) {
            await this.reload_datas();
            await this.updateSelected_vo();
        }
    }

    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 100,
    })
    private async updateSelected_vo() {
        if (!this.selected_vo) {
            this.editableVO = null;
            this.editableVO_initial = null;
            this.snotify_cancel = null;
            return;
        }
        if (!this.crud) {
            return null;
        }

        const self = this;
        // const waiter = async () => {
        //     if (!self.dao_store_loaded) {
        //         setTimeout(waiter, 300);
        //     } else {
        // On passe la traduction en IHM sur les champs
        self.editableVO = await CRUDFormServices.dataToIHM(self.selected_vo, self.crud.updateDatatable, true);
        self.editableVO_initial = cloneDeep(self.editableVO);
        self.onChangeVO(self.editableVO);
        this.snotify_cancel = null;
        //     }
        // };

        // await waiter();
    }

    @Watch("selected_vo", { immediate: true })
    private async on_change_selected_vo() {
        await this.updateSelected_vo();
    }

    public update_key() {
        if (this.crud && (this.crud_updateDatatable_key != this.crud.updateDatatable.key)) {
            this.crud_updateDatatable_key = this.crud.updateDatatable.key;
        }
    }

    public cancel() {
        if (this.vo_is_equal_for_prevent()) {
            this.$emit('cancel');
            return;
        }

        if (this.snotify_cancel) {
            return;
        }

        this.snotify_cancel = this.snotify.confirm(this.label('cancel.update.confirmation.body'), this.label('cancel.update.confirmation.title'), {
            timeout: 0,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            titleMaxLength: 100,
            buttons: [
                {
                    text: this.t('YES'),
                    action: (toast) => {
                        this.$snotify.remove(toast.id);
                        this.snotify_cancel = null;

                        // On met le VO aux valeurs initiales
                        this.editableVO = cloneDeep(this.editableVO_initial);

                        this.$emit('cancel');
                    },
                },
                {
                    text: this.t('NO'),
                    action: (toast) => {
                        this.$snotify.remove(toast.id);
                        this.snotify_cancel = null;
                    }
                }
            ]
        });
    }

    public vo_is_equal_for_prevent(): boolean {
        const moduletable: ModuleTableVO = ModuleTableController.module_tables_by_vo_type[this.api_type_id];

        if (!moduletable?.prevent_close_modal) {
            return true;
        }

        return isEqual(this.editableVO, this.editableVO_initial);
    }

    private async delete_removed_crud_field_id(module_table_field_id: string) {
        if ((!this.crud_field_remover_conf) || (!this.crud_field_remover_conf.module_table_field_ids) || (this.crud_field_remover_conf.module_table_field_ids.indexOf(module_table_field_id) < 0)) {
            return;
        }

        this.crud_field_remover_conf.module_table_field_ids = this.crud_field_remover_conf.module_table_field_ids.filter((id) => id != module_table_field_id);

        const self = this;
        self.snotify.async(self.label('crud_update_form_body_delete_removed_crud_field_id.start'), () =>
            new Promise(async (resolve, reject) => {

                try {
                    const res = await ModuleDAO.instance.insertOrUpdateVO(self.crud_field_remover_conf);
                    if (!res.id) {
                        throw new Error('Failed delete_removed_crud_field_id');
                    }
                    if (!self.crud_field_remover_conf.id) {
                        self.crud_field_remover_conf.id = res.id;
                    }

                    resolve({
                        body: self.label('crud_update_form_body_delete_removed_crud_field_id.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } catch (error) {
                    ConsoleHandler.error(error);
                    reject({
                        body: self.label('crud_update_form_body_delete_removed_crud_field_id.failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }
            })
        );
    }

    private async add_removed_crud_field_id(module_table_field_id: string) {
        if (!this.crud) {
            return null;
        }

        let crud_field_remover_conf = this.crud_field_remover_conf;

        if (!crud_field_remover_conf) {
            crud_field_remover_conf = new CRUDFieldRemoverConfVO();
            crud_field_remover_conf.module_table_field_ids = [];
            crud_field_remover_conf.module_table_vo_type = this.crud.api_type_id;
            crud_field_remover_conf.is_update = true;
        }

        if (!crud_field_remover_conf.module_table_field_ids) {
            crud_field_remover_conf.module_table_field_ids = [];
        }

        crud_field_remover_conf.module_table_field_ids.push(module_table_field_id);
        const self = this;
        self.crud_field_remover_conf = crud_field_remover_conf;

        self.snotify.async(self.label('crud_update_form_body_add_removed_crud_field_id.start'), () =>
            new Promise(async (resolve, reject) => {

                try {
                    const res = await ModuleDAO.instance.insertOrUpdateVO(self.crud_field_remover_conf);
                    if (!res.id) {
                        throw new Error('Failed add_removed_crud_field_id');
                    }
                    if (!self.crud_field_remover_conf.id) {
                        self.crud_field_remover_conf.id = res.id;
                    }

                    self.remove_fields([module_table_field_id]);

                    resolve({
                        body: self.label('crud_update_form_body_add_removed_crud_field_id.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } catch (error) {
                    ConsoleHandler.error(error);
                    reject({
                        body: self.label('crud_update_form_body_add_removed_crud_field_id.failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }
            })
        );
    }

    private async mounted() {
        this.POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS = await ModuleAccessPolicy.getInstance().testAccess(ModuleDAO.POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS);
    }

    /**
     * Si on a toujours un datatable par défaut, donc celui du read, on doit d'abord le cloner pour le modifier uniquement dans notre cas
     * @param fields les champs à supprimer du CRUD
     */
    private remove_fields(fields) {
        if (!this.crud) {
            return null;
        }

        if (this.crud.updateDatatable == this.crud.readDatatable) {
            this.crud.updateDatatable = CRUD.copy_datatable(this.crud.readDatatable);
        }
        this.crud.updateDatatable.removeFields(this.crud_field_remover_conf.module_table_field_ids);
    }

    private async updateVO() {

        if (!this.crud) {
            return null;
        }

        const self = this;
        self.snotify.async(self.label('crud.update.starting'), () =>
            new Promise(async (resolve, reject) => {

                self.updating_vo = true;
                let updatedVO = null;

                if ((!self.selected_vo) || (!self.editableVO) || (self.editableVO.id !== self.selected_vo.id) || (self.editableVO._type !== self.selected_vo._type)) {
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
                    if (!self.crud) {
                        return null;
                    }

                    if (!CRUDFormServices.checkForm(self.editableVO, self.crud.updateDatatable, self.clear_alerts, self.register_alerts)) {
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
                    const apiokVo = CRUDFormServices.IHMToData(self.editableVO, self.crud.updateDatatable, true);

                    // On utilise le trigger si il est présent sur le crud
                    if (self.crud.preUpdate) {
                        const errorMsg = await self.crud.preUpdate(apiokVo, self.editableVO);
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

                    const res = await ModuleDAO.instance.insertOrUpdateVO(apiokVo);
                    const id = (res && res.id) ? parseInt(res.id.toString()) : null;

                    if ((!res) || (!id) || (id != self.selected_vo.id)) {
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

                    updatedVO = await query(self.selected_vo._type).filter_by_id(self.selected_vo.id).select_vo();
                    if ((!updatedVO) || (updatedVO.id !== self.selected_vo.id) || (updatedVO._type !== self.selected_vo._type)) {
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
                    await CRUDFormServices.updateManyToMany(self.editableVO, self.crud.updateDatatable, updatedVO, self.removeData, self.storeData, self);
                    await CRUDFormServices.updateOneToMany(self.editableVO, self.crud.updateDatatable, updatedVO, self.updateData);

                    if (self.crud.postUpdate) {
                        await self.crud.postUpdate(self.editableVO);
                    }

                    self.updateData(updatedVO);
                } catch (error) {
                    ConsoleHandler.error(error);
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

                self.updating_vo = false;

                self.$emit(updatedVO._type + '_update', updatedVO);
                self.$emit('vo_update', updatedVO);
                await self.callCallbackFunctionUpdate();

                if (self.close_on_submit) {
                    self.editableVO_initial = cloneDeep(self.editableVO);
                    self.$emit('close');
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

    private onChangeVO(vo: IDistantVOBase) {
        if (!this.crud) {
            return null;
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
    private async uploadedFile_(vo: IDistantVOBase, field: DatatableField<any, any>, fileVo: FileVO) {
        await CRUDFormServices.uploadedFile(vo, field, fileVo, this.api_type_id, this.editableVO, this.updateData, this);
    }

    private async reload_datas() {
        this.dao_store_loaded = false;
        this.isLoading = true;

        this.api_types_involved = await CRUDFormServices.load_datas(
            this.crud,
            true,
            this.storeDatas,
            this.api_types_involved,
            null,
            true,
        );

        this.dao_store_loaded = true;
        this.isLoading = false;
    }

    private async callCallbackFunctionUpdate(): Promise<void> {
        if (this.crud && this.crud.callback_function_update) {
            await this.crud.callback_function_update(this.editableVO);
        }
    }

    private async deleteVO() {
        this.snotify.confirm(this.label('TableWidgetComponent.confirm_delete.body'), this.label('TableWidgetComponent.confirm_delete.title'), {
            timeout: 10000,
            showProgressBar: true,
            closeOnClick: false,
            pauseOnHover: true,
            buttons: [
                {
                    text: this.t('YES'),
                    action: async (toast) => {
                        this.$snotify.remove(toast.id);

                        await query(this.selected_vo._type).filter_by_id(this.selected_vo.id).delete_vos();

                        if (this.close_on_submit) {
                            this.editableVO_initial = cloneDeep(this.editableVO);
                            this.$emit('close');
                        }
                    },
                    bold: false
                },
                {
                    text: this.t('NO'),
                    action: (toast) => {
                        this.$snotify.remove(toast.id);
                    }
                }
            ]
        });
    }
}