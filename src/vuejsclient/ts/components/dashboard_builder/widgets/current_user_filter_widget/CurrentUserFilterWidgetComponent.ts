import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import CurrentUserFilterWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CurrentUserFilterWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import UserVO from '../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import { ModuleDashboardPageAction } from '../../page/DashboardPageStore';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import VOFieldRefVOTypeHandler from '../../../../../../shared/modules/DashboardBuilder/handlers/VOFieldRefVOTypeHandler';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import DataFilterOption from '../../../../../../shared/modules/DataRender/vos/DataFilterOption';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import './CurrentUserFilterWidgetComponent.scss';

@Component({
    template: require('./CurrentUserFilterWidgetComponent.pug'),
    components: {}
})
export default class CurrentUserFilterWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageAction
    private set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    private widget_options: CurrentUserFilterWidgetOptionsVO = null;

    private current_data_filter: DataFilterOption = null; // the current user data filter
    private user: UserVO = null; // the current user

    /**
     * Watch on page_widget
     *
     * @returns {void}
     */
    @Watch('page_widget', { immediate: true })
    private onchange_page_widget_options(): void {
        this.user = this.data_user;
        this.widget_options = this.get_widget_options();

        this.init_data_filter();
    }

    /**
     * Watch on widget_options
     *  - Shall happen first on component init or each time widget_options changes
     *  - Initialize the active_field_filter with the context_filter
     *
     * @returns {void}
     */
    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options(): Promise<void> {

        if (!this.widget_options) {
            return;
        }

        this.init_data_filter();
    }

    /**
     * init_data_filter
     *  - Initialize the active_field_filter with the context_filter
     *
     * @returns {void}
     */
    private init_data_filter(): void {

        if (!this.widget_options) {
            return;
        }

        this.current_data_filter = this.create_data_filter(this.vo_field_ref.field_id);

        const context_filter = ContextFilterVOManager.get_context_filter_from_data_filter_option(
            this.current_data_filter,
            null,
            this.field,
            this.vo_field_ref
        );

        this.set_active_field_filter({
            field_id: this.vo_field_ref.field_id,
            vo_type: this.vo_field_ref.api_type_id,
            active_field_filter: context_filter,
        });
    }

    /**
     * get_widget_options
     *  - Get widget options from page_widget json_options
     *
     * @returns {CurrentUserFilterWidgetOptionsVO}
     */
    private get_widget_options(): CurrentUserFilterWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CurrentUserFilterWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options?.length > 0) {
                options = JSON.parse(this.page_widget.json_options) as CurrentUserFilterWidgetOptionsVO;
                options = options ? new CurrentUserFilterWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * create_data_filter
     * - Create a DataFilterOption from a value and a field_id (vo_field_ref)
     *
     * @param {string} field_id The field_id of the vo_field_ref may be id or name
     * @returns {DataFilterOption}
     */
    private create_data_filter(field_id: string): DataFilterOption {
        let val: number = this.user[field_id]; // it may be id or login or name

        if (!val) {
            return null;
        }

        const data_filter = new DataFilterOption(
            DataFilterOption.STATE_SELECTED,
            this.t(this.field?.field_label ?? field_id),
            val
        );

        if (this.is_type_string) {
            data_filter.string_value = val.toString();
        }

        if (this.is_type_number) {
            data_filter.numeric_value = val;
        }

        return data_filter;
    }

    get vo_field_ref(): VOFieldRefVO {
        let options: CurrentUserFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return new VOFieldRefVO().from(options.vo_field_ref);
    }

    get field(): ModuleTableField<any> {
        if (!this.vo_field_ref) {
            return null;
        }

        const moduletable = VOsTypesManager.moduleTables_by_voType[this.vo_field_ref.api_type_id];
        return moduletable.get_field_by_id(this.vo_field_ref.field_id);
    }

    get vo_field_ref_label(): string {
        if ((!this.widget_options) || (!this.vo_field_ref)) {
            return null;
        }

        return this.get_flat_locale_translations[this.vo_field_ref.get_translatable_name_code_text(this.page_widget.id)];
    }

    get is_type_string(): boolean {
        return VOFieldRefVOTypeHandler.is_type_string(this.vo_field_ref);
    }

    get is_type_number(): boolean {
        return VOFieldRefVOTypeHandler.is_type_number(this.vo_field_ref);
    }
}