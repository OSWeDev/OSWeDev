import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import IReadableFieldFilters from '../../../../../shared/modules/DashboardBuilder/interfaces/IReadableFieldFilters';
import DashboardPageWidgetVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardPageWidgetVOManager';
import DashboardPageVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardPageVOManager';
import FieldFiltersVOManager from '../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import { ModuleTranslatableTextAction } from '../../InlineTranslatableText/TranslatableTextStore';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import FieldFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ThrottleHelper from '../../../../../shared/tools/ThrottleHelper';
import VueAppController from '../../../../VueAppController';
import VueComponentBase from '../../VueComponentBase';
import './DashboardSharedFiltersComponent.scss';

/**
 * Specification:
 * - This component is used to display and configure shared_filters between dashboards and dashboard_pages
 * - Create select multiple dashboard and dashboard_pages to share filters with
 * - Specify which field_filters to share (both dashboard shall have the same possible field_filters)
 */

@Component({
    template: require('./DashboardSharedFiltersComponent.pug'),
    components: {}
})
export default class DashboardSharedFiltersComponent extends VueComponentBase {

    @Prop()
    private dashboard: DashboardVO;

    @ModuleTranslatableTextAction
    private set_flat_locale_translation: (translation: { code_text: string, value: string }) => void;

    private is_loading: boolean = true;

    // The dashboard_pages of dashboard
    private dashboard_pages: DashboardPageVO[] = [];
    // Load all default field_filters of each dashboard_page
    private sharable_field_filters_by_page_ids: {
        [page_id: number]: {
            readable_field_filters: { [label: string]: IReadableFieldFilters },
            field_filters: FieldFiltersVO,
        }
    } = {};

    private throttled_load_dashboard_pages = ThrottleHelper.getInstance().declare_throttle_without_args(
        this.load_dashboard_pages.bind(this),
        50,
        { leading: false, trailing: true }
    );

    private throttled_load_sharable_field_filters_by_page_ids = ThrottleHelper.getInstance().declare_throttle_without_args(
        this.load_sharable_field_filters_by_page_ids.bind(this),
        50,
        { leading: false, trailing: true }
    );

    @Watch('dashboard', { immediate: true })
    private async onchange_dashboard() {
        this.is_loading = true;

        if (!this.dashboard) {
            this.is_loading = false;

            return;
        }

        // Throttle load_dashboard_pages
        this.throttled_load_dashboard_pages();

        this.is_loading = false;
    }

    @Watch('dashboard_pages', { immediate: true })
    private async onchange_dashboard_pages() {
        // Throttle load_sharable_field_filters_by_page_ids
        this.throttled_load_sharable_field_filters_by_page_ids();
    }

    /**
     * load_dashboard_pages
     * - Load dashboard_pages of dashboard
     *
     * @returns {Promise<DashboardPageVO[]>}
     */
    private async load_dashboard_pages(): Promise<DashboardPageVO[]> {
        if (!this.dashboard) {
            return [];
        }

        // Get dashboard_pages of dashboard
        // - dashboard_pages are initialized and cached in DashboardPageVOManager
        const dashboard_pages = await DashboardPageVOManager.find_dashboard_pages_by_dashboard_id(
            this.dashboard.id
        );

        this.dashboard_pages = dashboard_pages;

        return dashboard_pages;
    }

    /**
     * load_sharable_field_filters_by_page_ids
     * - This method is responsible for loading the sharable field_filters of each dashboard_page
     * - The sharable field_filters are the field_filters which exists on the dashboard_page
     *
     * @returns {Promise<{ [page_id: number]: FieldFiltersVO }>}
     */
    private async load_sharable_field_filters_by_page_ids(): Promise<{
        [page_id: number]: {
            readable_field_filters: { [label: string]: IReadableFieldFilters },
            field_filters: FieldFiltersVO,
        }
    }> {
        if (!this.dashboard_pages?.length) {
            return {};
        }

        const sharable_field_filters_by_page_ids: {
            [page_id: number]: {
                readable_field_filters: { [label: string]: IReadableFieldFilters },
                field_filters: FieldFiltersVO,
            }
        } = {};

        for (let i in this.dashboard_pages) {
            const dashboard_page = this.dashboard_pages[i];

            // Get default field_filters of dashboard_page
            const default_page_field_filters = await FieldFiltersVOManager.find_default_field_filters_by_dashboard_page_id(
                dashboard_page.id,
                {
                    keep_empty_context_filter: true
                }
            );

            // Get widgets_options of the current dashboard_page
            const widgets_options_metadata = await DashboardPageWidgetVOManager.find_all_wigdets_options_metadata_by_page_id(
                dashboard_page.id
            );

            // Get widgets_options of the current dashboard_page
            const widgets_options = Object.values(widgets_options_metadata).map(
                (widget_options_metadata) => widget_options_metadata.widget_options
            );

            // Create readable field_filters of dashboard_page
            const readable_field_filters = FieldFiltersVOManager.create_readable_filters_text_from_field_filters(
                default_page_field_filters,
                widgets_options
            );

            // The actual field_filters of dashboard_page
            sharable_field_filters_by_page_ids[dashboard_page.id] = {
                field_filters: default_page_field_filters,
                readable_field_filters,
            };
        }

        this.sharable_field_filters_by_page_ids = sharable_field_filters_by_page_ids;

        return sharable_field_filters_by_page_ids;
    }

    /**
     * translate_to_readable_field_filters
     *
     * @param {FieldFiltersVO} field_filters
     * @returns {string}
     */
    private translate_to_readable_field_filters(field_filters: FieldFiltersVO): string {
        let readable_field_filters: string = '';

        console.log(JSON.stringify(field_filters));

        for (const api_type_id in field_filters) {
            const filters = field_filters[api_type_id];

            for (const field_id in filters) {
                const filter = filters[field_id];

                // readable_field_filters += this.get_translation_by_vo_field_ref_name_code_text(filter.name_code_text) + ', ';
            }
        }

        return readable_field_filters;
    }

    /**
     * Get Translation By VO Field Ref Name Code Text
     *
     * @param {string} name_code_text
     * @returns {string}
     */
    private get_translation_by_vo_field_ref_name_code_text(name_code_text: string): string {
        let translation: string = VueAppController.getInstance().ALL_FLAT_LOCALE_TRANSLATIONS[name_code_text];

        if (!translation) {
            translation = name_code_text;
        }

        return translation;
    }
}