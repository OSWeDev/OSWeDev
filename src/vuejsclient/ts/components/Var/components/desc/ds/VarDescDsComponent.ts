import { Component, Prop } from 'vue-property-decorator';
import VarsController from '../../../../../../../shared/modules/Var/VarsController';
import VueComponentBase from '../../../../VueComponentBase';
import './VarDescDsComponent.scss';

@Component({
    template: require('./VarDescDsComponent.pug'),
    components: {
    }
})
export default class VarDescDsComponent extends VueComponentBase {

    @Prop()
    private ds_name: string;

    get translated_ds_name(): string {
        if (!this.ds_name) {
            return null;
        }

        return this.t(VarsController.get_translatable_ds_name(this.ds_name));
    }
}