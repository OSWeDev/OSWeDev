import 'vue-json-pretty/lib/styles.css';
import { Component, Prop } from 'vue-property-decorator';
import VarDataBaseVO from '../../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VueComponentBase from '../../../../../VueComponentBase';
import './VarDescExplainImportsComponent.scss';

@Component({
    template: require('./VarDescExplainImportsComponent.pug'),
    components: {
        Vardescexplaindepparamcomponent: () => import('../dep/param/VarDescExplainDepParamComponent')
    }
})
export default class VarDescExplainImportsComponent extends VueComponentBase {

    @Prop()
    private aggregated_var_datas: { [var_data_index: string]: VarDataBaseVO };
}