import { Component, Prop } from 'vue-property-decorator';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import VueComponentBase from '../../../../VueComponentBase';
import './VarDescControllerComponent.scss';

@Component({
    template: require('./VarDescControllerComponent.pug'),
    components: {
    }
})
export default class VarDescControllerComponent extends VueComponentBase {

    @Prop()
    private var_id: number;

    get var_name(): string {
        if (!this.var_id) {
            return null;
        }

        return this.var_id + ' | ' + this.t(VarsController.getInstance().get_translatable_name_code_by_var_id(this.var_id));
    }
}