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

    get crud(): CRUD<any> {
        if ((!this.selected_vo) || (!this.selected_vo._type)) {
            return null;
        }

        if (!CRUDComponentManager.getInstance().cruds_by_api_type_id[this.selected_vo._type]) {
            CRUDComponentManager.getInstance().registerCRUD(
                this.selected_vo._type,
                null,
                null,
                null
            );
        }

        return CRUDComponentManager.getInstance().cruds_by_api_type_id[this.selected_vo._type];
    }

    private async loaddatas() {

        this.isLoading = true;

        if (!this.crud) {
            this.snotify.error(this.label('crud.errors.loading'));
            this.isLoading = false;
            return;
        }

        await Promise.all(CRUDFormServices.getInstance().loadDatasFromDatatable(this.crud.updateDatatable, this.api_types_involved, this.storeDatas));

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
            return;
        }

        // On passe la traduction en IHM sur les champs
        this.editableVO = CRUDFormServices.getInstance().dataToIHM(this.selected_vo, this.crud.updateDatatable, true);
        this.onChangeVO(this.editableVO);
    }

    private async updateVO() {
        this.snotify.info(this.label('crud.update.starting'));
        this.updating_vo = true;
        let updatedVO = null;

        if ((!this.selected_vo) || (!this.editableVO) || (this.editableVO.id !== this.selected_vo.id) || (this.editableVO._type !== this.selected_vo._type)) {
            this.snotify.error(this.label('crud.update.errors.selection_failure'));
            this.updating_vo = false;
            return;
        }

        try {

            if (!CRUDFormServices.getInstance().checkForm(this.editableVO, this.crud.updateDatatable, this.clear_alerts, this.register_alerts)) {
                this.snotify.error(this.label('crud.check_form.field_required'));
                this.updating_vo = false;
                return;
            }

            // On passe la traduction depuis IHM sur les champs
            let apiokVo = CRUDFormServices.getInstance().IHMToData(this.editableVO, this.crud.updateDatatable, true);

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
            let id = (res && res.id) ? parseInt(res.id.toString()) : null;

            if ((!res) || (!id) || (id != this.selected_vo.id)) {
                this.snotify.error(this.label('crud.update.errors.update_failure'));
                this.updating_vo = false;
                return;
            }

            updatedVO = await ModuleDAO.getInstance().getVoById<any>(this.selected_vo._type, this.selected_vo.id);
            if ((!updatedVO) || (updatedVO.id !== this.selected_vo.id) || (updatedVO._type !== this.selected_vo._type)) {
                this.snotify.error(this.label('crud.update.errors.update_failure'));
                this.updating_vo = false;
                return;
            }

            // On doit mettre à jour les OneToMany, et ManyToMany dans les tables correspondantes
            await CRUDFormServices.getInstance().updateManyToMany(this.editableVO, this.crud.createDatatable, updatedVO, this.removeData, this.storeData, this);
            await CRUDFormServices.getInstance().updateOneToMany(this.editableVO, this.crud.createDatatable, updatedVO, this.getStoredDatas, this.updateData);

            this.updateData(updatedVO);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            this.snotify.error(this.label('crud.update.errors.update_failure') + ": " + error);
            this.updating_vo = false;
            return;
        }

        this.snotify.success(this.label('crud.update.success'));
        this.updating_vo = false;

        this.$emit(updatedVO._type + '_update', updatedVO);
        await this.callCallbackFunctionUpdate();

        if (this.close_on_submit) {
            this.$emit('close');
        }
    }

    private onChangeVO(vo: IDistantVOBase) {
        this.crud_updateDatatable_key = this.crud.updateDatatable.key;

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
        AjaxCacheClientController.getInstance().invalidateCachesFromApiTypesInvolved(this.api_types_involved);
        this.api_types_involved = [];
        await this.loaddatas();
    }

    private async callCallbackFunctionUpdate(): Promise<void> {
        if (this.crud && this.crud.callback_function_update) {
            await this.crud.callback_function_update(this.editableVO);
        }
    }

    get api_type_id(): string {
        return this.crud.readDatatable.API_TYPE_ID;
    }

    private async cancel() {
        this.$emit('cancel');
    }
}