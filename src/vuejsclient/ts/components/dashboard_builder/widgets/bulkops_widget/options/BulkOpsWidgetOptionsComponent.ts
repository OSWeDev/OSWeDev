import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import TableColumnDescVO from '../../../../../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import VOsTypesManager from '../../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction } from '../../../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../../DashboardBuilderWidgetsController';
import BulkOpsWidgetOptions from './BulkOpsWidgetOptions';
import './BulkOpsWidgetOptionsComponent.scss';

@Component({
    template: require('./BulkOpsWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class BulkOpsWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    private next_update_options: BulkOpsWidgetOptions = null;
    private throttled_update_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_options.bind(this), 50, { leading: false, trailing: true });

    private api_type_id_selected: string = null;

    private editable_columns: TableColumnDescVO[] = null;

    get api_type_id_select_options(): string[] {
        return this.dashboard.api_type_ids;
    }

    private api_type_id_select_label(api_type_id: string): string {
        return this.t(VOsTypesManager.getInstance().moduleTables_by_voType[api_type_id].label.code_text);
    }

    @Watch('page_widget', { immediate: true })
    private onchange_page_widget() {
        if ((!this.page_widget) || (!this.widget_options)) {
            if (!!this.api_type_id_selected) {
                this.api_type_id_selected = null;
            }
            return;
        }

        if (this.api_type_id_selected != this.widget_options.api_type_id) {
            this.api_type_id_selected = this.widget_options.api_type_id;
        }
    }

    @Watch('api_type_id_selected')
    private async onchange_api_type_id_selected() {
        this.next_update_options = this.widget_options;

        if (!this.next_update_options) {
            this.next_update_options = this.get_default_options();
        }

        if (this.next_update_options.api_type_id != this.api_type_id_selected) {
            this.next_update_options.api_type_id = this.api_type_id_selected;
            await this.throttled_update_options();
        }
    }

    private get_default_options(): BulkOpsWidgetOptions {
        return new BulkOpsWidgetOptions(this.page_widget.id, null, 10);
    }

    private async update_options() {
        try {
            this.page_widget.json_options = JSON.stringify(this.next_update_options);
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }
        await ModuleDAO.getInstance().insertOrUpdateVO(this.page_widget);

        this.set_page_widget(this.page_widget);

        let name = VOsTypesManager.getInstance().vosArray_to_vosByIds(DashboardBuilderWidgetsController.getInstance().sorted_widgets)[this.page_widget.widget_id].name;
        let get_selected_fields = DashboardBuilderWidgetsController.getInstance().widgets_get_selected_fields[name];
        this.set_selected_fields(get_selected_fields ? get_selected_fields(this.page_widget) : {});
    }

    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.title_name_code_text;
    }

    get default_title_translation(): string {
        return 'BulkOps#' + this.page_widget.id;
    }

    get widget_options(): BulkOpsWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: BulkOpsWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as BulkOpsWidgetOptions;
                options = options ? new BulkOpsWidgetOptions(options.page_widget_id, options.api_type_id, options.limit) : null;
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }
}