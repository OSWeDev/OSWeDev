import 'vue-json-pretty/lib/styles.css';
import { Component, Prop, Watch } from 'vue-property-decorator';
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

    private aggregated_var_datas_array: VarDataBaseVO[];

    private limit_10: boolean = true;

    @Watch('aggregated_var_datas', { deep: true, immediate: true })
    private onchange_params() {
        this.aggregated_var_datas_array = this.aggregated_var_datas ? Object.values(this.aggregated_var_datas) : null;
        this.limit_10 = true;
    }
}