import { Component, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleVarAction, ModuleVarGetter } from '../../../store/VarStore';
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
        let each_line_of_textarea = this.multi_param_index.split('\n');
        let array_of_datas = [];
        let array_of_promise = [];
        each_line_of_textarea.forEach((index: string) => {
            let datass: any = ModuleDAO.getInstance().getVosByRefFieldsIdsAndFieldsString('crescendo_day_dr', null, null, '_bdd_only_index', [index]);
            array_of_promise.push(datass);
        });
        await Promise.all(array_of_promise).then((datas: any) => {
            array_of_datas = datas;
        });
        let res: { [index: string]: VarDataBaseVO } = {};
        for (let i in array_of_datas) {
            let filter_param = array_of_datas[i][0];

            let datas: VarDataBaseVO[] = await ModuleDAO.getInstance().filterVosByMatroidsIntersections(filter_param._type, [filter_param], null);
            for (let j in datas) {
                let data = datas[j];
                res[data.index] = data;
            }
        }
        this.display_data = true;
        this.set_filtered_datas(res);
    }

}
