import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageFieldFiltersVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardPageFieldFiltersVOManager';
import SharedFiltersVOManager from '../../../../../shared/modules/DashboardBuilder/manager/SharedFiltersVOManager';
import DashboardPageVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardPageVOManager';
import { ModuleTranslatableTextAction, ModuleTranslatableTextGetter } from '../../InlineTranslatableText/TranslatableTextStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../page/DashboardPageStore';
import DashboardPageFieldFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageFieldFiltersVO';
import SharedFiltersVO from '../../../../../shared/modules/DashboardBuilder/vos/SharedFiltersVO';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ISelectionnableFieldFilters from './interface/ISelectionnableFieldFilters';
import SharedFiltersModalComponent from './modal/SharedFiltersModalComponent';
import ThrottleHelper from '../../../../../shared/tools/ThrottleHelper';
import VueAppController from '../../../../VueAppController';
import VueComponentBase from '../../VueComponentBase';
import './DashboardSharedFiltersComponent.scss';

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

    private is_shared_filters_updating: boolean = false;
    private is_shared_filters_loading: boolean = true;
    private is_loading: boolean = true;

    // The dashboard_pages of dashboard
    private dashboard_pages: DashboardPageVO[] = [];
    // Load all default field_filters of each dashboard_page
    private dashboard_pages_field_filters_map: DashboardPageFieldFiltersVO[] = [];
    // The shared_filters of dashboard
    private shared_filters_from_dashboard: SharedFiltersVO[] = [];
    // The shared_filters with dashboard
    private shared_filters_with_dashboard: SharedFiltersVO[] = [];

    private throttled_load_dashboard_pages = ThrottleHelper.declare_throttle_without_args(
        this.load_dashboard_pages.bind(this),
        50,
        { leading: false, trailing: true }
    );

    private throttled_load_all_shared_filters = ThrottleHelper.declare_throttle_with_stackable_args(
        this.load_all_shared_filters.bind(this),
        50,
        { leading: false, trailing: true }
    );

    private throttled_load_dashboard_pages_field_filters_map = ThrottleHelper.declare_throttle_without_args(
        this.load_dashboard_pages_field_filters_map.bind(this),
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
        // Throttle load_dashboard_pages_field_filters_map
        this.throttled_load_dashboard_pages_field_filters_map();
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
     * load_dashboard_pages_field_filters_map
     * - This method is responsible for loading the sharable field_filters of each dashboard_page
     * - The sharable field_filters are the default field_filters which exists on the dashboard_page
     *
     * @returns {Promise<{ [page_id: number]: FieldFiltersVO }>}
     */
    private async load_dashboard_pages_field_filters_map(): Promise<{
        [page_id: number]: ISelectionnableFieldFilters
    }> {
        if (!(this.dashboard_pages?.length > 0)) {
            return {};
        }

        const dashboard_pages_field_filters_map = await DashboardPageFieldFiltersVOManager.find_dashboard_pages_field_filters_by_dashboard_id(
            this.dashboard.id,
        );

        this.dashboard_pages_field_filters_map = dashboard_pages_field_filters_map;

        return dashboard_pages_field_filters_map;
    }

    /**
     * handle_create_shared_filters
     * - Create shared_filters by using shared_filters edit Modal
     * - Select intersect field_filters between dashboard_pages
     */
    private handle_create_shared_filters() {
        const selectionnable_field_filters = DashboardPageFieldFiltersVOManager.get_INTERSECTION_all_dashboard_pages_field_filters(//merge_all_dashboard_pages_field_filters(
            this.dashboard_pages_field_filters_map
        );

        this.get_Sharedfiltersmodalcomponent.open_modal_for_creation(
            {
                selectionnable_field_filters,
                dashboard_id: this.dashboard.id,
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
        this.is_shared_filters_updating = true;

        const selectionnable_field_filters = DashboardPageFieldFiltersVOManager.get_INTERSECTION_all_dashboard_pages_field_filters(//merge_all_dashboard_pages_field_filters(
            this.dashboard_pages_field_filters_map
        );

        this.get_Sharedfiltersmodalcomponent.open_modal_for_update(
            {
                selectionnable_field_filters,
                dashboard_id: this.dashboard.id,
                shared_filters
            },
            this.handle_save_shared_filters.bind(this),
            this.handle_update_shared_filters_modal_close.bind(this),
            this.handle_delete_shared_filters.bind(this)
        );
    }

    /**
     * handle_delete_shared_filters
     * - Delete shared_filters after confirmation
     *
     * @param shared_filters
     */
    private handle_delete_shared_filters(shared_filters: SharedFiltersVO) {
        this.delete_shared_filters(shared_filters);
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
     * handle_update_shared_filters_modal_close
     * - Handle shared_filters edit Modal close
     */
    private handle_update_shared_filters_modal_close(): void {
        this.is_shared_filters_updating = false;
    }

    /**
     * Save Shared Filters
     *
     * @param {SharedFiltersVO} shared_filters
     * @return {Promise<void>}
     */
    private async save_shared_filters(shared_filters: SharedFiltersVO): Promise<void> {
        const self = this;

        self.snotify.async(self.label('dashboard_builder.shared_filters.save_start'), () =>
            new Promise(async (resolve, reject) => {
                const success = await SharedFiltersVOManager.save_shared_filters(
                    shared_filters
                );

                if (success) {
                    self.throttled_load_all_shared_filters({ refresh: true });
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
     * delete_shared_filters
     * - Delete shared_filters after confirmation
     *
     * @param {SharedFiltersVO} [shared_filters]
     * @returns {Promise<void>}
     */
    private async delete_shared_filters(shared_filters: SharedFiltersVO): Promise<void> {
        const self = this;

        if (!shared_filters) {
            return;
        }

        self.snotify.async(self.label('dashboard_builder.shared_filters.delete_start'), () =>
            new Promise(async (resolve, reject) => {
                const success = await SharedFiltersVOManager.delete_shared_filters(
                    shared_filters
                );

                if (success) {
                    self.throttled_load_all_shared_filters({ refresh: true });
                    resolve({
                        body: self.label('dashboard_builder.shared_filters.delete_ok'),
                        config: {
                            timeout: 10000,
                            showProgressBar: true,
                            closeOnClick: false,
                            pauseOnHover: true,
                        },
                    });
                } else {
                    reject({
                        body: self.label('dashboard_builder.shared_filters.delete_failed'),
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
     * - This method is called after each shared_filters save, delete and page load
     */
    private async load_all_shared_filters(props: any[]) {
        const options: { refresh?: boolean } = props?.shift();

        this.is_shared_filters_loading = true;

        // Load shared_filters_from_dashboard
        const shared_filters_from_dashboard = await SharedFiltersVOManager.find_shared_filters_from_dashboard_ids(
            [this.dashboard.id],
            null,
            options
        );

        // Load shared_filters_with_dashboard
        const shared_filters_with_dashboard = await SharedFiltersVOManager.find_shared_filters_with_dashboard_ids(
            [this.dashboard.id],
            null,
            options
        );

        this.shared_filters_from_dashboard = shared_filters_from_dashboard;
        this.shared_filters_with_dashboard = shared_filters_with_dashboard;

        this.is_shared_filters_loading = false;
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