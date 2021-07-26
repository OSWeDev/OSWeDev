import { Component, Prop } from 'vue-property-decorator';
import VarsController from '../../../../../../../../shared/modules/Var/VarsController';
import VarDataBaseVO from '../../../../../../../../shared/modules/Var/vos/VarDataBaseVO';
import VueComponentBase from '../../../../../VueComponentBase';
import './VarDescExplainDepComponent.scss';

@Component({
    template: require('./VarDescExplainDepComponent.pug'),
    components: {
        Vardesccontrollercomponent: () => import(/* webpackChunkName: "VarDescControllerComponent" */ '../../controller/VarDescControllerComponent'),
        Vardescparamfieldscomponent: () => import(/* webpackChunkName: "VarDescParamFieldsComponent" */ '../../param_fields/VarDescParamFieldsComponent'),
        Vardescexplaindepparamcomponent: () => import(/* webpackChunkName: "VarDescExplainDepParamComponent" */ './param/VarDescExplainDepParamComponent'),
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

    get dep_name(): string {
        if (!this.dep_id) {
            return null;
        }
        return this.t(VarsController.getInstance().get_translatable_dep_name(this.dep_id));
    }
}