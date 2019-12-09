import { Component } from 'vue-property-decorator';
import 'vue-tables-2';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import IVarDataParamVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataParamVOBase';
import IVarDataVOBase from '../../../../../../shared/modules/Var/interfaces/IVarDataVOBase';
import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarsController from '../../../../../../shared/modules/Var/VarsController';
import FuncStatsComponent from '../../../PerfMon/components/funcStats/FuncStatsComponent';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import VarDescRegistrationsComponent from '../desc/registrations/VarDescRegistrationsComponent';
import './VarsManagerComponent.scss';
import moment = require('moment');

@Component({
    template: require('./VarsManagerComponent.pug'),
    components: {
        "var-desc-registrations": VarDescRegistrationsComponent,
        "perfmon-funcstats": FuncStatsComponent
    }
})
export default class VarsManagerComponent extends VueComponentBase {
    @ModuleVarGetter
    public getVarDatas: { [paramIndex: string]: IVarDataVOBase };
    @ModuleVarGetter
    public isUpdating: boolean;
    @ModuleVarGetter
    public isWaiting: boolean;
    @ModuleVarGetter
    public isStepping: boolean;
    @ModuleVarGetter
    public isDescMode: boolean;
    @ModuleVarGetter
    public isDescOpened: boolean;
    @ModuleVarGetter
    public isDescRegistrationsOpened: boolean;
    @ModuleVarGetter
    public isDescFuncStatsOpened: boolean;
    @ModuleVarGetter
    public getDescSelectedIndex: string;
    @ModuleVarGetter
    public getUpdatingParamsByVarsIds: { [index: string]: boolean };

    @ModuleVarAction
    public setVarData: (varData: IVarDataVOBase) => void;
    @ModuleVarAction
    public setVarsData: (varsData: IVarDataVOBase[]) => void;
    @ModuleVarAction
    public removeVarData: (varDataParam: IVarDataParamVOBase) => void;
    @ModuleVarAction
    public setIsStepping: (is_stepping: boolean) => void;
    @ModuleVarAction
    public setIsUpdating: (is_updating: boolean) => void;
    @ModuleVarAction
    public setIsWaiting: (is_waiting: boolean) => void;
    @ModuleVarAction
    public setDescMode: (desc_mode: boolean) => void;
    @ModuleVarAction
    public setDescOpened: (desc_opened: boolean) => void;
    @ModuleVarAction
    public setDescRegistrationsOpened: (desc_registrations_opened: boolean) => void;
    @ModuleVarAction
    public setDescFuncStatsOpened: (desc_funcstats_opened: boolean) => void;
    @ModuleVarAction
    public setUpdatingParamsByVarsIds: (updating_params_by_vars_ids: { [index: string]: boolean }) => void;
    @ModuleVarAction
    public setStepNumber: (step_number: number) => void;

    @ModuleVarAction
    public set_dependencies_heatmap_version: (dependencies_heatmap_version: number) => void;


    public mounted() {
        VarsController.getInstance().registerStoreHandlers(
            this.getVarDatas, this.setVarsData, this.setIsUpdating,
            this.getUpdatingParamsByVarsIds, this.setUpdatingParamsByVarsIds, this.setIsStepping,
            this.setIsWaiting, this.setStepNumber, this.set_dependencies_heatmap_version);
    }

    /**
     * ATTENTION FIXME DIRTY ne marche que si on a soit une var registered sélectionnée, soit une var qui a une data (et qui est donc registered a priori)
     */
    get selected_param(): IVarDataParamVOBase {
        return (!!this.getDescSelectedIndex) ?
            ((!!VarsController.getInstance().varDAG.nodes[this.getDescSelectedIndex]) ?
                VarsController.getInstance().varDAG.nodes[this.getDescSelectedIndex].param :
                VarsController.getInstance().getVarData[this.getDescSelectedIndex]) : null;
    }

    private async switchDescMode() {
        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleVar.POLICY_DESC_MODE_ACCESS)) {
            return;
        }

        this.setDescMode(!this.isDescMode);
    }
}