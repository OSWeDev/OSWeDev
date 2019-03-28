import { Component, Prop } from 'vue-property-decorator';
import IPlanRDV from '../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDV';
import VueFieldComponent from '../../field/field';
import VueComponentBase from '../../VueComponentBase';
import ProgramPlanComponentModalCR from './cr/ProgramPlanComponentModalCR';
import ProgramPlanComponentModalPrep from './prep/ProgramPlanComponentModalPrep';
import "./ProgramPlanComponentModal.scss";
import ProgramPlanComponentModalTargetInfos from './target_infos/ProgramPlanComponentModalTargetInfos';
import ProgramPlanComponentModalHistoric from './historic/ProgramPlanComponentModalHistoric';

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

    @Prop({
        default: null
    })
    private selected_rdv: IPlanRDV;
    @Prop({
        default: false
    })
    private can_edit: boolean;

    private active_view: string = 'rdv_target_infos';

    private set_active_view(view: string) {
        this.active_view = view;
    }
}