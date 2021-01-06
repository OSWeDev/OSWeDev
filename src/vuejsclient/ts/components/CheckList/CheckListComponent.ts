import debounce from 'lodash/debounce';
import { Component, Prop } from 'vue-property-decorator';
import ICheckList from '../../../../shared/modules/CheckList/interfaces/ICheckList';
import ICheckListItem from '../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckListItemCheckPoints from '../../../../shared/modules/CheckList/interfaces/ICheckListItemCheckPoints';
import ICheckPoint from '../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import ModuleCheckListBase from '../../../../shared/modules/CheckList/ModuleCheckListBase';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import WeightHandler from '../../../../shared/tools/WeightHandler';
import VueComponentBase from '../VueComponentBase';
import './CheckListComponent.scss';
import CheckListControllerBase from './CheckListControllerBase';
import CheckListModalComponent from './modal/CheckListModalComponent';


@Component({
    template: require('./CheckListComponent.pug'),
    components: {
        Checklistmodalcomponent: CheckListModalComponent
    }
})
export default class CheckListComponent extends VueComponentBase {

    @Prop()
    public global_route_path: string;

    @Prop({ default: false })
    public modal_show: boolean;

    @Prop({ default: null })
    public checklist_controller: CheckListControllerBase;

    @Prop({ default: null })
    private item_id: number;

    @Prop({ default: null })
    private step_id: number;

    @Prop({ default: null })
    private checklist_id: number;

    @Prop({ default: null })
    private checklist_shared_module: ModuleCheckListBase;

    private checklist: ICheckList = null;
    private checklistitems: { [id: number]: ICheckListItem } = {};
    private checkpoints: { [id: number]: ICheckPoint } = {};
    // private checkpointsdeps: { [check_point_id: number]: number[] } = {};
    private checklistitemcheckpoints: { [checklistitem_id: number]: { [checkpoint_id: number]: boolean } } = {};

    private debounced_loading = debounce(this.loading, 1000);

    get selected_checklist_item() {
        if ((!this.checklistitems) || (!this.item_id)) {
            return null;
        }

        return this.checklistitems[this.item_id];
    }

    get selected_checkpoint() {
        if ((!this.checkpoints) || (!this.step_id)) {
            return null;
        }

        return this.checkpoints[this.step_id];
    }

    get ordered_checkpoints(): ICheckPoint[] {

        if ((!this.checkpoints) || (!ObjectHandler.getInstance().hasAtLeastOneAttribute(this.checkpoints))) {
            return null;
        }

        let res: ICheckPoint[] = [];

        res = Object.values(this.checkpoints);
        WeightHandler.getInstance().sortByWeight(res);
        return res;
    }

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

        // let checkpointsdeps: ICheckPointDep[] = [];
        // promises.push((async () => {
        //     checkpointsdeps = await ModuleDAO.getInstance().getVosByRefFieldIds<ICheckPointDep>(
        //         this.checklist_shared_module.checkpoint_type_id, 'checkpoint_id', checkpoints_ids);
        // })());

        let checklistitemcheckpoints: ICheckListItemCheckPoints[] = [];
        promises.push((async () => {
            checklistitemcheckpoints = await ModuleDAO.getInstance().getVosByRefFieldIds<ICheckListItemCheckPoints>(
                this.checklist_shared_module.checklistitemcheckpoints_type_id, 'checkpoint_id', checkpoints_ids);
        })());

        await Promise.all(promises);
        this.nextLoadingStep();

        this.checklist = checklist;
        this.checklistitems = checklistitems;
        this.checkpoints = checkpoints;

        // this.checkpointsdeps = {};
        // for (let i in checkpointsdeps) {
        //     let checkpointdep: ICheckPointDep = checkpointsdeps[i];

        //     if (!this.checkpointsdeps[checkpointdep.checkpoint_id]) {
        //         this.checkpointsdeps[checkpointdep.checkpoint_id] = [];
        //     }
        //     this.checkpointsdeps[checkpointdep.checkpoint_id].push(checkpointdep.dependson_id);
        // }

        this.checklistitemcheckpoints = {};
        for (let i in checklistitemcheckpoints) {
            let checklistitemcheckpoint: ICheckListItemCheckPoints = checklistitemcheckpoints[i];

            if (!this.checklistitemcheckpoints[checklistitemcheckpoint.checklistitem_id]) {
                this.checklistitemcheckpoints[checklistitemcheckpoint.checklistitem_id] = {};
            }
            this.checklistitemcheckpoints[checklistitemcheckpoint.checklistitem_id][checklistitemcheckpoint.checkpoint_id] = true;
        }

        this.stopLoading();
    }
}