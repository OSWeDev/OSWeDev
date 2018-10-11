import { Component, Prop } from 'vue-property-decorator';
import IPlanTarget from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTarget';
import VueComponentBase from '../../VueComponentBase';
import ProgramPlanComponentRDV from '../RDV/ProgramPlanComponentRDV';
import IPlanEnseigne from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanEnseigne';

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

    private isOpen = false;
    private filtre_boutiques = null;

    get filtered_ordered_targets(): IPlanTarget[] {
        let res: IPlanTarget[] = [];
        let tester = (this.filtre_boutiques ? new RegExp('.*' + this.filtre_boutiques + '.*', 'i') : new RegExp('.*', 'i'));

        for (let i in this.targets) {
            if (tester.test(this.targets[i].name)) {
                res.push(this.targets[i]);
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

        if (res.length > 9) {
            res.splice(9, res.length - 9);
        }

        return res;
    }

    private getEnseigneForTarget(target: IPlanTarget): IPlanEnseigne {
        if ((!target) || (!target.enseigne_id) || (!this.enseignes)) {
            return null;
        }

        return this.enseignes[target.enseigne_id];
    }
}