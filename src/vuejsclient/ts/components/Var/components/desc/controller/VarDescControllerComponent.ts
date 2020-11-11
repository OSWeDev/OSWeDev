import { Component, Prop } from 'vue-property-decorator';
import 'vue-tables-2';
import VueComponentBase from '../../../../VueComponentBase';
import VarsClientController from '../../../VarsClientController';
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

        return this.var_id + ' | ' + this.t(VarsClientController.getInstance().get_translatable_name_code_by_var_id(this.var_id));
    }
}