import { Component, Prop, Watch } from 'vue-property-decorator';
import Alert from '../../../../../../shared/modules/Alert/vos/Alert';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import CRUD from '../../../../../../shared/modules/DAO/vos/CRUD';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
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


    public async update_key(force_new_vo: boolean) {
        if (this.crud && (this.crud_createDatatable_key != this.crud.createDatatable.key)) {
            if (force_new_vo) {
                await this.prepareNewVO();
            }

            this.crud_createDatatable_key = this.crud.createDatatable.key;
        }
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

                    let n_createdVO = await ModuleDAO.getInstance().getVoById<any>(self.crud.readDatatable.API_TYPE_ID, id);
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