import debounce from 'lodash/debounce';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ICheckListItem from '../../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckPoint from '../../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import CheckPointVO from '../../../../../shared/modules/CheckList/vos/CheckPointVO';
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import VueComponentBase from '../../VueComponentBase';
import CheckListControllerBase from '../CheckListControllerBase';
import "./CheckListModalComponent.scss";

@Component({
    template: require('./CheckListModalComponent.pug')
})
export default class CheckListModalComponent extends VueComponentBase {

    @Prop({ default: null })
    private checklist_item: ICheckListItem;

    @Prop({ default: null })
    private checkpoint: ICheckPoint;

    @Prop({ default: null })
    private checklist_controller: CheckListControllerBase;

    @Prop({ default: null })
    private ordered_checkpoints: ICheckPoint[];

    private state_steps: { [step_name: string]: number } = {};
    private debounced_update_state_step = debounce(this.update_state_step.bind(this), 100);

    private valid_fields: { [field_name: string]: boolean } = {};

    private onchangevo(vo) {
        this.$emit('onchangevo', vo);
    }

    @Watch('checklist_controller')
    @Watch('checkpoint')
    @Watch('checklist_item')
    @Watch('ordered_checkpoints')
    private watchers() {
        this.debounced_update_state_step();
    }

    private mounted() {
        this.debounced_update_state_step();
    }

    get editable_fields(): Array<DatatableField<any, any>> {

        if (!this.checkpoint) {
            let max_fields: Array<DatatableField<any, any>> = [];

            for (let valid_field_name in this.valid_fields) {
                let editable_field = this.all_editable_fields.find((ef) => ef.module_table_field_id == valid_field_name);

                max_fields.push(editable_field);
            }
            return max_fields;
        }

        if ((!this.checkpoint.item_field_ids) || (!this.checkpoint.item_field_ids.length)) {
            return [];
        }

        let res: Array<DatatableField<any, any>> = [];

        for (let i in this.all_editable_fields) {
            let editable_field = this.all_editable_fields[i];

            if (this.checkpoint.item_field_ids.indexOf(editable_field.module_table_field_id) >= 0) {
                res.push(editable_field);
            }
        }
        return res;
    }

    get all_editable_fields(): Array<DatatableField<any, any>> {
        return this.checklist_controller.get_ordered_editable_fields();
    }

    private async update_state_step() {
        let res: { [step_name: string]: number } = {};

        for (let i in this.ordered_checkpoints) {
            let checkpoint = this.ordered_checkpoints[i];

            res[checkpoint.name] = await this.checklist_controller.get_state_step(checkpoint.name, this.checklist_item);
        }

        let valid_fields: { [field_name: string]: boolean } = {};
        if (this.ordered_checkpoints) {

            for (let name in res) {
                if (res[name] == CheckPointVO.STATE_DISABLED) {
                    continue;
                }

                let checkpoint: ICheckPoint = this.ordered_checkpoints.find((c) => c.name == name);
                checkpoint.item_field_ids.forEach((item) => valid_fields[item] = true);
            }
        }
        this.valid_fields = valid_fields;
        this.state_steps = res;
    }
}