import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import IReadableFieldFilters from '../../../../../shared/modules/DashboardBuilder/interfaces/IReadableFieldFilters';
import SharedFiltersVOManager from '../../../../../shared/modules/DashboardBuilder/manager/SharedFiltersVOManager';
import DashboardPageVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardPageVOManager';
import FieldFiltersVOManager from '../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import { ModuleTranslatableTextAction, ModuleTranslatableTextGetter } from '../../InlineTranslatableText/TranslatableTextStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../page/DashboardPageStore';
import SharedFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import FieldFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ISelectionnableFieldFilters from './interface/ISelectionnableFieldFilters';
import SharedFiltersModalComponent from './modal/SharedFiltersModalComponent';
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
    components: {
        Sharedfiltersmodalcomponent: SharedFiltersModalComponent,
    }
})
export default class DashboardSharedFiltersComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_Sharedfiltersmodalcomponent: SharedFiltersModalComponent;

    @Prop()
    private dashboard: DashboardVO;

    @ModuleTranslatableTextAction
    private set_flat_locale_translation: (translation: { code_text: string, value: string }) => void;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageAction
    private set_Sharedfiltersmodalcomponent: (Sharedfiltersmodalcomponent: SharedFiltersModalComponent) => void;

    private start_update: boolean = false;
    private is_loading: boolean = true;

    // The dashboard_pages of dashboard
    private dashboard_pages: DashboardPageVO[] = [];
    // Load all default field_filters of each dashboard_page
    private sharable_field_filters_by_page_ids: {
        [page_id: number]: ISelectionnableFieldFilters
    } = {};
    // The shared_filters of dashboard pages (One page can have many shared_filters)
    private shared_filters_by_page_ids: { [page_id: number]: SharedFiltersVO[] } = {};

    private throttled_load_dashboard_pages = ThrottleHelper.getInstance().declare_throttle_without_args(
        this.load_dashboard_pages.bind(this),
        50,
        { leading: false, trailing: true }
    );

    private throttled_load_all_shared_filters = ThrottleHelper.getInstance().declare_throttle_without_args(
        this.load_all_shared_filters.bind(this),
        50,
        { leading: false, trailing: true }
    );

    private throttled_load_sharable_field_filters_by_page_ids = ThrottleHelper.getInstance().declare_throttle_without_args(
        this.load_sharable_field_filters_by_page_ids.bind(this),
        50,
        { leading: false, trailing: true }
    );

    /**
     * mounted
     * - Vue lifecycle hook
     */
    private mounted() {
        this.set_Sharedfiltersmodalcomponent(this.$refs['Sharedfiltersmodalcomponent'] as SharedFiltersModalComponent);
    }

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
        this.throttled_load_all_shared_filters();
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
     * - The sharable field_filters are the default field_filters which exists on the dashboard_page
     *
     * @returns {Promise<{ [page_id: number]: FieldFiltersVO }>}
     */
    private async load_sharable_field_filters_by_page_ids(): Promise<{
        [page_id: number]: {
            readable_field_filters: { [label: string]: IReadableFieldFilters },
            field_filters: FieldFiltersVO,
        }
    }> {
        if (!(this.dashboard_pages?.length > 0)) {
            return {};
        }

        const sharable_field_filters_by_page_ids: {
            [page_id: number]: ISelectionnableFieldFilters
        } = {};

        for (const key in this.dashboard_pages) {
            const dashboard_page = this.dashboard_pages[key];

            // Get default field_filters of dashboard_page
            const default_page_field_filters = await FieldFiltersVOManager.find_default_field_filters_by_dashboard_page_id(
                dashboard_page.id,
                {
                    keep_empty_context_filter: true
                }
            );

            // Create readable field_filters of dashboard_page
            const readable_field_filters = await FieldFiltersVOManager.create_readable_filters_text_from_field_filters(
                default_page_field_filters,
                dashboard_page.id,
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
     * handle_create_shared_filters
     * - Create shared_filters by using shared_filters edit Modal
     *
     * @param {number} dashboard_page_id
     */
    private handle_create_shared_filters(dashboard_page_id: number) {

        const selectionnable_field_filters_metadata = this.sharable_field_filters_by_page_ids[dashboard_page_id];

        const readable_field_filters = selectionnable_field_filters_metadata.readable_field_filters;
        const selectionnable_field_filters = selectionnable_field_filters_metadata.field_filters;

        this.get_Sharedfiltersmodalcomponent.open_modal_for_creation(
            {
                selectionnable_field_filters,
                readable_field_filters,
            },
            this.handle_save_shared_filters.bind(this)
        );
    }

    /**
     * handle_update_shared_filters
     * - Update shared_filters by using shared_filters edit Modal
     *
     * @param shared_filters
     */
    private handle_update_shared_filters(shared_filters: SharedFiltersVO) {

    }

    /**
     * handle_delete_shared_filters
     * - Delete shared_filters after confirmation
     *
     * @param shared_filters
     */
    private handle_delete_shared_filters(shared_filters: SharedFiltersVO) {

    }

    /**
     * handle_save_shared_filters
     *  - Save shared_filters
     *
     * @param {SharedFiltersVO} [shared_filters]
     * @returns {Promise<void>}
     */
    private async handle_save_shared_filters(shared_filters: SharedFiltersVO): Promise<void> {
        if (!shared_filters) {
            return;
        }

        if (this.start_update) {
            return;
        }

        this.start_update = true;

        await this.save_shared_filters(shared_filters);

        this.start_update = false;
    }

    /**
     * Save Shared Filters
     *
     * @param {SharedFiltersVO} shared_filters
     * @return {Promise<void>}
     */
    private async save_shared_filters(shared_filters: SharedFiltersVO): Promise<void> {
        let self = this;

        self.snotify.async(self.label('dashboard_builder.shared_filters.save_start'), () =>
            new Promise(async (resolve, reject) => {
                const success = await SharedFiltersVOManager.save_shared_filters(
                    shared_filters
                );

                if (success) {
                    await self.load_all_shared_filters();
                    resolve({
                        body: self.label('dashboard_builder.shared_filters.save_ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } else {
                    reject({
                        body: self.label('dashboard_builder.shared_filters.save_failed'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                }
            })
        );
    }

    /**
     * load_all_shared_filters
     * - Reload all shared_filters
     * - This method is called after each shared_filters save
     * - This method is called after each shared_filters delete
     * - This method is called after each dashboard_page load
     */
    private async load_all_shared_filters() {

        // Reload dashboard_pages
        await this.load_dashboard_pages();

        // Reload shared_filters_by_page_ids
        const shared_filters = await SharedFiltersVOManager.find_shared_filters_by_page_ids(
            this.dashboard_pages.map((dashboard_page) => dashboard_page.id)
        );

        // Create shared_filters_by_page_ids
        const shared_filters_by_page_ids: { [page_id: number]: SharedFiltersVO[] } = {};

        for (const key in this.dashboard_pages) {
            const dashboard_page = this.dashboard_pages[key];

            shared_filters_by_page_ids[dashboard_page.id] = shared_filters.filter((shared_filter) => {
                return shared_filter.page_id == dashboard_page.id;
            });
        }

        this.shared_filters_by_page_ids = shared_filters_by_page_ids;
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
            translation = this.get_flat_locale_translations[name_code_text];
        }

        if (!translation) {
            translation = name_code_text;
        }

        return translation;
    }
}