import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ModuleTableField from '../../../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import FieldValueFilterWidgetOptions from './FieldValueFilterWidgetOptions';
import './FieldValueFilterWidgetOptionsComponent.scss';

@Component({
    template: require('./FieldValueFilterWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class FieldValueFilterWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private max_visible_options: number = null;

    private next_update_options: FieldValueFilterWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    @Watch('widget_options', { immediate: true })
    private onchange_widget_options() {
        if (!this.widget_options) {
            this.max_visible_options = null;
            return;
        }
        this.max_visible_options = this.widget_options.max_visible_options;
    }

    @Watch('max_visible_options')
    private async onchange_max_visible_options() {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.max_visible_options != this.max_visible_options) {
            this.next_update_options = this.widget_options;
            this.next_update_options.max_visible_options = this.max_visible_options;

            await this.throttled_update_options();
        }
    }

    private async switch_can_select_multiple() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(null, null, null, this.can_select_multiple, this.is_checkbox, 50, this.show_search_field);
        }

        this.next_update_options.can_select_multiple = !this.next_update_options.can_select_multiple;

        await this.throttled_update_options();
    }

    private async switch_is_checkbox() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(null, null, null, this.can_select_multiple, this.is_checkbox, 50, this.show_search_field);
        }

        this.next_update_options.is_checkbox = !this.next_update_options.is_checkbox;

        await this.throttled_update_options();
    }

    private async switch_show_search_field() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(null, null, null, this.can_select_multiple, this.is_checkbox, 50, this.show_search_field);
        }

        this.next_update_options.show_search_field = !this.next_update_options.show_search_field;

        await this.throttled_update_options();
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);

        let name = VOsTypesManager.getInstance().vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.page_widget.widget_id].name;
        let get_selected_fields = DashboardBuilderWidgetsController.getInstance().widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});
    }

    get can_select_multiple(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return (this.widget_options.can_select_multiple == null) || !!this.widget_options.can_select_multiple;
    }

    get is_checkbox(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return (this.widget_options.is_checkbox == null) || !!this.widget_options.is_checkbox;
    }

    get show_search_field(): boolean {

        if (!this.widget_options) {
            return false;
        }

        return (this.widget_options.show_search_field == null) || !!this.widget_options.show_search_field;
    }

    get vo_field_ref(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get vo_field_ref_lvl2(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_ref_lvl2)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref_lvl2);
    }

    get vo_field_sort(): VOFieldRefVO {
        let options: FieldValueFilterWidgetOptions = this.widget_options;

        if ((!options) || (!options.vo_field_sort)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_sort);
    }

    private async remove_field_ref() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_ref) {
            return null;
        }

        this.next_update_options.vo_field_ref = null;

        await this.throttled_update_options();
    }

    private async remove_field_ref_lvl2() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_ref_lvl2) {
            return null;
        }

        this.next_update_options.vo_field_ref_lvl2 = null;

        await this.throttled_update_options();
    }

    private async remove_field_sort() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_sort) {
            return null;
        }

        this.next_update_options.vo_field_sort = null;

        await this.throttled_update_options();
    }

    get default_placeholder_translation(): string {
        return this.label('FieldValueFilterWidget.filter_placeholder');
    }

    get widget_options(): FieldValueFilterWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: FieldValueFilterWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as FieldValueFilterWidgetOptions;
                options = options ? new FieldValueFilterWidgetOptions(
                    options.vo_field_ref,
                    options.vo_field_ref_lvl2,
                    options.vo_field_sort,
                    options.can_select_multiple,
                    options.is_checkbox,
                    options.max_visible_options,
                    options.show_search_field,
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }

    private async add_field_ref(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(null, null, null, this.can_select_multiple, this.is_checkbox, 50, this.show_search_field);
        }

        let vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        this.next_update_options.vo_field_ref = vo_field_ref;

        await this.throttled_update_options();
    }

    private async add_field_ref_lvl2(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(null, null, null, this.can_select_multiple, this.is_checkbox, 50, this.show_search_field);
        }

        let vo_field_ref_lvl2 = new VOFieldRefVO();
        vo_field_ref_lvl2.api_type_id = api_type_id;
        vo_field_ref_lvl2.field_id = field_id;
        vo_field_ref_lvl2.weight = 0;

        this.next_update_options.vo_field_ref_lvl2 = vo_field_ref_lvl2;

        await this.throttled_update_options();
    }

    private async add_field_sort(api_type_id: string, field_id: string) {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FieldValueFilterWidgetOptions(null, null, null, this.can_select_multiple, this.is_checkbox, 50, this.show_search_field);
        }

        let vo_field_sort = new VOFieldRefVO();
        vo_field_sort.api_type_id = api_type_id;
        vo_field_sort.field_id = field_id;
        vo_field_sort.weight = 0;

        this.next_update_options.vo_field_sort = vo_field_sort;

        await this.throttled_update_options();
    }

    get is_type_string(): boolean {

        if ((!this.vo_field_ref) || (!this.vo_field_ref.api_type_id) || (!this.vo_field_ref.field_id)) {
            return false;
        }

        let field = VOsTypesManager.getInstance().moduleTables_by_voType[this.vo_field_ref.api_type_id].get_field_by_id(this.vo_field_ref.field_id);

        if (!field) {
            return false;
        }

        switch (field.field_type) {
            case ModuleTableField.FIELD_TYPE_html:
            case ModuleTableField.FIELD_TYPE_html_array:
            case ModuleTableField.FIELD_TYPE_email:
            case ModuleTableField.FIELD_TYPE_string:
            case ModuleTableField.FIELD_TYPE_textarea:
            case ModuleTableField.FIELD_TYPE_string_array:
            case ModuleTableField.FIELD_TYPE_translatable_text:
            case ModuleTableField.FIELD_TYPE_file_field:
                return true;

            case ModuleTableField.FIELD_TYPE_password:
            case ModuleTableField.FIELD_TYPE_file_ref:
            case ModuleTableField.FIELD_TYPE_image_field:
            case ModuleTableField.FIELD_TYPE_image_ref:
            case ModuleTableField.FIELD_TYPE_boolean:
            case ModuleTableField.FIELD_TYPE_enum:
            case ModuleTableField.FIELD_TYPE_int:
            case ModuleTableField.FIELD_TYPE_geopoint:
            case ModuleTableField.FIELD_TYPE_float:
            case ModuleTableField.FIELD_TYPE_decimal_full_precision:
            case ModuleTableField.FIELD_TYPE_amount:
            case ModuleTableField.FIELD_TYPE_foreign_key:
            case ModuleTableField.FIELD_TYPE_numrange:
            case ModuleTableField.FIELD_TYPE_numrange_array:
            case ModuleTableField.FIELD_TYPE_refrange_array:
            case ModuleTableField.FIELD_TYPE_isoweekdays:
            case ModuleTableField.FIELD_TYPE_int_array:
            case ModuleTableField.FIELD_TYPE_prct:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes_sans_limite:
            case ModuleTableField.FIELD_TYPE_date:
            case ModuleTableField.FIELD_TYPE_hours_and_minutes:
            case ModuleTableField.FIELD_TYPE_daterange:
            case ModuleTableField.FIELD_TYPE_tstz:
            case ModuleTableField.FIELD_TYPE_tstz_array:
            case ModuleTableField.FIELD_TYPE_tstzrange_array:
            case ModuleTableField.FIELD_TYPE_tsrange:
            case ModuleTableField.FIELD_TYPE_hour:
            case ModuleTableField.FIELD_TYPE_hourrange:
            case ModuleTableField.FIELD_TYPE_hourrange_array:
            case ModuleTableField.FIELD_TYPE_day:
            case ModuleTableField.FIELD_TYPE_timewithouttimezone:
            case ModuleTableField.FIELD_TYPE_month:
            case ModuleTableField.FIELD_TYPE_plain_vo_obj:
            default:
                return false;
        }
    }
}