import debounce from 'lodash/debounce';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ICheckListItem from '../../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckPoint from '../../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import CheckPointVO from '../../../../../shared/modules/CheckList/vos/CheckPointVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import SimpleDatatableField from '../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import VueComponentBase from '../../VueComponentBase';
import CheckListControllerBase from '../CheckListControllerBase';
import './CheckListItemComponent.scss';

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

    private state_steps: { [step_name: string]: number } = {};
    private debounced_update_state_step = debounce(this.update_state_step.bind(this), 100);

    private openmodal(name: string = null, step_id: number = null) {
        if (!this.checklist_item) {
            return;
        }

        if (this.state_steps[name] == this.STATE_DISABLED) {
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

            let checkpoint_description = '<p><strong>' + this.label(checkpoint.name) + '</strong></p>';

            if (checkpoint.item_field_ids && checkpoint.item_field_ids.length) {

                checkpoint_description += '<ul>';
                for (let j in checkpoint.item_field_ids) {
                    let item_field_id = checkpoint.item_field_ids[j];

                    let field: DatatableField<any, any> = this.all_editable_fields.find((e) => e.module_table_field_id == item_field_id);
                    let table_field: ModuleTableField<any> = moduletable.get_field_by_id(field.module_table_field_id);

                    checkpoint_description += this.get_field_text(field, table_field);
                }
                checkpoint_description += '</ul>';
            }

            res[checkpoint.id] = checkpoint_description;
        }

        return res;
    }

    private get_field_text(field: DatatableField<any, any>, table_field: ModuleTableField<any>) {

        let res = field.dataToHumanReadableField(this.checklist_item);
        if ((field.type == SimpleDatatableField.SIMPLE_FIELD_TYPE) && (table_field.field_type == ModuleTableField.FIELD_TYPE_boolean)) {
            if (res) {
                res = this.label("crud.field.boolean.true");
            } else {
                res = this.label("crud.field.boolean.false");
            }
        }
        return '<li>' + this.t(table_field.field_label.code_text) + ' : <strong>' +
            res + '</strong></li>';
    }

    private async archive_item() {
        this.checklist_item.archived = true;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.checklist_item);
        this.$emit('onchangevo', this.checklist_item);
    }

    get item_description(): string {

        if (!this.checklist_item) {
            return null;
        }

        let moduletable = VOsTypesManager.getInstance().moduleTables_by_voType[this.checklist_item._type];

        let checkpoint_description: string = '<ul>';
        for (let j in this.all_editable_fields) {
            let field: DatatableField<any, any> = this.all_editable_fields[j];
            let table_field: ModuleTableField<any> = moduletable.get_field_by_id(field.module_table_field_id);

            checkpoint_description += this.get_field_text(field, table_field);
        }
        checkpoint_description += '</ul>';

        return checkpoint_description;
    }

    get all_editable_fields(): Array<DatatableField<any, any>> {
        return this.checklist_controller.get_ordered_editable_fields();
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
        let res: { [step_name: string]: number } = {};

        for (let i in this.ordered_checkpoints) {
            let checkpoint = this.ordered_checkpoints[i];

            res[checkpoint.name] = await this.checklist_controller.get_state_step(checkpoint.name, this.checklist_item);
        }

        this.state_steps = res;
    }
}