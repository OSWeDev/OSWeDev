import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import CurrentUserFilterWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/CurrentUserFilterWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import FieldFiltersVO from '../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import VOFieldRefVO from '../../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import UserVO from '../../../../../../../shared/modules/AccessPolicy/vos/UserVO';
import VueComponentBase from '../../../../VueComponentBase';
import SingleVoFieldRefHolderComponent from '../../../options_tools/single_vo_field_ref_holder/SingleVoFieldRefHolderComponent';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import './CurrentUserFilterWidgetOptionsComponent.scss';

@Component({
    template: require('./CurrentUserFilterWidgetOptionsComponent.pug'),
    components: {
        Singlevofieldrefholdercomponent: SingleVoFieldRefHolderComponent,
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class CurrentUserFilterWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleDashboardPageGetter
    private get_active_api_type_ids: string[];

    @ModuleDashboardPageGetter
    private get_query_api_type_ids: string[];

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private vo_field_ref: VOFieldRefVO = null;
    private hide_filter: boolean = true;

    private next_update_options: CurrentUserFilterWidgetOptionsVO = null;

    private widget_options: CurrentUserFilterWidgetOptionsVO = null;

    // Perform the action of update options
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(
        this.update_options.bind(this),
        50,
        { leading: false, trailing: true }
    );

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
            return;
        }

        this.vo_field_ref = this.widget_options.vo_field_ref ?
            new VOFieldRefVO().from(this.widget_options.vo_field_ref) : null;
        this.hide_filter = this.widget_options.hide_filter;
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
    }

    /**
     *  Widget Options
     *   - Load default widget option (from backend)
     */
    private get_widget_options(): CurrentUserFilterWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CurrentUserFilterWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CurrentUserFilterWidgetOptionsVO;
                options = options ? new CurrentUserFilterWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
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
            this.next_update_options = new CurrentUserFilterWidgetOptionsVO().from({
                vo_field_ref: this.vo_field_ref,
            });
        }

        let vo_field_ref = new VOFieldRefVO();
        vo_field_ref.api_type_id = api_type_id;
        vo_field_ref.field_id = field_id;
        vo_field_ref.weight = 0;

        this.next_update_options.vo_field_ref = vo_field_ref;

        this.throttled_update_options();
    }

    /**
     * Get vo_field_ref
     */
    get default_vo_field_ref(): VOFieldRefVO {
        return new VOFieldRefVO().from({
            api_type_id: UserVO.API_TYPE_ID,
            field_id: "id"
        });
    }

    get default_placeholder_translation(): string {
        return this.label('CurrentUserFilterWidget.filter_placeholder');
    }
}