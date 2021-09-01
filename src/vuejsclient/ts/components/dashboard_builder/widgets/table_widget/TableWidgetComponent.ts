import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleContextFilter from '../../../../../../shared/modules/ContextFilter/ModuleContextFilter';
import ContextFilterVO from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ModuleTableField from '../../../../../../shared/modules/ModuleTableField';
import VOsTypesManager from '../../../../../../shared/modules/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import { ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import TableWidgetOptions from './options/TableWidgetOptions';
import './TableWidgetComponent.scss';

@Component({
    template: require('./TableWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class TableWidgetComponent extends VueComponentBase {

    @ModuleDashboardPageGetter
    private get_active_field_filters: { [api_type_id: string]: { [field_id: string]: ContextFilterVO } };

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private data_rows: any[] = [];

    private throttled_update_visible_options = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_visible_options.bind(this), 300, { leading: false });

    get vo_field_refs(): VOFieldRefVO[] {

        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.vo_field_refs;
    }

    get fields(): { [vo_ref_field_id: number]: ModuleTableField<any> } {
        let res: { [vo_ref_field_id: number]: ModuleTableField<any> } = {};

        if (!this.widget_options) {
            return res;
        }

        for (let i in this.widget_options.vo_field_refs) {
            let vo_field_ref = this.widget_options.vo_field_refs[i];

            res[vo_field_ref.id] = VOsTypesManager.getInstance().moduleTables_by_voType[vo_field_ref.api_type_id].get_field_by_id(vo_field_ref.field_id);
        }

        return res;
    }

    @Watch('get_active_field_filters', { deep: true })
    private async onchange_active_field_filters() {
        await this.throttled_update_visible_options();
    }

    private async update_visible_options() {

        if (!this.widget_options) {
            this.data_rows = [];
            return;
        }

        // TODO remplacer puisqu'on doit pouvoir grouper en fonction de tous les fields et récupérer directement toute le table.
        //  par ailleurs si on veut pouvoir mettre des vars, il faut pouvoir identifier le context de la ligne
        //  (peut - être en prenant les valeurs de toutes les colonnes qui ne sont pas des vars)
        if ((!this.widget_options.vo_field_refs) || (this.widget_options.vo_field_refs.length != 1)) {
            this.data_rows = [];
            return;
        }

        let field_ref = this.widget_options.vo_field_refs[0];
        this.data_rows = await ModuleContextFilter.getInstance().get_filter_visible_options(
            field_ref.api_type_id,
            field_ref.field_id,
            this.get_active_field_filters,
            this.dashboard.api_type_ids,
            null,
            100,
            0
        );
    }

    @Watch('widget_options', { immediate: true })
    private async onchange_widget_options() {

        await this.throttled_update_visible_options();
    }

    get title_name_code_text() {
        if (!this.widget_options) {
            return null;
        }
        return this.widget_options.title_name_code_text;
    }

    get widget_options(): TableWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        let options: TableWidgetOptions = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as TableWidgetOptions;
                options = new TableWidgetOptions(options.vo_field_refs, options.page_widget_id);
            }
        } catch (error) {
            ConsoleHandler.getInstance().error(error);
        }

        return options;
    }
}