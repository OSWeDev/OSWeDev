import * as $ from 'jquery';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import Alert from '../../../../../../shared/modules/Alert/vos/Alert';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import CRUD from '../../../../../../shared/modules/DAO/vos/CRUD';
import Datatable from '../../../../../../shared/modules/DAO/vos/datatable/Datatable';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import ManyToManyReferenceDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/ManyToManyReferenceDatatableField';
import ManyToOneReferenceDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableField';
import OneToManyReferenceDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/OneToManyReferenceDatatableField';
import ReferenceDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/ReferenceDatatableField';
import RefRangesReferenceDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/RefRangesReferenceDatatableField';
import SimpleDatatableField from '../../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import InsertOrDeleteQueryResult from '../../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import ModuleFormatDatesNombres from '../../../../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import TableFieldTypesManager from '../../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import ModuleVocus from '../../../../../../shared/modules/Vocus/ModuleVocus';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import DateHandler from '../../../../../../shared/tools/DateHandler';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import { ModuleAlertAction } from '../../../alert/AlertStore';
import { ModuleCRUDAction, ModuleCRUDGetter } from '../../../crud/store/CRUDStore';
import { ModuleDAOAction, ModuleDAOGetter } from '../../../dao/store/DaoStore';
import DatatableComponent from '../../../datatable/component/DatatableComponent';
import VueComponentBase from '../../../VueComponentBase';
import CRUDComponentManager from '../../CRUDComponentManager';
import CRUDFormServices from '../CRUDFormServices';
import "./CRUDCreateFormComponent.scss";

@Component({
    template: require('./CRUDCreateFormComponent.pug'),
    components: {
        Datatable: DatatableComponent
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
    @ModuleCRUDAction
    private setSelectedVOs: (selectedVOs: IDistantVOBase[]) => void;

    @ModuleCRUDGetter
    private getSelectedVOs: IDistantVOBase[];

    @ModuleAlertAction
    private clear_alerts: () => void;
    @ModuleAlertAction
    private register_alerts: (alerts: Alert[]) => void;

    @Prop()
    private crud: CRUD<IDistantVOBase>;

    @Prop({ default: false })
    private close_on_submit: boolean;

    @Prop()
    private selected_vo: IDistantVOBase;
    @Prop({ default: null })
    private vo_init: IDistantVOBase;

    @Prop({ default: true })
    private show_insert_or_update_target: boolean;

    private editableVO: IDistantVOBase = null;
    private newVO: IDistantVOBase = null;

    private api_types_involved: string[] = [];

    private creating_vo: boolean = false;
    private is_only_readable: boolean = false;

    private crud_createDatatable_key: number = 0;

    @Watch("vo_init")
    private on_change_vo_init() {
        this.prepareNewVO();
    }

    private async loaddatas() {

        this.isLoading = true;

        this.loadingProgression = 0;
        this.nbLoadingSteps = 5;

        if (!this.crud) {
            this.snotify.error(this.label('crud.errors.loading'));
            return;
        }

        await Promise.all(CRUDFormServices.getInstance().loadDatasFromDatatable(this.crud.createDatatable, this.api_types_involved, this.storeDatas));
        this.nextLoadingStep();

        this.prepareNewVO();
        this.nextLoadingStep();
        this.nextLoadingStep();

        this.isLoading = false;
    }

    @Watch("crud", { immediate: true })
    private async updatedCRUD() {
        await this.reload_datas();
    }

    private prepareNewVO() {

        this.newVO = CRUDFormServices.getInstance().getNewVO(
            this.crud, this.vo_init, this.onChangeVO
        );
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
        this.editableVO = CRUDFormServices.getInstance().dataToIHM(this.getSelectedVOs[0], this.crud.updateDatatable, true);
        this.onChangeVO(this.editableVO);
    }

    private async createVO() {
        this.snotify.info(this.label('crud.create.starting'));
        this.creating_vo = true;
        let createdVO = null;

        if ((!this.newVO) || (this.newVO._type !== this.crud.readDatatable.API_TYPE_ID)) {
            this.snotify.error(this.label('crud.create.errors.newvo_failure'));
            this.creating_vo = false;
            return;
        }

        if (!!this.newVO.id) {
            this.newVO.id = null;
        }

        try {

            if (!CRUDFormServices.getInstance().checkForm(
                this.newVO, this.crud.createDatatable, this.clear_alerts, this.register_alerts)) {
                this.snotify.error(this.label('crud.check_form.field_required'));
                this.creating_vo = false;
                return;
            }

            // On passe la traduction depuis IHM sur les champs
            let apiokVo = CRUDFormServices.getInstance().IHMToData(this.newVO, this.crud.createDatatable, false);

            // On utilise le trigger si il est présent sur le crud
            if (this.crud.preCreate) {
                let errorMsg = await this.crud.preCreate(apiokVo, this.newVO);
                if (errorMsg) {
                    this.snotify.error(this.label(errorMsg));
                    //comme il a eut une erreur on abandonne la création
                    this.creating_vo = false;
                    return;
                }
            }

            let res: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(apiokVo);
            if ((!res) || (!res.id)) {
                this.snotify.error(this.label('crud.create.errors.create_failure'));
                this.creating_vo = false;
                return;
            }

            let id = res.id ? res.id : null;
            this.newVO.id = id;

            createdVO = await ModuleDAO.getInstance().getVoById<any>(this.crud.readDatatable.API_TYPE_ID, id);
            if ((!createdVO) || (createdVO.id !== id) || (createdVO._type !== this.crud.readDatatable.API_TYPE_ID)) {
                this.snotify.error(this.label('crud.create.errors.create_failure'));
                this.creating_vo = false;
                return;
            }

            // On doit mettre à jour les OneToMany, et ManyToMany dans les tables correspondantes
            await CRUDFormServices.getInstance().updateManyToMany(this.newVO, this.crud.createDatatable, createdVO, this.removeData, this.storeData, this);
            await CRUDFormServices.getInstance().updateOneToMany(this.newVO, this.crud.createDatatable, createdVO, this.getStoredDatas, this.updateData);

            this.storeData(createdVO);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
            this.snotify.error(this.label('crud.create.errors.create_failure') + ": " + error);
            this.creating_vo = false;
            return;
        }

        this.snotify.success(this.label('crud.create.success'));

        this.creating_vo = false;

        this.$emit(createdVO._type + '_create', createdVO);
        await this.callCallbackFunctionCreate();
        if (this.crud.reset_newvo_after_each_creation) {
            this.prepareNewVO();
        }

        if (this.close_on_submit) {
            this.$emit('close');
        } else {
            this.crud.createDatatable.refresh();
            this.crud_createDatatable_key = this.crud.createDatatable.key;
        }
    }

    private onChangeVO(vo: IDistantVOBase) {
        this.crud_createDatatable_key = this.crud.createDatatable.key;

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
}