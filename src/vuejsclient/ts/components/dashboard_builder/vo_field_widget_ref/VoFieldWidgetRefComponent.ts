import { textChangeRangeIsUnchanged } from 'typescript';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VOFieldRefVO from '../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
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

        let table = VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id];
        if (!table) {
            return null;
        }
        let field = table.get_field_by_id(this.vo_field_ref.field_id);

        return this.t(table.label.code_text) +
            ' > ' +
            (field ? this.t(field.field_label.code_text) : this.vo_field_ref.field_id);
    }

    get translatable_name_code_text() {
        if (!this.vo_field_ref) {
            return null;
        }

        return this.vo_field_ref.get_translatable_name_code_text(this.page_widget_id);
    }

    get default_field_label(): string {
        if (!this.vo_field_ref) {
            return null;
        }

        if ((!this.vo_field_ref.api_type_id) || (!this.vo_field_ref.field_id)) {
            return null;
        }

        let field = VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);

        return field ? this.t(field.field_label.code_text) : this.vo_field_ref.field_id;
    }

    private remove_field_ref() {
        this.$emit('remove_field_ref', this.vo_field_ref);
    }
}