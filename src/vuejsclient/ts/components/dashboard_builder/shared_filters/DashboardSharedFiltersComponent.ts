import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import DashboardPageVOManager from '../../../../../shared/modules/DashboardBuilder/manager/DashboardPageVOManager';
import { ModuleTranslatableTextAction } from '../../InlineTranslatableText/TranslatableTextStore';
import FieldFiltersVO from '../../../../../shared/modules/ContextFilter/vos/FieldFiltersVO';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ThrottleHelper from '../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../VueComponentBase';
import './DashboardSharedFiltersComponent.scss';
import VueAppController from '../../../../VueAppController';

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
    //
    private page_sharable_api_field_filters: { [page_id: number]: FieldFiltersVO } = {};

    private throttled_load_dashboard_pages = ThrottleHelper.getInstance().declare_throttle_without_args(
        this.load_dashboard_pages.bind(this),
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