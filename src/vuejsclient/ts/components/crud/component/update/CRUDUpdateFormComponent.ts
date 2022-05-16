import { Component, Prop, Watch } from 'vue-property-decorator';
import Alert from '../../../../../../shared/modules/Alert/vos/Alert';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import CRUD from '../../../../../../shared/modules/DAO/vos/CRUD';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import { ModuleAlertAction } from '../../../alert/AlertStore';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../dao/store/DaoStore';
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

    private editableVO: IDistantVOBase = null;

    private api_types_involved: string[] = [];

    private updating_vo: boolean = false;
    private is_only_readable: boolean = false;

    private crud_updateDatatable_key: number = 0;
    private dao_store_loaded: boolean = false;
    private crud: CRUD<any> = null;

    public update_key() {
        if (this.crud && (this.crud_updateDatatable_key != this.crud.updateDatatable.key)) {
            this.crud_updateDatatable_key = this.crud.updateDatatable.key;
        }
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
        }
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
        await Promise.all(CRUDFormServices.getInstance().loadDatasFromDatatable(this.crud.updateDatatable, this.api_types_involved, this.storeDatas, true));

        this.isLoading = false;
    }

    // Handle Loading of stored data

    @Watch("crud", { immediate: true })
    private async updatedCRUD() {

        if (this.crud) {
            await this.reload_datas();
        }
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

    @Watch("selected_vo", { immediate: true })
    private updateSelected_vo() {
        if (!this.selected_vo) {
            this.editableVO = null;
        }

        let self = this;
        let waiter = () => {
            if (!self.dao_store_loaded) {
                setTimeout(waiter, 300);
            } else {
                // On passe la traduction en IHM sur les champs
                self.editableVO = CRUDFormServices.getInstance().dataToIHM(self.selected_vo, self.crud.updateDatatable, true);
                self.onChangeVO(self.editableVO);
            }
        };

        waiter();
    }

    private async updateVO() {

        let self = this;
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

                    if (!CRUDFormServices.getInstance().checkForm(self.editableVO, self.crud.updateDatatable, self.clear_alerts, self.register_alerts)) {
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
                    let apiokVo = CRUDFormServices.getInstance().IHMToData(self.editableVO, self.crud.updateDatatable, true);

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

                    updatedVO = await ModuleDAO.getInstance().getVoById<any>(self.selected_vo._type, self.selected_vo.id);
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
                    await CRUDFormServices.getInstance().updateManyToMany(self.editableVO, self.crud.createDatatable, updatedVO, self.removeData, self.storeData, self);
                    await CRUDFormServices.getInstance().updateOneToMany(self.editableVO, self.crud.createDatatable, updatedVO, self.getStoredDatas, self.updateData);

                    self.updateData(updatedVO);
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

                self.updating_vo = false;

                self.$emit(updatedVO._type + '_update', updatedVO);
                await self.callCallbackFunctionUpdate();

                if (self.close_on_submit) {
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
        await CRUDFormServices.getInstance().uploadedFile(vo, field, fileVo, this.api_type_id, this.editableVO, this.updateData, this);
    }

    private async reload_datas() {
        this.dao_store_loaded = false;
        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved(this.api_types_involved);
        this.api_types_involved = [];
        await this.loaddatas();
        this.dao_store_loaded = true;
    }

    private async callCallbackFunctionUpdate(): Promise<void> {
        if (this.crud && this.crud.callback_function_update) {
            await this.crud.callback_function_update(this.editableVO);
        }
    }

    get api_type_id(): string {
        if (!this.crud) {

            if (this.selected_vo) {
                return this.selected_vo._type;
            }
            return null;
        }
        return this.crud.readDatatable.API_TYPE_ID;
    }

    private async cancel() {
        this.$emit('cancel');
    }
}