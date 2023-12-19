import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import SupervisionTypeWidgetManager from '../../../../../../../shared/modules/DashboardBuilder/manager/SupervisionTypeWidgetManager';
import LogMonitoringWidgetOptionsVO from '../../../../../../../shared/modules/DashboardBuilder/vos/LogMonitoringWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOsTypesManager from '../../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import './LogMonitoringWidgetOptionsComponent.scss';

@Component({
    template: require('./LogMonitoringWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
    }
})
export default class LogMonitoringWidgetOptionsComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private next_update_options: LogMonitoringWidgetOptionsVO = null;
    private throttled_update_options = ThrottleHelper.declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    private supervision_api_type_ids: string[] = [];
    private refresh_button: boolean = true;
    private auto_refresh: boolean = true;
    private show_bulk_edit: boolean = true;
    private limit: number = 100;
    private auto_refresh_seconds: number = 30;

    private supervision_select_options: string[] = [];

    @Watch('page_widget', { immediate: true })
    private async onchange_page_widget() {

    }

    @Watch('supervision_api_type_ids')
    private async onchange_supervision_api_type_ids() {

    }

    @Watch('limit')
    private async onchange_limit() {

    }

    @Watch('auto_refresh_seconds')
    private async onchange_auto_refresh_seconds() {

    }

    @Watch('show_bulk_edit')
    private async onchange_show_bulk_edit() {

    }

    private initialize() {

    }

    private supervision_select_label(api_type_id: string): string {
        return this.label('supervision_widget_component.' + api_type_id);
    }

    private get_default_options(): LogMonitoringWidgetOptionsVO {
        return new LogMonitoringWidgetOptionsVO();
    }

    private async update_options() {

    }

    private async switch_refresh_button() {

    }

    private async switch_auto_refresh() {

    }

    private async switch_show_bulk_edit() {

    }


    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get default_title_translation(): string {
        return 'Supervision#' + this.page_widget.id;
    }

    get widget_options(): LogMonitoringWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: LogMonitoringWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as LogMonitoringWidgetOptionsVO;
                options = options ? new LogMonitoringWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}