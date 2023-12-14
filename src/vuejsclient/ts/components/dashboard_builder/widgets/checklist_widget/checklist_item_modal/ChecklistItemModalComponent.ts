import Component from 'vue-class-component';
import 'vue-slider-component/theme/default.css';
import ICheckList from '../../../../../../../shared/modules/CheckList/interfaces/ICheckList';
import ICheckListItem from '../../../../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckPoint from '../../../../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import CheckListControllerBase from '../../../../CheckList/CheckListControllerBase';
import CheckListModalComponent from '../../../../CheckList/modal/CheckListModalComponent';
import VueComponentBase from '../../../../VueComponentBase';
import './ChecklistItemModalComponent.scss';

@Component({
    template: require('./ChecklistItemModalComponent.pug'),
    components: {
        Checklistmodalcomponent: CheckListModalComponent
    }
})
export default class ChecklistItemModalComponent extends VueComponentBase {

    private selected_checkpoint: ICheckPoint = null;
    private selected_checklist_item: ICheckListItem = null;
    private checklist: ICheckList = null;
    private ordered_checkpoints: ICheckPoint[] = null;

    private initialized: boolean = false;

    public openmodal(
        checklist: ICheckList,
        selected_checklist_item: ICheckListItem,
        selected_checkpoint: ICheckPoint,
        ordered_checkpoints: ICheckPoint[]
    ) {
        this.selected_checklist_item = selected_checklist_item;
        this.ordered_checkpoints = ordered_checkpoints;
        this.selected_checkpoint = selected_checkpoint;
        this.checklist = checklist;

        $('#checklist_item_modal').modal('show');
    }

    public change_selected_checklist_item(selected_checklist_item: ICheckListItem) {
        this.selected_checklist_item = selected_checklist_item;
    }

    public mounted() {

        if (!this.initialized) {
            this.initialized = true;
            $(this.$refs.checklist_item_modal).on("hidden.bs.modal", () => {
                this.$emit("update_visible_options", null);
            });
        }
    }

    public closemodal() {
        $('#checklist_item_modal').modal('hide');
    }

    public async deleteSelectedItem(item: ICheckListItem) {
        this.$emit("deleteSelectedItem", item);
    }

    public onchangevo(vo) {
        this.$emit("onchangevo", vo);
    }

    private changecheckpoint(cp: ICheckPoint) {
        this.selected_checkpoint = cp;
    }

    get checklist_controller(): CheckListControllerBase {
        if (!this.checklist) {
            return null;
        }

        for (let name in CheckListControllerBase.controller_by_name) {
            let controller = CheckListControllerBase.controller_by_name[name];

            if (controller.checklist_shared_module.checklist_name == this.checklist.name) {
                return controller;
            }
        }
        return null;
    }
}