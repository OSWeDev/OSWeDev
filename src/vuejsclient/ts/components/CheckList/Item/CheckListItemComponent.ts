import debounce from 'lodash/debounce';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ICheckListItem from '../../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckPoint from '../../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import CheckPointVO from '../../../../../shared/modules/CheckList/vos/CheckPointVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import SimpleDatatableFieldVO from '../../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import ModuleTableField from '../../../../../shared/modules/ModuleTableField';
import { VOsTypesManager } from '../../../../../shared/modules/VO/manager/VOsTypesManager';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
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

    @Prop({ default: null })
    private global_route_path: string;

    @Prop({ default: null })
    private checklist_item: ICheckListItem;

    @Prop({ default: null })
    private ordered_checkpoints: ICheckPoint[];

    @Prop({ default: null })
    private hide_item_description: boolean;

    private infos_cols_content: string[] = [];
    private state_steps: { [step_name: string]: number } = {};
    private debounced_update_state_step = debounce(this.update_state_step.bind(this), 100);
    private checkpoint_descriptions: { [step_id: number]: string } = {};
    private all_editable_fields: Array<DatatableField<any, any>> = null;

    private openmodal(checkpoint) {

        if (!checkpoint) {
            this.$emit('openmodal', this.checklist_item, null);
            return;
        }

        let name: string = checkpoint.name;
        let step_id: number = checkpoint.id;

        if (!this.checklist_item) {
            return;
        }

        if (this.state_steps[name] == this.STATE_DISABLED) {
            return;
        }

        if (!this.global_route_path) {
            this.$emit('openmodal', this.checklist_item, checkpoint);
            return;
        }

        this.$router.push(step_id ?
            this.global_route_path + '/' + this.checklist_item.checklist_id + '/' + this.checklist_item.id + '/' + step_id :
            this.global_route_path + '/' + this.checklist_item.checklist_id + '/' + this.checklist_item.id);
    }

    private get_field_text(field: DatatableField<any, any>, table_field: ModuleTableField<any>) {

        let res = field.dataToHumanReadableField(this.checklist_item);

        if (!table_field) {
            return null;
        }

        if ((field.type == SimpleDatatableFieldVO.SIMPLE_FIELD_TYPE) && (table_field.field_type == ModuleTableField.FIELD_TYPE_boolean)) {
            if (res == null) {
                res = '';
            } else if (res && res == "true") {
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
        let res = await ModuleDAO.getInstance().insertOrUpdateVO(this.checklist_item);

        if ((!res) || (!res.id)) {
            this.snotify.error(this.label('CheckListItemComponent.archive_item.failed'));
        }
        this.$emit('onchangevo', this.checklist_item);
    }

    get item_description(): string {

        if (!this.checklist_item) {
            return null;
        }

        if (!!this.hide_item_description) {
            return null;
        }

        let moduletable = VOsTypesManager.moduleTables_by_voType[this.checklist_item._type];

        let checkpoint_description: string = '<ul>';
        for (let j in this.all_editable_fields) {
            let field: DatatableField<any, any> = this.all_editable_fields[j];
            let table_field: ModuleTableField<any> = moduletable.get_field_by_id(field.module_table_field_id);

            checkpoint_description += this.get_field_text(field, table_field);
        }
        checkpoint_description += '</ul>';

        return checkpoint_description;
    }

    get checkpoints_editable_fields(): { [step_id: number]: Array<DatatableField<any, any>> } {

        if (!this.checklist_item) {
            return {};
        }

        let res: { [step_id: number]: Array<DatatableField<any, any>> } = {};

        for (let i in this.ordered_checkpoints) {
            let checkpoint = this.ordered_checkpoints[i];

            let checkpoint_editable_fields: Array<DatatableField<any, any>> = [];

            if (checkpoint.item_field_ids && checkpoint.item_field_ids.length) {

                for (let j in checkpoint.item_field_ids) {
                    let item_field_id = checkpoint.item_field_ids[j];

                    let field: DatatableField<any, any> = this.all_editable_fields.find((e) => e.module_table_field_id == item_field_id);
                    checkpoint_editable_fields.push(field);
                }
            }

            res[checkpoint.id] = checkpoint_editable_fields;
        }

        return res;
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

        let promises = [];
        let self = this;

        this.all_editable_fields = await this.checklist_controller.get_ordered_editable_fields();

        for (let i in this.ordered_checkpoints) {
            let checkpoint = this.ordered_checkpoints[i];

            promises.push((async () => {
                res[checkpoint.name] = await self.checklist_controller.get_state_step(checkpoint.name, self.checklist_item);
            })());
        }

        this.state_steps = res;
        this.infos_cols_content = this.checklist_controller.get_infos_cols_content(this.checklist_item);

        promises.push((async () => {
            self.checkpoint_descriptions = await self.get_checkpoint_descriptions();
        })());

        await all_promises(promises);
    }

    private async get_checkpoint_descriptions(): Promise<{ [step_id: number]: string }> {

        if (!this.checklist_item) {
            return {};
        }

        let res: { [step_id: number]: string } = {};
        let moduletable = VOsTypesManager.moduleTables_by_voType[this.checklist_item._type];

        for (let i in this.ordered_checkpoints) {
            let checkpoint = this.ordered_checkpoints[i];

            let checkpoint_description = '<p><strong>' + this.label(checkpoint.name) + '</strong></p>';

            let step_description = await this.checklist_controller.get_step_description(checkpoint, this.checklist_item);
            if (step_description) {
                checkpoint_description += step_description;
            }

            if (checkpoint.item_field_ids && checkpoint.item_field_ids.length) {

                checkpoint_description += '<ul>';
                for (let j in this.checkpoints_editable_fields[checkpoint.id]) {
                    let field: DatatableField<any, any> = this.checkpoints_editable_fields[checkpoint.id][j];

                    if (field) {
                        let table_field: ModuleTableField<any> = moduletable.get_field_by_id(field.module_table_field_id);

                        checkpoint_description += this.get_field_text(field, table_field);
                    }
                }
                checkpoint_description += '</ul>';
            }

            res[checkpoint.id] = checkpoint_description;
        }

        return res;
    }
}