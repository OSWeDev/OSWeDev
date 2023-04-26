import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import Alert from '../../../../../../shared/modules/Alert/vos/Alert';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import CRUD from '../../../../../../shared/modules/DAO/vos/CRUD';
import CRUDFieldRemoverConfVO from '../../../../../../shared/modules/DAO/vos/CRUDFieldRemoverConfVO';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import { VOsTypesManager } from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../../../shared/tools/PromiseTools';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import { ModuleAlertAction } from '../../../alert/AlertStore';
import { ModuleCRUDGetter } from '../../../crud/store/CRUDStore';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../dao/store/DaoStore';
import DatatableComponent from '../../../datatable/component/DatatableComponent';
import VueComponentBase from '../../../VueComponentBase';
import CRUDComponentManager from '../../CRUDComponentManager';
import CRUDFormServices from '../CRUDFormServices';
import "./CRUDCreateFormComponent.scss";

@Component({
    template: require('./CRUDCreateFormComponent.pug'),
    components: {
        Datatable: DatatableComponent,
    },
})
export default class CRUDCreateFormComponent extends VueComponentBase {


    @ModuleDAOGetter
    private getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    private storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    private updateData: (vo: IDistantVOBase) => void;
    @ModuleDAOAction
    private removeData: (infos: { API_TYPE_ID: string, id: number }) => void;
    @ModuleDAOAction
    private storeData: (vo: IDistantVOBase) => void;

    @ModuleCRUDGetter
    private getSelectedVOs: IDistantVOBase[];

    @ModuleAlertAction
    private clear_alerts: () => void;
    @ModuleAlertAction
    private register_alerts: (alerts: Alert[]) => void;

    @Prop({ default: null })
    private api_type_id: string;

    @Prop({ default: false })
    private close_on_submit: boolean;

    @Prop({ default: null })
    private vo_init: IDistantVOBase;

    @Prop({ default: true })
    private show_insert_or_update_target: boolean;

    @Prop({ default: false })
    private show_placeholder: boolean;

    private editableVO: IDistantVOBase = null;
    private newVO: IDistantVOBase = null;

    private api_types_involved: string[] = [];

    private creating_vo: boolean = false;
    private is_only_readable: boolean = false;

    private crud_createDatatable_key: number = 0;
    private crud: CRUD<any> = null;

    private crud_field_remover_conf_edit: boolean = false;
    private crud_field_remover_conf: CRUDFieldRemoverConfVO = null;
    private POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS: boolean = false;

    public async update_key(force_new_vo: boolean) {
        if (this.crud && (this.crud_createDatatable_key != this.crud.createDatatable.key)) {
            if (force_new_vo) {
                await this.prepareNewVO();
            }

            this.crud_createDatatable_key = this.crud.createDatatable.key;
        }
    }

    private async mounted() {
        this.POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS = await ModuleAccessPolicy.getInstance().testAccess(ModuleDAO.POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS);
    }

    private async delete_removed_crud_field_id(module_table_field_id: string) {
        if ((!this.crud_field_remover_conf) || (!this.crud_field_remover_conf.module_table_field_ids) || (this.crud_field_remover_conf.module_table_field_ids.indexOf(module_table_field_id) < 0)) {
            return;
        }

        this.crud_field_remover_conf.module_table_field_ids = this.crud_field_remover_conf.module_table_field_ids.filter((id) => id != module_table_field_id);

        let self = this;
        self.snotify.async(self.label('crud_create_form_body_delete_removed_crud_field_id.start'), () =>
            new Promise(async (resolve, reject) => {

                try {
                    let res = await ModuleDAO.getInstance().insertOrUpdateVO(self.crud_field_remover_conf);
                    if (!res.id) {
                        throw new Error('Failed delete_removed_crud_field_id');
                    }
                    if (!self.crud_field_remover_conf.id) {
                        self.crud_field_remover_conf.id = res.id;
                    }

                    resolve({
                        body: self.label('crud_create_form_body_delete_removed_crud_field_id.ok'),
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
                        body: self.label('crud_create_form_body_delete_removed_crud_field_id.failed'),
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
        let crud_field_remover_conf = this.crud_field_remover_conf;

        if (!crud_field_remover_conf) {
            crud_field_remover_conf = new CRUDFieldRemoverConfVO();
            crud_field_remover_conf.module_table_field_ids = [];
            crud_field_remover_conf.module_table_vo_type = this.crud.api_type_id;
            crud_field_remover_conf.is_update = false;
        }

        if (!crud_field_remover_conf.module_table_field_ids) {
            crud_field_remover_conf.module_table_field_ids = [];
        }

        crud_field_remover_conf.module_table_field_ids.push(module_table_field_id);
        this.crud_field_remover_conf = crud_field_remover_conf;

        let self = this;
        self.snotify.async(self.label('crud_create_form_body_add_removed_crud_field_id.start'), () =>
            new Promise(async (resolve, reject) => {

                try {
                    let res = await ModuleDAO.getInstance().insertOrUpdateVO(self.crud_field_remover_conf);
                    if (!res.id) {
                        throw new Error('Failed add_removed_crud_field_id');
                    }
                    if (!self.crud_field_remover_conf.id) {
                        self.crud_field_remover_conf.id = res.id;
                    }

                    self.remove_fields([module_table_field_id]);

                    resolve({
                        body: self.label('crud_create_form_body_add_removed_crud_field_id.ok'),
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
                        body: self.label('crud_create_form_body_add_removed_crud_field_id.failed'),
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

    /**
     * Si on a toujours un datatable par défaut, donc celui du read, on doit d'abord le cloner pour le modifier uniquement dans notre cas
     * @param fields les champs à supprimer du CRUD
     */
    private remove_fields(fields) {

        if (this.crud.createDatatable == this.crud.readDatatable) {
            this.crud.createDatatable = CRUD.copy_datatable(this.crud.readDatatable);
        }
        this.crud.createDatatable.removeFields(this.crud_field_remover_conf.module_table_field_ids);
    }

    @Watch("api_type_id", { immediate: true })
    private async onchange_api_type_id() {
        if (!this.api_type_id) {
            if (this.crud) {
                this.crud = null;
            }
            return;
        }

        if (!CRUDComponentManager.getInstance().cruds_by_api_type_id[this.api_type_id]) {
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
                    .filter_by_text_eq('module_table_vo_type', this.api_type_id)
                    .filter_is_false('is_update')
                    .select_vo<CRUDFieldRemoverConfVO>();
            } catch (error) {
                if (error.message == 'Multiple results on select_vo is not allowed : ' + this.api_type_id) {
                    /**
                     * On gère les doublons au cas où on ait un problème de synchronisation en supprimant les plus récents
                     */
                    let doublons = await query(CRUDFieldRemoverConfVO.API_TYPE_ID)
                        .filter_by_text_eq('module_table_vo_type', this.api_type_id)
                        .filter_is_false('is_update')
                        .set_sort(new SortByVO(CRUDFieldRemoverConfVO.API_TYPE_ID, 'id', true))
                        .select_vos<CRUDFieldRemoverConfVO>();
                    doublons.shift();
                    await ModuleDAO.getInstance().deleteVOs(doublons);
                }
            }
            if (this.crud_field_remover_conf && this.crud_field_remover_conf.module_table_field_ids && this.crud_field_remover_conf.module_table_field_ids.length) {
                this.remove_fields(this.crud_field_remover_conf.module_table_field_ids);
            }
        }
    }

    @Watch("vo_init")
    private async on_change_vo_init() {
        await this.prepareNewVO();
    }

    private async loaddatas() {

        this.isLoading = true;

        if (!this.crud) {
            this.snotify.error(this.label('crud.errors.loading'));
            this.isLoading = false;
            return;
        }

        /**
         * On ne veut pas charger par défaut (sauf ref reflective dans un champ de l'objet) tous les vos du type du vo modifié
         */
        await all_promises(CRUDFormServices.getInstance().loadDatasFromDatatable(this.crud.createDatatable, this.api_types_involved, this.storeDatas, true));

        await this.prepareNewVO();

        this.isLoading = false;
    }

    @Watch("crud", { immediate: true })
    private async updatedCRUD() {
        if (this.crud) {
            await this.reload_datas();
        }
    }

    private async prepareNewVO() {
        this.newVO = await CRUDFormServices.getInstance().getNewVO(
            this.crud, this.vo_init, this.onChangeVO
        );
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

                    if (!CRUDFormServices.getInstance().checkForm(
                        self.newVO, self.crud.createDatatable, self.clear_alerts, self.register_alerts)) {
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
                    let apiokVo = CRUDFormServices.getInstance().IHMToData(self.newVO, self.crud.createDatatable, false);

                    // On utilise le trigger si il est présent sur le crud
                    if (self.crud.preCreate) {
                        let errorMsg = await self.crud.preCreate(apiokVo, self.newVO);
                        if (errorMsg) {
                            //comme il a eut une erreur on abandonne la création
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
                    apiokVo.id = id;

                    let n_createdVO = await query(self.crud.readDatatable.API_TYPE_ID).filter_by_id(id).select_vo();
                    createdVO = n_createdVO ? n_createdVO : apiokVo;
                    /**
                     * A SUIVRE en prod suivant les projets
                     *  mais a priori si on a un res.id mais qu'on peut pas recharger le vo directement, c'est qu'on a pas le droit peut-etre
                     *  par ce qu'il est pas complet. donc on le rempli quand même
                     */

                    if (n_createdVO && ((n_createdVO.id !== id) || (n_createdVO._type !== self.crud.readDatatable.API_TYPE_ID))) {
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
                    await CRUDFormServices.getInstance().updateManyToMany(self.newVO, self.crud.createDatatable, createdVO, self.removeData, self.storeData, self);
                    await CRUDFormServices.getInstance().updateOneToMany(self.newVO, self.crud.createDatatable, createdVO, self.getStoredDatas, self.updateData);

                    if (self.crud.postCreate) {
                        await self.crud.postCreate(self.newVO);
                    }

                    self.storeData(createdVO);
                } catch (error) {
                    ConsoleHandler.error(error);
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

                self.$emit(createdVO._type + '_create', createdVO);
                await self.callCallbackFunctionCreate();
                if (self.crud.reset_newvo_after_each_creation) {
                    await self.prepareNewVO();
                }

                if (self.close_on_submit) {
                    self.$emit('close');
                } else {
                    self.crud.createDatatable.refresh();
                    self.crud_createDatatable_key = self.crud.createDatatable.key;
                }

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

    private onChangeVO(vo: IDistantVOBase) {
        if (this.crud_createDatatable_key != this.crud.createDatatable.key) {
            this.crud_createDatatable_key = this.crud.createDatatable.key;
        }

        if (this.crud && this.crud.isReadOnlyData) {
            this.is_only_readable = this.crud.isReadOnlyData(vo);
        } else {
            this.is_only_readable = false;
        }
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

    /**
     * Cas spécifique du FileVo sur lequel on a un champ fichier qui crée l'objet que l'on souhaite update ou create.
     * Si on est en cours d'update, il faut conserver l'ancien vo (pour maintenir les liaisons vers son id)
     *  et lui mettre en path le nouveau fichier. On garde aussi le nouveau file, pour archive de l'ancien fichier
     * @param vo
     * @param field
     * @param fileVo
     */
    private async uploadedFile_(vo: IDistantVOBase, field: DatatableField<any, any>, fileVo: FileVO) {
        await CRUDFormServices.getInstance().uploadedFile(vo, field, fileVo, this.api_type_id, this.editableVO, this.updateData, this);
    }

    private async cancel() {
        this.$emit('cancel');
    }

    get CRUDTitle(): string {
        if (!this.crud) {
            return null;
        }

        return this.label('crud.read.title', {
            datatable_title:
                this.t(VOsTypesManager.moduleTables_by_voType[this.crud.readDatatable.API_TYPE_ID].label.code_text)
        });
    }

    get callback_route(): string {
        let callback: string = this.getCRUDLink(this.api_type_id);
        if (CRUDComponentManager.getInstance().getCallbackRoute(false)) {
            callback = CRUDComponentManager.getInstance().getCallbackRoute();
        }

        return callback;
    }

    get isModuleParamTable() {
        return VOsTypesManager.moduleTables_by_voType[this.crud.readDatatable.API_TYPE_ID] ?
            VOsTypesManager.moduleTables_by_voType[this.crud.readDatatable.API_TYPE_ID].isModuleParamTable : false;
    }

    get has_createDatatable(): boolean {
        if (this.crud && this.crud.createDatatable && this.crud.createDatatable.fields) {
            return true;
        }

        return false;
    }
}