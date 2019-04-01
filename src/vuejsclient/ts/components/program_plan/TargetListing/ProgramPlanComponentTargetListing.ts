import { Component, Prop } from 'vue-property-decorator';
import IPlanTarget from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import VueComponentBase from '../../VueComponentBase';
import ProgramPlanComponentRDV from '../RDV/ProgramPlanComponentRDV';
import IPlanEnseigne from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import './ProgramPlanComponentTargetListing.scss';
import { ModuleProgramPlanGetter } from '../store/ProgramPlanStore';
import IPlanTaskType from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTaskType';
import IPlanTask from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTask';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
import ModuleProgramPlanBase from '../../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';

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

    private filtre_etablissement = null;

    private width: number = 250;
    private height: number = 395;
    private unusable_height: number = 75;
    private target_height: number = 40;
    private nb_targets: number = Math.floor((this.height - this.unusable_height) / this.target_height);

    get use_targets(): boolean {
        return !ModuleProgramPlanBase.getInstance().task_type_id;
    }

    get filtered_ordered_targets(): IPlanTarget[] {
        let res: IPlanTarget[] = [];
        let tester = (this.filtre_etablissement ? new RegExp('.*' + this.filtre_etablissement + '.*', 'i') : new RegExp('.*', 'i'));
        let limit: number = 100;

        for (let i in this.getTargetsByIds) {
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

    private onResize(x, y, width, height) {
        this.width = width;
        this.height = height;

        (this.$refs.droppable_targets as any).style.maxHeight = "" + (this.height - this.unusable_height) + "px";

        this.nb_targets = Math.floor((this.height - this.unusable_height) / this.target_height);
    }

    get filtered_ordered_tasks_or_tasks_types(): Array<IPlanTask | IPlanTaskType> {
        let res: Array<IPlanTask | IPlanTaskType> = [];

        let ordered_task_types: IPlanTaskType[] = WeightHandler.getInstance().getSortedListFromWeightedVosByIds(this.get_task_types_by_ids);
        for (let i in ordered_task_types) {
            let ordered_task_type = ordered_task_types[i];

            if (ordered_task_type.order_tasks_on_same_target) {
                res.push(ordered_task_type);
                continue;
            }

            let task_type_tasks: IPlanTask[] = [];
            for (let j in this.get_tasks_by_ids) {
                let task_ = this.get_tasks_by_ids[j];

                if (task_.task_type_id == ordered_task_type.id) {
                    task_type_tasks.push(task_);
                }
            }
            WeightHandler.getInstance().sortByWeight(task_type_tasks);

            for (let j in task_type_tasks) {
                res.push(task_type_tasks[j]);
            }
        }

        return res;
    }
}