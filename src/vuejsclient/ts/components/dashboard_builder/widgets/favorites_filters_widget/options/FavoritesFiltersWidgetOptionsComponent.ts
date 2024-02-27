import { Prop, Watch } from 'vue-property-decorator';
import Component from 'vue-class-component';
import { cloneDeep } from 'lodash';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import FavoritesFiltersWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import FavoritesFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import './FavoritesFiltersWidgetOptionsComponent.scss';

@Component({
    template: require('./FavoritesFiltersWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class FavoritesFiltersWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private max_visible_options: number = null;

    private filter_visible_options: FavoritesFiltersVO[] = [];
    private actual_query: string = null;

    private next_update_options: FavoritesFiltersWidgetOptionsVO = null;

    private widget_options: FavoritesFiltersWidgetOptionsVO = null;

    // Allow to the user to export its exportable data
    private can_configure_export: boolean = false;

    // Allow to the user to configure date filters
    private can_configure_date_filters: boolean = false;

    // Allow to the user to send an email with the export
    private send_email_with_export_notification: boolean = false;

    // Perform the action of update options
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_update_visible_options = ThrottleHelper.declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false, trailing: true });

    private last_launch_cpt: number = 0;

    /**
     * Watch on page_widget
     *  - Shall happen first on component init or each time page_widget changes
     *
     * @returns {void}
     */
    @Watch('page_widget', { immediate: true, deep: true })
    private onchange_page_widget(): void {
        this.widget_options = this.get_widget_options();
    }

    /**
     * Watch on widget_options
     *  - Shall happen first on component init or each time widget_options changes
     *
     * @returns {void}
     */
    @Watch('widget_options', { immediate: true })
    private onchange_widget_options(): void {
        if (!this.widget_options) {
            this.max_visible_options = null;
            return;
        }

        this.send_email_with_export_notification = this.widget_options.send_email_with_export_notification;
        this.can_configure_date_filters = this.widget_options.can_configure_date_filters;
        this.can_configure_export = this.widget_options.can_configure_export;
        this.max_visible_options = this.widget_options.max_visible_options;
    }

    /**
     * Watch on max_visible_options
     *  - Shall happen each time max_visible_options changes
     *
     * @returns {Promise<void>}
     */
    @Watch('max_visible_options')
    private async onchange_max_visible_options(): Promise<void> {
        if (!this.widget_options) {
            return;
        }

        if (this.widget_options.max_visible_options != this.max_visible_options) {
            this.next_update_options = this.widget_options;
            this.next_update_options.max_visible_options = this.max_visible_options;

            this.throttled_update_options();
        }
    }

    /**
     * toggle_can_configure_export
     *  - Allow to the user to show select_all of the active filter options
     */
    private async toggle_can_configure_export() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { can_configure_export: this.can_configure_export }
            );
        }

        this.next_update_options.can_configure_export = !this.next_update_options.can_configure_export;

        this.throttled_update_options();
    }

    /**
     * toggle_can_configure_date_filters
     *  - Allow to the user to show select_all of the active filter options
     */
    private async toggle_can_configure_date_filters() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { can_configure_date_filters: this.can_configure_date_filters }
            );
        }

        this.next_update_options.can_configure_date_filters = !this.next_update_options.can_configure_date_filters;

        this.throttled_update_options();
    }

    /**
     * toggle_send_email_with_export_notification
     */
    private async toggle_send_email_with_export_notification() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.create_widget_options().from(
                { send_email_with_export_notification: this.send_email_with_export_notification }
            );
        }

        this.next_update_options.send_email_with_export_notification = !this.next_update_options.send_email_with_export_notification;

        this.throttled_update_options();
    }

    /**
     * update_visible_options
     *  - Do update visible options
     * @returns {Promise<void>}
     */
    private async update_visible_options(): Promise<void> {

        // Last time this method has been launched
        const launch_cpt: number = (this.last_launch_cpt + 1);

        this.last_launch_cpt = launch_cpt;

        if ((!this.widget_options) || (!this.vo_field_ref)) {
            this.filter_visible_options = [];
            return;
        }

        const field_sort: VOFieldRefVO = this.vo_field_ref;

        const tmp: FavoritesFiltersVO[] = await query(this.vo_field_ref.api_type_id)
            .set_limit(this.max_visible_options)
            .set_sort(new SortByVO(field_sort.api_type_id, field_sort.field_id, true))
            .select_vos<FavoritesFiltersVO>();

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_launch_cpt != launch_cpt) {
            return;
        }

        if (!(tmp?.length > 0)) {
            this.filter_visible_options = [];
        } else {
            this.filter_visible_options = tmp;
        }
    }

    /**
     * update_options
     *  - Do update options
     *
     * @returns {Promise<void>}
     */
    private async update_options(): Promise<void> {

        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.error(error);
        }

        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);
        this.$emit('update_layout_widget', this.page_widget);

        const name = VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.page_widget.widget_id].name;
        const get_selected_fields = DashboardBuilderWidgetsController.getInstance().widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});

        this.throttled_update_visible_options();
    }

    /**
     * handle_remove_field_ref
     *
     * @return {Promise<void>}
     */
    private async handle_remove_field_ref(): Promise<void> {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            return null;
        }

        if (!this.next_update_options.vo_field_ref) {
            return null;
        }

        this.next_update_options.vo_field_ref = null;

        this.throttled_update_options();
    }

    /**
     * handle_add_field_ref
     *
     * @return {Promise<void>}
     */
    private async handle_add_field_ref(api_type_id: string, field_id: string): Promise<void> {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = new FavoritesFiltersWidgetOptionsVO().from({
                max_visible_options: this.max_visible_options,
                vo_field_ref: this.vo_field_ref,
            });
        }

        const vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        this.next_update_options.vo_field_ref = vo_field_ref;

        this.throttled_update_options();
    }

    /**
     *  Widget Options
     *   - Load default widget option (from backend)
     */
    private get_widget_options(): FavoritesFiltersWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: FavoritesFiltersWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as FavoritesFiltersWidgetOptionsVO;
                options = options ? new FavoritesFiltersWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * create_widget_options
     * - Return default widget options
     *
     * @returns {FavoritesFiltersWidgetOptionsVO}
     */
    private create_widget_options(
        props?: Partial<FavoritesFiltersWidgetOptionsVO>
    ): FavoritesFiltersWidgetOptionsVO {

        return new FavoritesFiltersWidgetOptionsVO(
            null,
            50,
            false,
            false,
        ).from(props);
    }

    /**
     * Get vo_field_ref
     */
    get vo_field_ref(): VOFieldRefVO {
        return new VOFieldRefVO().from({
            api_type_id: FavoritesFiltersVO.API_TYPE_ID,
            field_id: "name"
        });
    }
}