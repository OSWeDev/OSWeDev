import { Component, Prop } from 'vue-property-decorator';
import IPlanRDV from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import IPlanTask from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanTask';
import ModuleProgramPlanBase from '../../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';
import VueFieldComponent from '../../field/field';
import VueComponentBase from '../../VueComponentBase';
import ProgramPlanControllerBase from '../ProgramPlanControllerBase';
import { ModuleProgramPlanGetter } from '../store/ProgramPlanStore';
import ProgramPlanComponentModalCR from './cr/ProgramPlanComponentModalCR';
import ProgramPlanComponentModalHistoric from './historic/ProgramPlanComponentModalHistoric';
import ProgramPlanComponentModalPrep from './prep/ProgramPlanComponentModalPrep';
import "./ProgramPlanComponentModal.scss";
import ProgramPlanComponentModalTargetInfos from './target_infos/ProgramPlanComponentModalTargetInfos';

@Component({
    template: require('./ProgramPlanComponentModal.pug'),
    components: {
        field: VueFieldComponent,
        Programplancomponentmodaltargetinfos: ProgramPlanComponentModalTargetInfos,
        Programplancomponentmodalcr: ProgramPlanComponentModalCR,
        Programplancomponentmodalprep: ProgramPlanComponentModalPrep,
        Programplancomponentmodalhistoric: ProgramPlanComponentModalHistoric
    }
})
export default class ProgramPlanComponentModal extends VueComponentBase {

    @ModuleProgramPlanGetter
    public selected_rdv: IPlanRDV;

    @ModuleProgramPlanGetter
    public get_tasks_by_ids: { [id: number]: IPlanTask };

    @Prop({ default: null })
    private program_plan_shared_module: ModuleProgramPlanBase;

    @Prop({ default: null })
    private program_plan_controller: ProgramPlanControllerBase;

    private active_view: string = 'rdv_target_infos';

    get has_prep() {
        return !!this.program_plan_shared_module.rdv_prep_type_id;
    }

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