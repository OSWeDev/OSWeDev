import { Component } from 'vue-property-decorator';
import VarDataBaseVO from '../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleVarsDatasExplorerVuexGetter } from '../VarsDatasExplorerVuexStore';
import './VarsDatasExplorerVisualizationComponent.scss';

@Component({
    template: require('./VarsDatasExplorerVisualizationComponent.pug'),
})
export default class VarsDatasExplorerVisualizationComponent extends VueComponentBase {

    @ModuleVarsDatasExplorerVuexGetter
    private get_filtered_datas: { [index: string]: VarDataBaseVO };
}
