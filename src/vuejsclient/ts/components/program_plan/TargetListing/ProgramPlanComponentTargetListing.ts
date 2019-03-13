import { Component, Prop } from 'vue-property-decorator';
import IPlanTarget from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import VueComponentBase from '../../VueComponentBase';
import ProgramPlanComponentRDV from '../RDV/ProgramPlanComponentRDV';
import IPlanEnseigne from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';
import './ProgramPlanComponentTargetListing.scss';

@Component({
    template: require('./ProgramPlanComponentTargetListing.pug'),
    components: {
        "program-plan-component-rdv": ProgramPlanComponentRDV
    }
})
export default class ProgramPlanComponentTargetListing extends VueComponentBase {

    @Prop()
    private targets: IPlanTarget[];
    @Prop()
    private enseignes: IPlanEnseigne[];

    private filtre_etablissement = null;

    private width: number = 250;
    private height: number = 405;
    private nb_targets: number = Math.floor((this.height - 85) / 40);

    get filtered_ordered_targets(): IPlanTarget[] {
        let res: IPlanTarget[] = [];
        let tester = (this.filtre_etablissement ? new RegExp('.*' + this.filtre_etablissement + '.*', 'i') : new RegExp('.*', 'i'));
        let limit: number = 100;

        for (let i in this.targets) {
            if (tester.test(this.targets[i].name)) {
                res.push(this.targets[i]);
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
        if ((!target) || (!target.enseigne_id) || (!this.enseignes)) {
            return null;
        }

        return this.enseignes[target.enseigne_id];
    }

    private onResize(x, y, width, height) {
        this.width = width;
        this.height = height;

        (this.$refs.droppable_targets as any).style.maxHeight = "" + (this.height - 85) + "px";

        this.nb_targets = Math.floor((this.height - 85) / 40);
    }
}