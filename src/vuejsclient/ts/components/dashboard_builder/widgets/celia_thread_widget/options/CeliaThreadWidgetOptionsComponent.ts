import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import CeliaThreadWidgetOptions from './CeliaThreadWidgetOptions';
import './CeliaThreadWidgetOptionsComponent.scss';

@Component({
    template: require('./CeliaThreadWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class CeliaThreadWidgetOptionsComponent extends VueComponentBase {

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @ModuleDashboardPageAction
    private set_page_widget: (page_widget: DashboardPageWidgetVO) => void;

    get title_name_code_text(): string {
        if (!this.widget_options) {
            return null;
        }

        return this.widget_options.get_title_name_code_text(this.page_widget.id);
    }

    get default_title_translation(): string {
        return 'CeliaThreadWidget#' + this.page_widget.id;
    }

    get widget_options(): CeliaThreadWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        return new CeliaThreadWidgetOptions();
    }
}