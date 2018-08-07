import { Component, Prop, Watch, Vue } from 'vue-property-decorator';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import { ModuleCRUDGetter } from '../../crud/store/CRUDStore';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import DatatableComponent from '../../datatable/component/DatatableComponent';
import VueComponentBase from '../../VueComponentBase';
import CRUD from '../vos/CRUD';
import select2 from '../../../directives/select2/select2';
import "./CRUDComponent.scss";
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import { create } from 'domain';
import ManyToOneReferenceDatatableField from '../../datatable/vos/ManyToOneReferenceDatatableField';
import DatatableField from '../../datatable/vos/DatatableField';
import ReferenceDatatableField from '../../datatable/vos/ReferenceDatatableField';
import OneToManyReferenceDatatableField from '../../datatable/vos/OneToManyReferenceDatatableField';
import ManyToManyReferenceDatatableField from '../../datatable/vos/ManyToManyReferenceDatatableField';
import * as $ from 'jquery';

@Component({
    template: require('./CRUDComponent.pug'),
    components: {
        datatable: DatatableComponent
    },
    directives: {
        select2: select2
    }
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

    @ModuleCRUDGetter
    public getSelectedVOs: IDistantVOBase[];

    @Prop()
    private crud: CRUD<IDistantVOBase>;

    private editableVO: IDistantVOBase = null;
    private newVO: IDistantVOBase = null;

    private select_options: { [field_id: string]: IDistantVOBase[] } = {};
    private isLoadingOptions: { [field_id: string]: boolean } = {};

    public async mounted() {

        await this.loaddatas();
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
        this.prepare_select_options();
        this.nextLoadingStep();

        this.isLoading = false;
    }

    @Watch("crud")
    private async updatedCRUD() {
        await this.loaddatas();
    }

    private prepareNewVO() {

        let obj = {
            _type: this.crud.readDatatable.moduleTable.vo_type,
            id: null
        };

        for (let i in this.crud.createDatatable.fields) {
            let field = this.crud.createDatatable.fields[i];

            obj[field.datatable_field_uid] = null;
        }


        this.newVO = obj;
    }

    private prepare_select_options() {

        for (let i in this.crud.createDatatable.fields) {
            let field = this.crud.createDatatable.fields[i];

            if (field.type == ManyToOneReferenceDatatableField.FIELD_TYPE) {
                let newOptions = [];

                let manyToOne: ReferenceDatatableField<any> = (field as ReferenceDatatableField<any>);
                let options = this.getStoredDatas[manyToOne.targetModuleTable.vo_type];

                for (let j in options) {
                    let option = options[j];

                    newOptions.push(option.id);
                    this.isLoadingOptions[field.datatable_field_uid] = false;
                }
                Vue.set(this.select_options, field.datatable_field_uid, newOptions);
            }
        }
    }

    private asyncLoadOptions(query, datatable_field_uid) {
        this.isLoadingOptions[datatable_field_uid] = true;

        let field: DatatableField<any, any>;
        for (let i in this.crud.createDatatable.fields) {
            if (!this.crud.createDatatable.fields[i]) {
                this.snotify.warning(this.label('crud.multiselect.search.error'));
                continue;
            }

            if (this.crud.createDatatable.fields[i].datatable_field_uid == datatable_field_uid) {
                field = this.crud.createDatatable.fields[i];
                break;
            }
        }
        if ((!field) ||
            ((field.type != ManyToOneReferenceDatatableField.FIELD_TYPE) &&
                (field.type != OneToManyReferenceDatatableField.FIELD_TYPE) &&
                (field.type != ManyToManyReferenceDatatableField.FIELD_TYPE))) {
            this.snotify.warning(this.label('crud.multiselect.search.error'));
            this.isLoadingOptions[datatable_field_uid] = false;
            return;
        }

        let manyToOne: ReferenceDatatableField<any> = (field as ReferenceDatatableField<any>);
        let options = this.getStoredDatas[manyToOne.targetModuleTable.vo_type];
        let newOptions = [];

        for (let i in options) {
            let option = options[i];

            if (manyToOne.dataToHumanReadable(option).match(query)) {
                newOptions.push(option.id);
            }
        }

        this.isLoadingOptions[datatable_field_uid] = false;
        Vue.set(this.select_options, field.datatable_field_uid, newOptions);
    }

    get CRUDTitle(): string {
        if (!this.crud) {
            return null;
        }

        return this.label('crud.read.title', { datatable_title: this.t(this.crud.readDatatable.moduleTable.label.code_text) });
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

        this.editableVO = Object.assign({}, this.getSelectedVOs[0]);
    }

    private async createVO() {
        if ((!this.newVO) || (this.newVO.id) || (this.newVO._type !== this.crud.readDatatable.moduleTable.vo_type)) {
            this.snotify.error(this.label('crud.create.errors.newvo_failure'));
            return;
        }

        try {

            let res = await ModuleDAO.getInstance().insertOrUpdateVO(this.newVO);
            if ((!res) || (!res.id)) {
                this.snotify.error(this.label('crud.create.errors.create_failure'));
                return;
            }

            res.id = parseInt(res.id.toString());

            let createdVO = await ModuleDAO.getInstance().getVoById<any>(this.crud.readDatatable.moduleTable.vo_type, res.id);
            if ((!createdVO) || (createdVO.id !== res.id) || (createdVO._type !== this.crud.readDatatable.moduleTable.vo_type)) {
                this.snotify.error(this.label('crud.create.errors.create_failure'));
                return;
            }

            this.storeData(createdVO);
        } catch (error) {
            this.snotify.error(this.label('crud.create.errors.create_failure') + ": " + error);
            return;
        }

        this.snotify.success(this.label('crud.create.success'));
        $('#createData').modal('hide');
    }

    private async updateVO() {
        if ((!this.selectedVO) || (!this.editableVO) || (this.editableVO.id !== this.selectedVO.id) || (this.editableVO._type !== this.selectedVO._type)) {
            this.snotify.error(this.label('crud.update.errors.selection_failure'));
            return;
        }

        try {

            let res = await ModuleDAO.getInstance().insertOrUpdateVO(this.editableVO);
            if ((!res) || (!res.id) || (res.id != this.selectedVO.id)) {
                this.snotify.error(this.label('crud.update.errors.update_failure'));
                return;
            }

            let updatedVO = await ModuleDAO.getInstance().getVoById<any>(this.selectedVO._type, this.selectedVO.id);
            if ((!updatedVO) || (updatedVO.id !== this.selectedVO.id) || (updatedVO._type !== this.selectedVO._type)) {
                this.snotify.error(this.label('crud.update.errors.update_failure'));
                return;
            }

            this.updateData(updatedVO);
        } catch (error) {
            this.snotify.error(this.label('crud.update.errors.update_failure') + ": " + error);
            return;
        }

        this.snotify.success(this.label('crud.update.success'));
        $('#updateData').modal('hide');
    }

    private async deleteVO() {
        if (!this.selectedVO) {
            this.snotify.error(this.label('crud.delete.errors.selection_failure'));
            return;
        }

        try {

            await ModuleDAO.getInstance().deleteVOs([this.selectedVO]);

            let deletedVO = await ModuleDAO.getInstance().getVoById<any>(this.selectedVO._type, this.selectedVO.id);
            if (deletedVO && deletedVO.id) {
                this.snotify.error(this.label('crud.delete.errors.delete_failure'));
                return;
            }

            this.removeData({
                API_TYPE_ID: this.selectedVO._type,
                id: this.selectedVO.id
            });
        } catch (error) {
            this.snotify.error(this.label('crud.delete.errors.delete_failure') + ": " + error);
            return;
        }

        this.snotify.success(this.label('crud.delete.success'));
        $('#deleteData').modal('hide');
    }
}