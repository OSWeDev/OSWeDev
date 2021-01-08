import { Component, Prop, Watch } from 'vue-property-decorator';
import ICheckListItem from '../../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckPoint from '../../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import CheckPointVO from '../../../../../shared/modules/CheckList/vos/CheckPointVO';
import SimpleDatatableField from '../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import VueComponentBase from '../../VueComponentBase';
import CheckListControllerBase from '../CheckListControllerBase';
import './CheckListItemComponent.scss';
import debounce from 'lodash/debounce';

@Component({
    template: require('./CheckListItemComponent.pug'),
    components: {
    }
})
export default class CheckListItemComponent extends VueComponentBase {

    @Prop({ default: null })
    private checklist_controller: CheckListControllerBase;

    @Prop()
    private global_route_path: string;

    @Prop({ default: null })
    private checklist_item: ICheckListItem;

    @Prop({ default: null })
    private ordered_checkpoints: ICheckPoint[];

    private state_steps: { [step_shortname: string]: number } = {};
    private debounced_update_state_step = debounce(this.update_state_step.bind(this), 100);

    private openmodal(shortname: string = null, step_id: number = null) {
        if (!this.checklist_item) {
            return;
        }

        if (this.state_steps[shortname] == this.STATE_DISABLED) {
            return;
        }

        this.$router.push(step_id ?
            this.global_route_path + '/' + this.checklist_item.checklist_id + '/' + this.checklist_item.id + '/' + step_id :
            this.global_route_path + '/' + this.checklist_item.checklist_id + '/' + this.checklist_item.id);
    }

    get checkpoint_descriptions(): { [step_id: number]: string } {

        if (!this.checklist_item) {
            return {};
        }

        let res: { [step_id: number]: string } = {};
        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[this.checklist_item._type];

        for (let i in this.ordered_checkpoints) {
            let checkpoint = this.ordered_checkpoints[i];

            let checkpoint_description = '<p><strong><u>' + this.label(checkpoint.name) + ' [' + checkpoint.shortname + ']' + '</u></strong></p>';

            if (checkpoint.item_field_ids && checkpoint.item_field_ids.length) {

                checkpoint_description += '<ul>';
                for (let j in checkpoint.item_field_ids) {
                    let item_field_id = checkpoint.item_field_ids[j];

                    let field: ModuleTableField<any> = moduletable.getFieldFromId(item_field_id);

                    checkpoint_description += '<li>' + this.t(field.field_label.code_text) + ' : <strong>' +
                        SimpleDatatableField.defaultDataToReadIHM(this.checklist_item[item_field_id], field, this.checklist_item) + '</strong></li>';
                }
                checkpoint_description += '</ul>';
            }

            res[checkpoint.id] = checkpoint_description;
        }

        return res;
    }


    get item_description(): string {

        if (!this.checklist_item) {
            return null;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[this.checklist_item._type];

        let checkpoint_description: string = '<ul>';
        for (let j in moduletable.get_fields()) {
            let field: ModuleTableField<any> = moduletable.get_fields()[j];

            checkpoint_description += '<li>' + this.t(field.field_label.code_text) + ' : <strong>' +
                SimpleDatatableField.defaultDataToReadIHM(this.checklist_item[field.field_id], field, this.checklist_item) + '</strong></li>';
        }
        checkpoint_description += '</ul>';

        return checkpoint_description;
    }

    get STATE_DISABLED(): number {
        return CheckPointVO.STATE_DISABLED;
    }

    get STATE_TODO(): number {
        return CheckPointVO.STATE_TODO;
    }

    get STATE_ERROR(): number {
        return CheckPointVO.STATE_ERROR;
    }

    get STATE_WARN(): number {
        return CheckPointVO.STATE_WARN;
    }

    get STATE_OK(): number {
        return CheckPointVO.STATE_OK;
    }

    @Watch('checklist_controller')
    @Watch('global_route_path')
    @Watch('checklist_item')
    @Watch('ordered_checkpoints')
    private watchers() {
        this.debounced_update_state_step();
    }

    private mounted() {
        this.debounced_update_state_step();
    }

    private async update_state_step() {
        let res: { [step_shortname: string]: number } = {};

        res['1'] = await this.checklist_controller.get_state_step('1', this.checklist_item);
        res['2'] = await this.checklist_controller.get_state_step('2', this.checklist_item);
        res['3'] = await this.checklist_controller.get_state_step('3', this.checklist_item);
        res['4'] = await this.checklist_controller.get_state_step('4', this.checklist_item);
        res['5'] = await this.checklist_controller.get_state_step('5', this.checklist_item);
        res['6'] = await this.checklist_controller.get_state_step('6', this.checklist_item);
        res['7'] = await this.checklist_controller.get_state_step('7', this.checklist_item);

        this.state_steps = res;
    }
}