import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import SupervisionTypeWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/SupervisionTypeWidgetManager';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import SupervisedCategoryVO from '../../../../../../shared/modules/Supervision/vos/SupervisedCategoryVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import SupervisionTypeWidgetOptions from './options/SupervisionTypeWidgetOptions';
import VueComponentBase from '../../../VueComponentBase';
import './SupervisionTypeWidgetComponent.scss';

@Component({
    template: require('./SupervisionTypeWidgetComponent.pug'),
    components: {}
})
export default class SupervisionTypeWidgetComponent extends VueComponentBase {

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    @ModuleDashboardPageAction
    private set_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    @ModuleDashboardPageAction
    private set_active_api_type_ids: (active_api_type_ids: string[]) => void;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private selected_api_type_id: string = null;
    private available_api_type_ids: string[] = [];
    private categories_by_name: { [name: string]: SupervisedCategoryVO } = {};

    private async mounted() {
        await this.load_all_supervised_categories();
    }

    @Watch('selected_api_type_id')
    private onchange_selected_api_type_id() {

        if (!this.selected_api_type_id) {
            this.set_active_api_type_ids(null);
            return;
        }

        this.set_active_api_type_ids([this.selected_api_type_id]);
    }

    @Watch("available_api_type_ids")
    private async onchange_available_api_type_ids() {
        if (this.selected_api_type_id && this.available_api_type_ids?.indexOf(this.selected_api_type_id) == -1) {
            this.selected_api_type_id = null;
        }
    }

    /**
     * Watch on active_field_filters
     *  - Shall happen first on component init or each time active_field_filters changes
     *  - Initialize the tmp_filter_active_options with default widget options
     *
     * @returns {Promise<void>}
     */
    @Watch("get_active_field_filters", { immediate: true, deep: true })
    private async onchange_get_active_field_filters(): Promise<void> {
        await this.onchange_supervision_api_type_ids();
    }

    /**
     * Watch on supervision_api_type_ids
     * - Shall happen first on component init or each time supervision_api_type_ids changes
     * - Initialize the available_api_type_ids with the loaded supervision_api_type_ids
     */
    @Watch("supervision_api_type_ids")
    private async onchange_supervision_api_type_ids() {

        const data = await SupervisionTypeWidgetManager.find_available_supervision_type_ids(
            this.dashboard,
            this.widget_options,
            this.get_active_field_filters,
            {
                categories_by_name: this.categories_by_name
            }
        );

        this.available_api_type_ids = data.items;
    }

    /**
     * Load all supervised categories
     * @returns {Promise<void>}
     */
    private async load_all_supervised_categories(): Promise<void> {
        this.categories_by_name = await SupervisionTypeWidgetManager.find_all_supervised_categories_by_name();
    }

    private handle_select_api_type_id(api_type_id: string) {

        if (this.selected_api_type_id === api_type_id) {
            this.selected_api_type_id = null;
        } else {
            this.selected_api_type_id = api_type_id;
        }
    }

    get title_name_code_text() {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    /**
     * Supervision Api Type Ids
     * - Used to filter the supervision items (sondes) from each datatable
     *
     * @returns {string[]}
     */
    get supervision_api_type_ids(): string[] {

        if (!this.widget_options) {
            return null;
        }

        // TODO:
        return this.widget_options.supervision_api_type_ids;
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }

        let options: SupervisionTypeWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as SupervisionTypeWidgetOptions;
                options = options ? new SupervisionTypeWidgetOptions(
                    options.supervision_api_type_ids
                ) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}