import debounce from 'lodash/debounce';
import { Component, Prop } from 'vue-property-decorator';
import ICheckList from '../../../../shared/modules/CheckList/interfaces/ICheckList';
import ICheckListItem from '../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckListItemCheckPoints from '../../../../shared/modules/CheckList/interfaces/ICheckListItemCheckPoints';
import ICheckPoint from '../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import ICheckPointDep from '../../../../shared/modules/CheckList/interfaces/ICheckPointDep';
import ModuleCheckListBase from '../../../../shared/modules/CheckList/ModuleCheckListBase';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../VueComponentBase';
import './CheckListComponent.scss';
import CheckListControllerBase from './CheckListControllerBase';


@Component({
    template: require('./CheckListComponent.pug'),
    components: {
    }
})
export default class CheckListComponent extends VueComponentBase {

    @Prop()
    public global_route_path: string;

    @Prop({ default: false })
    public modal_show: boolean;

    @Prop({ default: null })
    public item_id: number;

    @Prop({ default: null })
    public step_id: number;

    @Prop({ default: null })
    public checklist_id: number;

    @Prop({ default: null })
    public checklist_shared_module: ModuleCheckListBase;

    @Prop({ default: null })
    public checklist_controller: CheckListControllerBase;

    private checklist: ICheckList = null;
    private checklistitems: { [id: number]: ICheckListItem } = {};
    private checkpoints: { [id: number]: ICheckPoint } = {};
    private checkpointsdeps: { [check_point_id: number]: number[] } = {};
    private checklistitemCheckpoints: { [checklistitem_id: number]: ICheckPoint[] } = {};

    private debounced_loading = debounce(this.loading, 1000);

    private async loading() {
        this.nbLoadingSteps = 3;
        this.startLoading();

        let promises = [];

        let checklist: ICheckList = null;
        promises.push((async () => {
            checklist = await ModuleDAO.getInstance().getVoById<ICheckList>(this.checklist_shared_module.checklist_type_id, this.checklist_id);
        })());

        let checklistitems: { [id: number]: ICheckListItem } = {};
        promises.push((async () => {
            checklistitems = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVosByRefFieldIds<ICheckListItem>(
                this.checklist_shared_module.checklistitem_type_id, 'checklist_id', [this.checklist_id]));
        })());

        let checkpoints: { [id: number]: ICheckPoint } = {};
        promises.push((async () => {
            checkpoints = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVosByRefFieldIds<ICheckPoint>(
                this.checklist_shared_module.checkpoint_type_id, 'checklist_id', [this.checklist_id]));
        })());

        await Promise.all(promises);
        this.nextLoadingStep();

        promises = [];
        let checkpoints_ids = ObjectHandler.getInstance().getIdsList(checkpoints);

        let checkpointsdeps: ICheckPointDep[] = [];
        promises.push((async () => {
            checkpointsdeps = await ModuleDAO.getInstance().getVosByRefFieldIds<ICheckPointDep>(
                this.checklist_shared_module.checkpoint_type_id, 'checkpoint_id', checkpoints_ids);
        })());

        let checklistitemCheckpoints: ICheckListItemCheckPoints[] = [];
        promises.push((async () => {
            checklistitemCheckpoints = await ModuleDAO.getInstance().getVosByRefFieldIds<ICheckListItemCheckPoints>(
                this.checklist_shared_module.checklistitemcheckpoints_type_id, 'checkpoint_id', checkpoints_ids);
        })());

        await Promise.all(promises);
        this.nextLoadingStep();

        this.checklist = checklist;
        this.checklistitems = checklistitems;
        this.checkpoints = checkpoints;

        this.checkpointsdeps = {};
        for (let i in checkpointsdeps) {
            let checkpointdep: ICheckPointDep = checkpointsdeps[i];

            if (!this.checkpointsdeps[checkpointdep.checkpoint_id]) {
                this.checkpointsdeps[checkpointdep.checkpoint_id] = [];
            }
            this.checkpointsdeps[checkpointdep.checkpoint_id].push(checkpointdep.dependson_id);
        }

        this.checklistitemCheckpoints = {};
        for (let i in checklistitemCheckpoints) {
            let checklistitemCheckpoint: ICheckListItemCheckPoints = checklistitemCheckpoints[i];

            if (!this.checklistitemCheckpoints[checklistitemCheckpoint.checklistitem_id]) {
                this.checklistitemCheckpoints[checklistitemCheckpoint.checklistitem_id] = [];
            }
            this.checklistitemCheckpoints[checklistitemCheckpoint.checklistitem_id].push(this.checkpoints[checklistitemCheckpoint.checkpoint_id]);
        }

        this.stopLoading();
    }
}