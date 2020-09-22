import { Component } from 'vue-property-decorator';
import 'vue-tables-2';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VarDataValueResVO from '../../../../../../shared/modules/Var/vos/VarDataValueResVO';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import VarDescRegistrationsComponent from '../desc/registrations/VarDescRegistrationsComponent';
import './VarsManagerComponent.scss';

@Component({
    template: require('./VarsManagerComponent.pug'),
    components: {
        "var-desc-registrations": VarDescRegistrationsComponent,
        // "perfmon-funcstats": () => import(/* webpackChunkName: "FuncStatsComponent" */ '../../../PerfMon/components/funcStats/FuncStatsComponent')
    }
})
export default class VarsManagerComponent extends VueComponentBase {
    @ModuleVarGetter
    private getVarDatas: { [paramIndex: string]: VarDataValueResVO };
    @ModuleVarGetter
    private isWaiting: boolean;
    @ModuleVarGetter
    private isStepping: boolean;
    @ModuleVarGetter
    private isDescMode: boolean;
    @ModuleVarGetter
    private isDescOpened: boolean;
    @ModuleVarGetter
    private isDescRegistrationsOpened: boolean;
    @ModuleVarGetter
    private isDescFuncStatsOpened: boolean;

    @ModuleVarAction
    private setVarData: (varData: VarDataBaseVO) => void;
    @ModuleVarAction
    private setVarsData: (varsData: VarDataBaseVO[]) => void;
    @ModuleVarAction
    private removeVarData: (varDataParam: VarDataBaseVO) => void;
    @ModuleVarAction
    private setIsStepping: (is_stepping: boolean) => void;
    @ModuleVarAction
    private setIsWaiting: (is_waiting: boolean) => void;
    @ModuleVarAction
    private setStepNumber: (step_number: number) => void;

    @ModuleVarAction
    private set_dependencies_heatmap_version: (dependencies_heatmap_version: number) => void;



    @ModuleVarGetter
    private getDescSelectedVarParam: VarDataBaseVO;
    @ModuleVarAction
    private setDescFuncStatsOpened: (desc_funcstats_opened: boolean) => void;
    @ModuleVarAction
    private setDescOpened: (desc_opened: boolean) => void;
    @ModuleVarAction
    private setDescMode: (desc_mode: boolean) => void;
    @ModuleVarAction
    private setDescRegistrationsOpened: (desc_registrations_opened: boolean) => void;

    public mounted() { }

    private async switchDescMode() {
        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleVar.POLICY_DESC_MODE_ACCESS)) {
            return;
        }

        this.setDescMode(!this.isDescMode);
    }
}