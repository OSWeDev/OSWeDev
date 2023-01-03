import { Component, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../../../../shared/tools/PromiseTools';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../../store/VarStore';
import VarsClientController from '../../../VarsClientController';
import { ModuleVarsDatasExplorerVuexAction, ModuleVarsDatasExplorerVuexGetter } from '../VarsDatasExplorerVuexStore';
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
    @ModuleVarsDatasExplorerVuexAction
    private set_filtered_datas: (filtered_datas: { [index: string]: VarDataBaseVO }) => void;

    private param_index: string = null;
    private multi_param_index: string = null;
    private display_data: boolean = false;
    private errors_data: string[] = null; //Ligne correspondant à l'index erroné.

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

    private async display_all_index() {

        //Si le champs est vide ou incohérent, on réinitialise les résultats.
        if (this.multi_param_index == null) {
            this.set_filtered_datas({});
            this.errors_data = null;
            this.display_data = false;
            return;
        }

        let each_line_of_textarea: string[] = this.multi_param_index.split('\n');
        let var_param_by_index: { [index: string]: VarDataBaseVO } = {};
        let errors: string[] = [];

        each_line_of_textarea.forEach((index: string) => {
            if (!index || !index.length) {
                return;
            }

            let var_param = VarDataBaseVO.from_index(index);

            if (var_param) {
                var_param_by_index[index] = var_param;
            } else {
                errors.push(index);
            }
        });

        this.errors_data = errors;
        this.display_data = true;
        this.set_filtered_datas(var_param_by_index);
    }
}
