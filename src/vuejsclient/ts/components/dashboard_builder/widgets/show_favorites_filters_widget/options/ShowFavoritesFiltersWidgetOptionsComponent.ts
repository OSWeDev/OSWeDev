import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ContextFilterVO from '../../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import './ShowFavoritesFiltersWidgetOptionsComponent.scss';
import FavoritesFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import ShowFavoritesFiltersWidgetOptions from './ShowFavoritesFiltersWidgetOptions';

@Component({
    template: require('./ShowFavoritesFiltersWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class ShowFavoritesFiltersWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private max_visible_options: number = null;

    private filter_visible_options: FavoritesFiltersVO[] = [];
    private actual_query: string = null;

    private next_update_options: ShowFavoritesFiltersWidgetOptions = null;

    // Perform the action of update options
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });
    private throttled_update_visible_options = ThrottleHelper.declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false, trailing: true });

    private last_calculation_cpt: number = 0;

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
     * update_visible_options
     *  - Do update visible options
     * @returns {Promise<void>}
     */
    private async update_visible_options(): Promise<void> {

        let launch_cpt: number = (this.last_calculation_cpt + 1);

        this.last_calculation_cpt = launch_cpt;

        if ((!this.widget_options) || (!this.vo_field_ref)) {
            this.filter_visible_options = [];
            return;
        }

        let field_sort: VOFieldRefVO = this.vo_field_ref;

        let tmp: FavoritesFiltersVO[] = await query(this.vo_field_ref.api_type_id)
            .set_limit(this.max_visible_options)
            .set_sort(new SortByVO(field_sort.api_type_id, field_sort.field_id, true))
            .select_vos<FavoritesFiltersVO>();

        // Si je ne suis pas sur la dernière demande, je me casse
        if (this.last_calculation_cpt != launch_cpt) {
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

        let name = VOsTypesManager.vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.page_widget.widget_id].name;
        let get_selected_fields = DashboardBuilderWidgetsController.getInstance().widgets_get_selected_fields[name];
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
            this.next_update_options = new ShowFavoritesFiltersWidgetOptions(
                this.vo_field_ref,
                this.max_visible_options,
            );
        }

        let vo_field_ref = new VOFieldRefVO();
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
    get widget_options(): ShowFavoritesFiltersWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: ShowFavoritesFiltersWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as ShowFavoritesFiltersWidgetOptions;
                options = options ? new ShowFavoritesFiltersWidgetOptions().from(options) : null;
            } else {
                // Defaults widget options
                options = new ShowFavoritesFiltersWidgetOptions().from({
                    max_visible_options: 50,
                });
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    /**
     * Get vo_field_ref
     */
    get vo_field_ref(): VOFieldRefVO {
        const vo = new FavoritesFiltersVO();

        return new VOFieldRefVO().from({
            api_type_id: vo._type,
            field_id: "name",
            _type: "vo_field_ref"
        });
    }
}