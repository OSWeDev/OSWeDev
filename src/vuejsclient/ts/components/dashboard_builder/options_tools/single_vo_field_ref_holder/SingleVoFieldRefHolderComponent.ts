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

    private remove_field_ref() {
        this.$emit('remove_field_ref', this.vo_field_ref);
    }

    private allowDrop(event) {
        if ((!event) || (!event.dataTransfer)) {
            return false;
        }

        let vo_field_ref: VOFieldRefVO = event.dataTransfer.getData("vo_field_ref");
        if ((!vo_field_ref) || (!vo_field_ref.api_type_id) || (!vo_field_ref.field_id)) {
            return false;
        }

        return true;
    }

    private drop(event) {
        if ((!event) || (!event.dataTransfer)) {
            return;
        }

        let vo_field_ref: VOFieldRefVO = event.dataTransfer.getData("vo_field_ref");
        if ((!vo_field_ref) || (!vo_field_ref.api_type_id) || (!vo_field_ref.field_id)) {
            return;
        }

        this.$emit('add_field_ref', vo_field_ref.api_type_id, vo_field_ref.field_id);
    }
}