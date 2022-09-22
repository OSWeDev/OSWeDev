import { Component, Watch } from 'vue-property-decorator';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../../store/VarStore';
import { ModuleVarsDatasExplorerVuexGetter } from '../VarsDatasExplorerVuexStore';
import './VarsDatasExplorerVisualizationComponent.scss';

@Component({
    template: require('./VarsDatasExplorerVisualizationComponent.pug'),
})
export default class VarsDatasExplorerVisualizationComponent extends VueComponentBase {

    @ModuleVarsDatasExplorerVuexGetter
    private get_filtered_datas: { [index: string]: VarDataBaseVO };

    @ModuleVarGetter
    private getDescSelectedVarParam: VarDataBaseVO;
    @ModuleVarAction
    private setDescSelectedVarParam: (desc_selected_var_param: VarDataBaseVO) => void;

    private param_index: string = null;

    @Watch('getDescSelectedVarParam', { immediate: true })
    private onchange_getDescSelectedVarParam() {
        this.param_index = this.getDescSelectedVarParam ? this.getDescSelectedVarParam.index : null;
        console.log(this.get_filtered_datas);
    }

    private param_from_index() {
        if (!this.param_index) {
            return;
        }

        let var_param = VarDataBaseVO.from_index(this.param_index);

        if (!var_param) {
            ConsoleHandler.getInstance().error('param_from_index:failed param reconstruction:' + this.param_index + ':');
            return;
        }

        this.setDescSelectedVarParam(var_param);
    }

}
