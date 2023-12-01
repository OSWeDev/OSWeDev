import { Component, Prop, Watch } from 'vue-property-decorator';
import VarsController from '../../../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VueComponentBase from '../../../../../VueComponentBase';
import './VarDescExplainDepComponent.scss';

@Component({
    template: require('./VarDescExplainDepComponent.pug'),
    components: {
        Vardesccontrollercomponent: () => import('../../controller/VarDescControllerComponent'),
        Vardescparamfieldscomponent: () => import('../../param_fields/VarDescParamFieldsComponent'),
        Vardescexplaindepparamcomponent: () => import('./param/VarDescExplainDepParamComponent'),
    }
})
export default class VarDescExplainDepComponent extends VueComponentBase {

    @Prop()
    private dep_id: string;

    @Prop()
    private var_id: number;

    @Prop()
    private params: VarDataBaseVO[];

    private opened: boolean = true;
    private limit_10: boolean = true;

    @Watch('params', { deep: true, immediate: true })
    private onchange_params() {
        this.limit_10 = true;
    }

    private async copy_dep_code() {
        await navigator.clipboard.writeText(this.dep_code);
    }

    get dep_code() {
        return '{' + VarsController.get_sum_dep_code(this.dep_id) + '}';
    }

    get dep_name(): string {
        if (!this.dep_id) {
            return null;
        }
        return this.t(VarsController.get_translatable_dep_name(this.dep_id));
    }
}