import { Component, Prop, Watch } from 'vue-property-decorator';
import IPlanEnseigne from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import IPlanTarget from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import IPlanTask from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTask';
import IPlanTaskType from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTaskType';
import ModuleProgramPlanBase from '../../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
import VueComponentBase from '../../VueComponentBase';
import ProgramPlanControllerBase from '../ProgramPlanControllerBase';
import ProgramPlanComponentRDV from '../RDV/ProgramPlanComponentRDV';
import { ModuleProgramPlanGetter } from '../store/ProgramPlanStore';
import './ProgramPlanComponentTargetListing.scss';

@Component({
    template: require('./ProgramPlanComponentTargetListing.pug'),
    components: {
        "program-plan-component-rdv": ProgramPlanComponentRDV
    }
})
export default class ProgramPlanComponentTargetListing extends VueComponentBase {

    @ModuleProgramPlanGetter
    public getTargetsByIds: { [id: number]: IPlanTarget };

    @ModuleProgramPlanGetter
    public getEnseignesByIds: { [id: number]: IPlanEnseigne };

    @ModuleProgramPlanGetter
    public get_task_types_by_ids: { [id: number]: IPlanTaskType };

    @ModuleProgramPlanGetter
    public get_tasks_by_ids: { [id: number]: IPlanTask };

    @Prop({ default: null })
    private program_plan_shared_module: ModuleProgramPlanBase;

    @Prop({ default: null })
    private program_plan_controller: ProgramPlanControllerBase;

    private filtre_etablissement = null;

    private width: number = 250;
    private height: number = 395;
    private opened_width: number = 250;
    private opened_height: number = 395;
    private filter_height: number = 26;
    private closed_width: number = 100;
    private closed_height: number = 49;
    private unusable_height: number = this.filter_height + this.closed_height;
    private target_height: number = 40;

    private opened_minh: number = 115;
    private opened_minw: number = 250;
    private minh: number = this.opened_minh;
    private minw: number = this.opened_minw;
    private closed_minh: number = this.closed_height;
    private closed_minw: number = this.closed_width;

    private nb_targets: number = Math.floor((this.height - this.unusable_height) / this.target_height);
    private initialx: number = window.innerWidth - this.width - 10;
    private opened: boolean = true;

    get use_targets(): boolean {
        return !this.program_plan_shared_module.task_type_id;
    }

    get filtered_ordered_targets(): IPlanTarget[] {
        const res: IPlanTarget[] = [];
        const tester = (this.filtre_etablissement ? new RegExp('.*' + this.filtre_etablissement + '.*', 'i') : new RegExp('.*', 'i'));
        const limit: number = 100;

        for (const i in this.getTargetsByIds) {
            if (tester.test(this.getTargetsByIds[i].name)) {
                res.push(this.getTargetsByIds[i]);
            }

            if (res.length >= limit) {
                break;
            }
        }

        res.sort((a: IPlanTarget, b: IPlanTarget): number => {
            if (a.name < b.name) {
                return -1;
            }
            if (a.name > b.name) {
                return 1;
            }
            return 0;
        });

        if (res.length > this.nb_targets) {
            res.splice(this.nb_targets, res.length - this.nb_targets);
        }

        return res;
    }

    private getEnseigneForTarget(target: IPlanTarget): IPlanEnseigne {
        if ((!target) || (!target.enseigne_id) || (!this.getEnseignesByIds)) {
            return null;
        }

        return this.getEnseignesByIds[target.enseigne_id];
    }

    @Watch('opened')
    private onOpenClose() {
        if (this.opened) {

            this.width = this.opened_width;
            this.height = this.opened_height;

            this.minh = this.opened_minh;
            this.minw = this.opened_minw;

            (this.$refs.droppable_targets as any).style.maxHeight = "" + (this.height - this.unusable_height) + "px";
            this.nb_targets = Math.floor((this.height - this.unusable_height) / this.target_height);
        } else {

            this.width = this.closed_width;
            this.height = this.closed_height;

            this.minh = this.closed_minh;
            this.minw = this.closed_minw;

            (this.$refs.droppable_targets as any).style.maxHeight = "0px";
            this.nb_targets = 0;
        }

        (this.$refs.external_events as any).width = this.width;
        (this.$refs.external_events as any).height = this.height;

        (this.$refs.external_events as any).style.width = "" + this.width + "px";
        (this.$refs.external_events as any).style.height = "" + this.height + "px";

        (this.$refs.external_events as any).elmH = this.height;
        (this.$refs.external_events as any).elmW = this.width;
    }

    private onResize(x, y, width, height) {

        if (!this.opened) {
            return;
        }

        if ((this.width == width) && (this.height == height)) {
            return;
        }

        this.width = width ? width : this.width;
        this.height = height ? height : this.height;
        this.opened_width = this.width;
        this.opened_height = this.height;

        (this.$refs.droppable_targets as any).style.maxHeight = "" + (this.height - this.unusable_height) + "px";
        this.nb_targets = Math.floor((this.height - this.unusable_height) / this.target_height);
    }

    get filtered_ordered_tasks_or_tasks_types(): Array<IPlanTask | IPlanTaskType> {
        const res: Array<IPlanTask | IPlanTaskType> = [];
        const tester = (this.filtre_etablissement ? new RegExp('.*' + this.filtre_etablissement + '.*', 'i') : new RegExp('.*', 'i'));

        const ordered_task_types: IPlanTaskType[] = WeightHandler.getInstance().getSortedListFromWeightedVosByIds(this.get_task_types_by_ids);
        for (const i in ordered_task_types) {
            const ordered_task_type = ordered_task_types[i];

            if (ordered_task_type.order_tasks_on_same_target) {
                if (tester.test(ordered_task_type.name)) {
                    res.push(ordered_task_type);
                }

                continue;
            }

            const task_type_tasks: IPlanTask[] = [];
            for (const j in this.get_tasks_by_ids) {
                const task_ = this.get_tasks_by_ids[j];

                if (task_.task_type_id == ordered_task_type.id) {

                    if (tester.test(task_.name)) {
                        task_type_tasks.push(task_);
                    }
                }
            }
            WeightHandler.getInstance().sortByWeight(task_type_tasks);

            for (const j in task_type_tasks) {
                res.push(task_type_tasks[j]);
            }
        }

        if (res.length > this.nb_targets) {
            res.splice(this.nb_targets, res.length - this.nb_targets);
        }

        return res;
    }
}