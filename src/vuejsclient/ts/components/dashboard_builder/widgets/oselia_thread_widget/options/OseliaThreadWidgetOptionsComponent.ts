import Component from 'vue-class-component';
import { Inject, Prop } from 'vue-property-decorator';
import DashboardPageWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import { reflect } from '../../../../../../../shared/tools/ObjectHandler';
import InlineTranslatableText from '../../../../InlineTranslatableText/InlineTranslatableText';
import VueComponentBase from '../../../../VueComponentBase';
import { ModuleDroppableVoFieldsAction } from '../../../droppable_vo_fields/DroppableVoFieldsStore';
import OseliaThreadWidgetOptions from './OseliaThreadWidgetOptions';
import './OseliaThreadWidgetOptionsComponent.scss';

@Component({
    template: require('./OseliaThreadWidgetOptionsComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText
    }
})
export default class OseliaThreadWidgetOptionsComponent extends VueComponentBase {
    @Inject('storeNamespace') readonly storeNamespace!: string;

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @ModuleDroppableVoFieldsAction
    private set_selected_fields: (selected_fields: { [api_type_id: string]: { [field_id: string]: boolean } }) => void;

    get get_dashboard_api_type_ids(): string[] {
        return this.vuexGet<string[]>(reflect<this>().get_dashboard_api_type_ids);
    }


    get default_title_translation(): string {
        return 'OseliaThreadWidget#' + this.page_widget.id;
    }

    get widget_options(): OseliaThreadWidgetOptions {
        if (!this.page_widget) {
            return null;
        }

        return new OseliaThreadWidgetOptions();
    }

    // Accès dynamiques Vuex
    public vuexGet<T>(getter: string): T {
        return (this.$store.getters as any)[`${this.storeNamespace}/${getter}`];
    }
    public vuexAct<A>(action: string, payload?: A) {
        return this.$store.dispatch(`${this.storeNamespace}/${action}`, payload);
    }

    public set_page_widget(page_widget: DashboardPageWidgetVO) {
        return this.vuexAct(reflect<this>().set_page_widget, page_widget);
    }

}