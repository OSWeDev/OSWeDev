import { Component, Prop } from 'vue-property-decorator';
import IPlanRDV from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import VueFieldComponent from '../../field/field';
import VueComponentBase from '../../VueComponentBase';
import ProgramPlanComponentModalCR from './cr/ProgramPlanComponentModalCR';
import ProgramPlanComponentModalPrep from './prep/ProgramPlanComponentModalPrep';
import "./ProgramPlanComponentModal.scss";
import ProgramPlanComponentModalTargetInfos from './target_infos/ProgramPlanComponentModalTargetInfos';
import ProgramPlanComponentModalHistoric from './historic/ProgramPlanComponentModalHistoric';
import { ModuleProgramPlanGetter } from '../store/ProgramPlanStore';
import IPlanTask from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTask';

@Component({
    template: require('./ProgramPlanComponentModal.pug'),
    components: {
        field: VueFieldComponent,
        ProgramPlanComponentModalTargetInfos,
        ProgramPlanComponentModalCR,
        ProgramPlanComponentModalPrep,
        ProgramPlanComponentModalHistoric
    }
})
export default class ProgramPlanComponentModal extends VueComponentBase {

    @ModuleProgramPlanGetter
    public selected_rdv: IPlanRDV;

    @ModuleProgramPlanGetter
    public get_tasks_by_ids: { [id: number]: IPlanTask };

    private active_view: string = 'rdv_target_infos';

    get is_facilitator_specific(): boolean {

        if (!this.selected_rdv) {
            return false;
        }

        if (!this.get_tasks_by_ids[this.selected_rdv.task_id]) {
            return false;
        }

        return this.get_tasks_by_ids[this.selected_rdv.task_id].is_facilitator_specific;
    }

    private set_active_view(view: string) {
        this.active_view = view;
    }
}