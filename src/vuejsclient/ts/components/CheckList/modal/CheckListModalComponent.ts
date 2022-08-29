import debounce from 'lodash/debounce';
import { Component, Prop, Watch } from 'vue-property-decorator';
import ICheckList from '../../../../../shared/modules/CheckList/interfaces/ICheckList';
import ICheckListItem from '../../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import ICheckPoint from '../../../../../shared/modules/CheckList/interfaces/ICheckPoint';
import CheckPointVO from '../../../../../shared/modules/CheckList/vos/CheckPointVO';
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import VueComponentBase from '../../VueComponentBase';
import CheckListControllerBase from '../CheckListControllerBase';
import "./CheckListModalComponent.scss";

@Component({
    template: require('./CheckListModalComponent.pug')
})
export default class CheckListModalComponent extends VueComponentBase {

    @Prop({ default: null })
    private checklist: ICheckList;

    @Prop({ default: null })
    private checklist_item: ICheckListItem;

    @Prop({ default: null })
    private checkpoint: ICheckPoint;

    @Prop({ default: null })
    private checklist_controller: CheckListControllerBase;

    @Prop({ default: null })
    private ordered_checkpoints: ICheckPoint[];

    private all_steps_done: boolean = false;
    private state_steps: { [step_name: string]: number } = {};
    private debounced_update_state_step = debounce(this.update_state_step.bind(this), 100);

    private valid_fields: { [field_name: string]: boolean } = {};
    private is_last_checklist_item: boolean = false;
    private checkpoint_description: string = null;
    private tooltip_fields: { [field_id: string]: string } = null;
    private finalize_checklist_starting: boolean = false;
    private all_editable_fields: Array<DatatableField<any, any>> = null;

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

    private async update_state_step() {
        this.all_steps_done = false;

        let state_steps: { [step_name: string]: number } = {};
        let is_last_checklist_item: boolean = false;
        let all_steps_done: boolean = true;
        let promises = [];

        if (!this.checklist_controller) {
            return;
        }

        promises.push((async () => {
            this.all_editable_fields = await this.checklist_controller.get_ordered_editable_fields();
        })());

        for (let i in this.ordered_checkpoints) {
            let checkpoint = this.ordered_checkpoints[i];

            promises.push((async () => {
                state_steps[checkpoint.name] = await this.checklist_controller.get_state_step(checkpoint.name, this.checklist_item);
            })());
        }

        await all_promises(promises);

        promises = [];

        let valid_fields: { [field_name: string]: boolean } = {};
        if (this.ordered_checkpoints) {
            // Si on est sur le dernier item, on set la donnée pour pouvoir afficher le bouton de finalisation
            if (this.checkpoint && (this.ordered_checkpoints[(this.ordered_checkpoints.length - 1)].weight == this.checkpoint.weight)) {
                is_last_checklist_item = true;
            }

            for (let name in state_steps) {
                if (state_steps[name] != CheckPointVO.STATE_OK) {
                    all_steps_done = false;
                }

                if (state_steps[name] == CheckPointVO.STATE_DISABLED) {
                    continue;
                }

                let checkpoint: ICheckPoint = this.ordered_checkpoints.find((c) => c.name == name);
                checkpoint.item_field_ids.forEach((item) => valid_fields[item] = true);
            }
        }

        this.is_last_checklist_item = is_last_checklist_item;
        this.valid_fields = valid_fields;
        this.state_steps = state_steps;
        this.all_steps_done = all_steps_done;

        promises.push((async () => {
            this.checkpoint_description = await this.get_checkpoint_description();
        })());
        promises.push((async () => {
            this.tooltip_fields = await this.get_tooltip_fields();
        })());

        await all_promises(promises);
    }

    private async get_checkpoint_description(): Promise<string> {
        if (!this.checkpoint) {
            return null;
        }

        return this.checklist_controller.get_step_description(this.checkpoint, this.checklist_item);
    }

    private async get_tooltip_fields(): Promise<{ [field_id: string]: string }> {
        if (!this.checkpoint) {
            return null;
        }

        return this.checklist_controller.get_tooltip_fields(this.checkpoint, this.checklist_item);
    }

    private async finalize_checklist() {
        if (this.finalize_checklist_starting) {
            return;
        }

        this.snotify.async(this.label('checklist.finalize.start'), () =>
            new Promise(async (resolve, reject) => {

                this.finalize_checklist_starting = true;

                let res: boolean = await this.checklist_controller.finalize_checklist(this.checklist_item);

                if (res) {
                    resolve({
                        body: this.label('checklist.finalize.ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });

                } else {
                    reject({
                        body: this.label('checklist.finalize.failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }

                this.finalize_checklist_starting = false;

                this.$emit('finalize', this.checklist_item, res);
            })
        );
    }

    private get_class_cp(cp: ICheckPoint): string[] {
        let res: string[] = [];

        if (this.checkpoint && (this.checkpoint.id == cp.id)) {
            res.push('active');
        }

        switch (this.state_steps[cp.name]) {
            case CheckPointVO.STATE_DISABLED:
                res.push("text-muted");
                break;
            case CheckPointVO.STATE_TODO:
                res.push("text-default");
                break;
            case CheckPointVO.STATE_ERROR:
                res.push("text-danger");
                break;
            case CheckPointVO.STATE_WARN:
                res.push("text-warning");
                break;
            case CheckPointVO.STATE_OK:
                res.push("text-success");
                break;
            default:
                res.push("text-default");
                break;
        }

        return res;
    }

    private change_checkpoint(cp: ICheckPoint) {
        if (this.state_steps[cp.name] == CheckPointVO.STATE_DISABLED) {
            return;
        }

        if (this.checkpoint && (cp.id == this.checkpoint.id)) {
            return;
        }

        this.$emit('changecheckpoint', cp);
    }

    get editable_fields(): Array<DatatableField<any, any>> {

        if (!this.checkpoint) {
            let max_fields: Array<DatatableField<any, any>> = [];

            for (let valid_field_name in this.valid_fields) {
                let editable_field = this.all_editable_fields.find((ef) => ef.datatable_field_uid == valid_field_name);

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

            if (this.checkpoint.item_field_ids.indexOf(editable_field.datatable_field_uid) >= 0) {
                if (this.checkpoint.item_fields_tooltip) {
                    res.push(editable_field.set_tooltip(this.checkpoint.item_fields_tooltip + '.' + editable_field.datatable_field_uid));

                } else {
                    res.push(editable_field);
                }
            }
        }
        return res;
    }
}