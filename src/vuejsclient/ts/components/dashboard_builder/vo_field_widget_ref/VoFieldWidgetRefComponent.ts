import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import ModuleTableController from '../../../../../shared/modules/DAO/ModuleTableController';
import VOFieldRefVO from '../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import InlineTranslatableText from '../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../VueComponentBase';
import './VoFieldWidgetRefComponent.scss';

@Component({
    template: require('./VoFieldWidgetRefComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class VoFieldWidgetRefComponent extends VueComponentBase {

    @Prop()
    private vo_field_ref: VOFieldRefVO;

    @Prop()
    private page_widget_id: number;

    get vo_ref_tooltip(): string {
        if (!this.vo_field_ref) {
            return null;
        }

        const table = ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id];
        if (!table) {
            return null;
        }
        const field = table.get_field_by_id(this.vo_field_ref.field_id);

        return this.t(table.label.code_text) +
            ' > ' +
            (field ? this.t(field.field_label.code_text) : this.vo_field_ref.field_id);
    }

    get default_field_label(): string {
        if (!this.vo_field_ref) {
            return null;
        }

        if ((!this.vo_field_ref.api_type_id) || (!this.vo_field_ref.field_id)) {
            return null;
        }

        const field = ModuleTableController.module_tables_by_vo_type[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);

        return field ? this.t(field.field_label.code_text) : this.vo_field_ref.field_id;
    }

    private remove_field_ref() {
        this.$emit('remove_field_ref', this.vo_field_ref);
    }
}