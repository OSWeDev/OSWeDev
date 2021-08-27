import { Component } from 'vue-property-decorator';
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleVar from '../../../../../../shared/modules/Var/ModuleVar';
import VarDataBaseVO from '../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../store/VarStore';
import './VarsManagerComponent.scss';

@Component({
    template: require('./VarsManagerComponent.pug'),
    components: {
        //"var-desc-registrations": VarDescRegistrationsComponent,
        Varsdatasexplorercomponent: () => import(/* webpackChunkName: "VarsDatasExplorerComponent" */ '../explorer/VarsDatasExplorerComponent'),
        Draggablewindowcomponent: () => import(/* webpackChunkName: "DraggableWindowComponent" */ '../../../draggable_window/DraggableWindowComponent'),

        // "perfmon-funcstats": () => import(/* webpackChunkName: "FuncStatsComponent" */ '../../../PerfMon/components/funcStats/FuncStatsComponent')
    }
})
export default class VarsManagerComponent extends VueComponentBase {
    @ModuleVarGetter
    private get_desc_selected_var_param_historic: VarDataBaseVO[];
    @ModuleVarAction
    private set_desc_selected_var_param_historic_i: (desc_selected_var_param_historic_i: number) => void;
    @ModuleVarGetter
    private get_desc_selected_var_param_historic_i: number;
    @ModuleVarGetter
    private isDescMode: boolean;
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
    private set_dependencies_heatmap_version: (dependencies_heatmap_version: number) => void;



    @ModuleVarGetter
    private getDescSelectedVarParam: VarDataBaseVO;
    @ModuleVarAction
    private setDescSelectedVarParam: (desc_selected_var_param: VarDataBaseVO) => void;
    @ModuleVarAction
    private setDescFuncStatsOpened: (desc_funcstats_opened: boolean) => void;
    @ModuleVarAction
    private setDescMode: (desc_mode: boolean) => void;
    @ModuleVarAction
    private setDescRegistrationsOpened: (desc_registrations_opened: boolean) => void;

    private width_var_desc: number = 448;
    private height_var_desc: number = 840;
    private opened_width_var_desc: number = 448;
    private opened_height_var_desc: number = 840;
    private closed_width_var_desc: number = 448;
    private closed_height_var_desc: number = 37;
    private unusable_height_var_desc: number = this.closed_height_var_desc;

    private opened_minh_var_desc: number = 115;
    private opened_minw_var_desc: number = 448;
    private minh_var_desc: number = this.opened_minh_var_desc;
    private minw_var_desc: number = this.opened_minw_var_desc;
    private closed_minh_var_desc: number = this.closed_height_var_desc;
    private closed_minw_var_desc: number = this.closed_width_var_desc;

    private initialx_var_desc: number = 70;
    private initialy_var_desc: number = 56;
    private opened_var_desc: boolean = true;

    private has_access_desc_mode: boolean = false;

    public async mounted() {
        this.has_access_desc_mode = await ModuleAccessPolicy.getInstance().checkAccess(ModuleVar.POLICY_DESC_MODE_ACCESS);
    }

    private async switchDescMode() {
        if (!this.has_access_desc_mode) {
            return;
        }

        this.setDescMode(!this.isDescMode);
    }

    get can_undo(): boolean {
        if (this.get_desc_selected_var_param_historic && this.get_desc_selected_var_param_historic.length && this.get_desc_selected_var_param_historic_i) {
            return true;
        }
        return false;
    }

    private undo() {
        if (!this.can_undo) {
            return;
        }
        let i = this.get_desc_selected_var_param_historic_i - 1;
        this.set_desc_selected_var_param_historic_i(this.get_desc_selected_var_param_historic_i - 2);
        this.setDescSelectedVarParam(this.get_desc_selected_var_param_historic[i]);
    }

    get can_redo(): boolean {
        if (this.get_desc_selected_var_param_historic && this.get_desc_selected_var_param_historic.length &&
            (this.get_desc_selected_var_param_historic_i < (this.get_desc_selected_var_param_historic.length - 1))) {
            return true;
        }
        return false;
    }

    private redo() {
        if (!this.can_redo) {
            return;
        }
        this.setDescSelectedVarParam(this.get_desc_selected_var_param_historic[this.get_desc_selected_var_param_historic_i + 1]);
    }
}