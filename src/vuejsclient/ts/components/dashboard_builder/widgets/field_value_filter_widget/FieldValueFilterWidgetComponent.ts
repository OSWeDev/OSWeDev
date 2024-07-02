import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VOFieldRefVOHandler from '../../../../../../shared/modules/DashboardBuilder/handlers/VOFieldRefVOHandler';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldValueFilterWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldValueFilterWidgetOptionsVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import './FieldValueFilterWidgetComponent.scss';

@Component({
    template: require('./FieldValueFilterWidgetComponent.pug'),
    components: {
        Fieldvaluefilterstringwidgetcomponent: () => import(/* webpackChunkName: "FieldValueFilterStringWidgetComponent" */ './string/FieldValueFilterStringWidgetComponent'),
        Fieldvaluefilterbooleanwidgetcomponent: () => import(/* webpackChunkName: "FieldValueFilterBooleanWidgetComponent" */ './boolean/FieldValueFilterBooleanWidgetComponent'),
        Fieldvaluefilterenumwidgetcomponent: () => import(/* webpackChunkName: "FieldValueFilterEnumWidgetComponent" */ './enum/FieldValueFilterEnumWidgetComponent'),
        Fieldvaluefilterdatewidgetcomponent: () => import(/* webpackChunkName: "FieldValueFilterDateWidgetComponent" */ './date/FieldValueFilterDateWidgetComponent'),
        Fieldvaluefilternumberwidgetcomponent: () => import(/* webpackChunkName: "FieldValueFilterNumberWidgetComponent" */ './number/FieldValueFilterNumberWidgetComponent'),
        Fieldvaluefilterreffieldwidgetcomponent: () => import(/* webpackChunkName: "FieldValueFilterRefFieldWidgetComponent" */ './ref_field/FieldValueFilterRefFieldWidgetComponent'),
    }
})
export default class FieldValueFilterWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;

    get is_type_ref_field(): boolean {
        return VOFieldRefVOHandler.is_type_ref_field(this.vo_field_ref);
    }

    get is_type_boolean(): boolean {
        return VOFieldRefVOHandler.is_type_boolean(this.vo_field_ref);
    }

    get is_type_enum(): boolean {
        return VOFieldRefVOHandler.is_type_enum(this.vo_field_ref);
    }

    get is_type_date(): boolean {
        return VOFieldRefVOHandler.is_type_date(this.vo_field_ref);
    }

    get is_type_string(): boolean {
        return VOFieldRefVOHandler.is_type_string(this.vo_field_ref);
    }

    get is_type_number(): boolean {
        return VOFieldRefVOHandler.is_type_number(this.vo_field_ref);
    }

    get vo_field_ref(): VOFieldRefVO {
        const options: FieldValueFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }


        let options: FieldValueFilterWidgetOptionsVO = null;
        try {
            if (this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as FieldValueFilterWidgetOptionsVO;
                options = options ? new FieldValueFilterWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}