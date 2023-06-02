import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { ModuleTranslatableTextAction } from '../../InlineTranslatableText/TranslatableTextStore';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
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

    private menu_app: { [app_name: string]: number } = {};
    private app_names: string[] = [];

    private is_loading: boolean = true;

    @Watch('dashboard', { immediate: true })
    private async onchange_dashboard() {
    }
}