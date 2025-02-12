import 'quill/dist/quill.bubble.css'; // Compliqué à lazy load
import 'quill/dist/quill.core.css'; // Compliqué à lazy load
import 'quill/dist/quill.snow.css'; // Compliqué à lazy load
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import CMSPrintParamWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/CMSPrintParamWidgetOptionsVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import './CMSPrintParamWidgetComponent.scss';
import ParamVO from '../../../../../../shared/modules/Params/vos/ParamVO';
import ModuleParams from '../../../../../../shared/modules/Params/ModuleParams';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';

@Component({
    template: require('./CMSPrintParamWidgetComponent.pug'),
    components: {}
})
export default class CMSPrintParamWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    private titre: string = null;
    private type_param: number = null;
    private param: ParamVO = null;

    private printed_param: string = null;

    get widget_options(): CMSPrintParamWidgetOptionsVO {
        if (!this.page_widget) {
            return null;
        }

        let options: CMSPrintParamWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as CMSPrintParamWidgetOptionsVO;
                options = options ? new CMSPrintParamWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }

    @Watch('widget_options', { immediate: true, deep: true })
    private async onchange_widget_options() {
        if (!this.widget_options) {
            this.titre = "";
            this.type_param = null;
            this.param = null;
            return;
        }

        this.titre = this.widget_options.titre;
        this.type_param = this.widget_options.type_param;
        this.param = this.widget_options.param;

        this.printed_param = await this.get_value_param(this.param, this.type_param);
    }

    private async mounted() {
        this.onchange_widget_options();
    }

    private async get_value_param(param: ParamVO, type_param: number): Promise<string> {
        if (!param || !type_param) {
            return null;
        }

        let bool: boolean = false;
        let date: number = null;
        switch (type_param) {

            case CMSPrintParamWidgetOptionsVO.TYPE_STRING:
                return await ModuleParams.getInstance().getParamValueAsString(param.name);

            case CMSPrintParamWidgetOptionsVO.TYPE_BOOLEAN:
                bool = await ModuleParams.getInstance().getParamValueAsBoolean(param.name);
                return bool ? this.label('print_param.boolean.true') : this.label('print_param.boolean.false');

            case CMSPrintParamWidgetOptionsVO.TYPE_INT:
                return (await ModuleParams.getInstance().getParamValueAsInt(param.name)).toString();

            case CMSPrintParamWidgetOptionsVO.TYPE_FLOAT:
                return (await ModuleParams.getInstance().getParamValueAsFloat(param.name)).toString();

            case CMSPrintParamWidgetOptionsVO.TYPE_DATE:
                date = await ModuleParams.getInstance().getParamValueAsInt(param.name);
                return date ? Dates.format(date, "DD/MM/YYYY") : null;

            default:
                return null;
        }
    }
}