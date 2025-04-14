import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import Alert from '../../../../../../shared/modules/Alert/vos/Alert';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../../../../../shared/modules/DAO/ModuleTableController';
import CRUD from '../../../../../../shared/modules/DAO/vos/CRUD';
import CRUDCreateNewVOAndRefsVO from '../../../../../../shared/modules/DAO/vos/CRUDCreateNewVOAndRefsVO';
import CRUDFieldRemoverConfVO from '../../../../../../shared/modules/DAO/vos/CRUDFieldRemoverConfVO';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleAlertAction } from '../../../alert/AlertStore';
import { ModuleCRUDGetter } from '../../../crud/store/CRUDStore';
import { ModuleDAOAction } from '../../../dao/store/DaoStore';
import DatatableComponent from '../../../datatable/component/DatatableComponent';
import CRUDComponentManager from '../../CRUDComponentManager';
import CRUDFormServices from '../CRUDFormServices';
import "./CRUDCreateFormComponent.scss";
import { cloneDeep, isEqual } from 'lodash';
import ModuleTableVO from '../../../../../../shared/modules/DAO/vos/ModuleTableVO';

@Component({
    template: require('./CRUDCreateFormComponent.pug'),
    components: {
        Datatable: DatatableComponent,
    },
})
export default class CRUDCreateFormComponent extends VueComponentBase {

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

    @Prop({ default: false })
    private inline_form_in_crud: boolean;

    private editableVO: IDistantVOBase = null;
    private newVO: IDistantVOBase = null;
    private newVO_initial: IDistantVOBase = null;

    private api_types_involved: string[] = [];

    private creating_vo: boolean = false;
    private is_only_readable: boolean = false;

    private crud_createDatatable_key: number = 0;
    private crud: CRUD<any> = null;

    private crud_field_remover_conf_edit: boolean = false;
    private crud_field_remover_conf: CRUDFieldRemoverConfVO = null;
    private POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS: boolean = false;

    private snotify_cancel = null;

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

    get callback_route(): string {
        let callback: string = this.getCRUDLink(this.api_type_id);
        if (CRUDComponentManager.getInstance().getCallbackRoute(false)) {
            callback = CRUDComponentManager.getInstance().getCallbackRoute();
        }

        return callback;
    }

    get has_createDatatable(): boolean {
        if (this.crud && this.crud.createDatatable && this.crud.createDatatable.fields) {
            return true;
        }

        return false;
    }

    get input_label(): string {
        if (this.inline_form_in_crud) {
            return this.label('crud.create.modal.add_continue');
        }

        return this.label('crud.create.modal.add');
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
                    .filter_by_text_eq(field_names<CRUDFieldRemoverConfVO>().module_table_vo_type, this.api_type_id)
                    .filter_is_false(field_names<CRUDFieldRemoverConfVO>().is_update)
                    .select_vo<CRUDFieldRemoverConfVO>();
            } catch (error) {
                if (error.message == 'Multiple results on select_vo is not allowed : ' + this.api_type_id) {
                    /**
                     * On gère les doublons au cas où on ait un problème de synchronisation en supprimant les plus récents
                     */
                    const doublons = await query(CRUDFieldRemoverConfVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<CRUDFieldRemoverConfVO>().module_table_vo_type, this.api_type_id)
                        .filter_is_false(field_names<CRUDFieldRemoverConfVO>().is_update)
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

    @Watch("vo_init")
    private async on_change_vo_init() {
        if (!this.crud) {
            return;
        }

        await this.prepareNewVO();
    }

    @Watch("crud", { immediate: true })
    private async updatedCRUD() {
        if (this.crud) {
            await this.reload_datas();
        }
    }

    public async update_key(force_new_vo: boolean) {
        if (this.crud && (this.crud_createDatatable_key != this.crud.createDatatable.key)) {
            if (force_new_vo) {
                await this.prepareNewVO();
            }

            this.crud_createDatatable_key = this.crud.createDatatable.key;
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

        this.snotify_cancel = this.snotify.confirm(this.label('cancel.create.confirmation.body'), this.label('cancel.create.confirmation.title'), {
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
                        this.newVO = cloneDeep(this.newVO_initial);

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

        return isEqual(this.newVO, this.newVO_initial);
    }

    private async mounted() {
        this.POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS = await ModuleAccessPolicy.getInstance().testAccess(ModuleDAO.POLICY_CAN_EDIT_REMOVED_CRUD_FIELDS);
    }

    private async delete_removed_crud_field_id(module_table_field_id: string) {
        if ((!this.crud_field_remover_conf) || (!this.crud_field_remover_conf.module_table_field_ids) || (this.crud_field_remover_conf.module_table_field_ids.indexOf(module_table_field_id) < 0)) {
            return;
        }

        this.crud_field_remover_conf.module_table_field_ids = this.crud_field_remover_conf.module_table_field_ids.filter((id) => id != module_table_field_id);

        const self = this;
        self.snotify.async(self.label('crud_create_form_body_delete_removed_crud_field_id.start'), () =>
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

        const self = this;
        self.snotify.async(self.label('crud_create_form_body_add_removed_crud_field_id.start'), () =>
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

    private async prepareNewVO() {
        this.newVO = await CRUDFormServices.getNewVO(
            this.crud, this.vo_init, this.onChangeVO
        );
        this.newVO_initial = cloneDeep(this.newVO);
        this.snotify_cancel = null;
    }

    private async createVO() {
        const self = this;
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

                if (self.newVO.id) {
                    self.newVO.id = null;
                }

                try {

                    if (!CRUDFormServices.checkForm(
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
                    const apiokVo = CRUDFormServices.IHMToData(self.newVO, self.crud.createDatatable, false);

                    createdVO = await self.create_vo_and_refs(apiokVo, reject);
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
                self.$emit('vo_create', createdVO);
                await self.callCallbackFunctionCreate();
                if (self.crud.reset_newvo_after_each_creation) {
                    await self.prepareNewVO();
                }

                if (self.close_on_submit) {
                    this.newVO_initial = cloneDeep(this.newVO);
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
        this.isLoading = true;

        this.api_types_involved = await CRUDFormServices.load_datas(
            this.crud,
            false,
            this.storeDatas,
            this.api_types_involved,
            this.prepareNewVO.bind(this),
            true,
        );

        this.isLoading = false;
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
        const to_refresh: boolean = await CRUDFormServices.uploadedFile(vo, field, fileVo, this.api_type_id, this.editableVO, this.updateData, this);

        if (to_refresh) {
            this.crud.createDatatable.refresh();
            this.crud_createDatatable_key = this.crud.createDatatable.key;
        }
    }

    private async create_vo_and_refs(vo: IDistantVOBase, reject_snotify) {
        // On utilise le trigger si il est présent sur le crud
        if (this.crud.preCreate) {
            const errorMsg = await this.crud.preCreate(vo, this.newVO);
            if (errorMsg) {
                //comme il a eut une erreur on abandonne la création
                this.creating_vo = false;
                reject_snotify({
                    body: this.label(errorMsg),
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

        // on doit récupérer toutes les refs
        const many_to_many_create_vos = CRUDFormServices.get_vos_to_create_ManyToMany(this.newVO, this.crud.createDatatable, vo);
        const one_to_many_update_queries = CRUDFormServices.get_queries_to_update_OneToMany(this.newVO, this.crud.createDatatable);

        const new_vo_and_refs: CRUDCreateNewVOAndRefsVO = new CRUDCreateNewVOAndRefsVO();
        new_vo_and_refs.new_vo = vo;
        new_vo_and_refs.many_to_many_vos = (many_to_many_create_vos && many_to_many_create_vos.length) ? many_to_many_create_vos : null;
        new_vo_and_refs.one_to_many_vos = (one_to_many_update_queries && one_to_many_update_queries.length) ? one_to_many_update_queries : null;

        const new_and_updated_vos = await ModuleDAO.getInstance().create_new_vo_and_refs(new_vo_and_refs);
        for (const i in new_and_updated_vos) {
            const new_or_updated_vo = new_and_updated_vos[i];

            this.storeData(new_or_updated_vo);
        }

        // On renvoie le vo créé, donc le premier de la liste
        return new_and_updated_vos[0];

        // const res: InsertOrDeleteQueryResult = await ModuleDAO.instance.insertOrUpdateVO(vo);
        // if ((!res) || (!res.id)) {
        //     this.creating_vo = false;
        //     reject_snotify({
        //         body: this.label('crud.create.errors.create_failure'),
        //         config: {
        //             timeout: 10000,
        //             showProgressBar: true,
        //             closeOnClick: false,
        //             pauseOnHover: true,
        //         },
        //     });
        //     return;
        // }

        // const id = res.id ? res.id : null;
        // this.newVO.id = id;
        // vo.id = id;

        // const n_createdVO = await query(this.crud.readDatatable.API_TYPE_ID).filter_by_id(id).select_vo();
        // const createdVO = n_createdVO ? n_createdVO : vo;
        // /**
        //  * A SUIVRE en prod suivant les projets
        //  *  mais a priori si on a un res.id mais qu'on peut pas recharger le vo directement, c'est qu'on a pas le droit peut-etre
        //  *  par ce qu'il est pas complet. donc on le rempli quand même
        //  */

        // if (n_createdVO && ((n_createdVO.id !== id) || (n_createdVO._type !== this.crud.readDatatable.API_TYPE_ID))) {
        //     this.creating_vo = false;
        //     reject_snotify({
        //         body: this.label('crud.create.errors.create_failure'),
        //         config: {
        //             timeout: 10000,
        //             showProgressBar: true,
        //             closeOnClick: false,
        //             pauseOnHover: true,
        //         },
        //     });
        //     return;
        // }

        // // On doit mettre à jour les OneToMany, et ManyToMany dans les tables correspondantes
        // await CRUDFormServices.updateManyToMany(this.newVO, this.crud.createDatatable, createdVO, this.removeData, this.storeData, this);
        // await CRUDFormServices.updateOneToMany(this.newVO, this.crud.createDatatable, createdVO, this.updateData);

        // if (this.crud.postCreate) {
        //     await this.crud.postCreate(this.newVO);
        // }

        // this.storeData(createdVO);
    }
}