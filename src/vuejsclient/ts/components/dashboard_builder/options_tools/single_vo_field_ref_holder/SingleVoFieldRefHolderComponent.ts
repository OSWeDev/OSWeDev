import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import VueComponentBase from '../../../VueComponentBase';
import VoFieldWidgetRefComponent from '../../vo_field_widget_ref/VoFieldWidgetRefComponent';
import './SingleVoFieldRefHolderComponent.scss';

@Component({
    template: require('./SingleVoFieldRefHolderComponent.pug'),
    components: {
        Vofieldwidgetrefcomponent: VoFieldWidgetRefComponent
    }
})
export default class SingleVoFieldRefHolderComponent extends VueComponentBase {

    @Prop({ default: null })
    private vo_field_ref: VOFieldRefVO;

    @Prop()
    private page_widget_id: number;

    private remove_field_ref() {
        this.$emit('remove_field_ref', this.vo_field_ref);
    }

    private allowDrop(event) {
        event.preventDefault();

        if ((!event) || (!event.dataTransfer)) {
            return false;
        }

        let api_type_id: string = event.dataTransfer.getData("api_type_id");
        let field_id: string = event.dataTransfer.getData("field_id");
        if ((!api_type_id) || (!field_id)) {
            return false;
        }

        return true;
    }

    private drop(event) {
        event.preventDefault();

        if (!this.allowDrop(event)) {
            return;
        }

        let api_type_id: string = event.dataTransfer.getData("api_type_id");
        let field_id: string = event.dataTransfer.getData("field_id");

        this.$emit('add_field_ref', api_type_id, field_id, this.vo_field_ref);
    }
}