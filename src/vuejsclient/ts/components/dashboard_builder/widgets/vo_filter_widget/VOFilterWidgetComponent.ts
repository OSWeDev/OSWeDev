import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import VOFieldRefVOHandler from '../../../../../../shared/modules/DashboardBuilder/handlers/VOFieldRefVOHandler';
import VOFilterWidgetOptionsVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFilterWidgetOptionsVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import VOFieldRefVO from '../../../../../../shared/modules/DashboardBuilder/vos/VOFieldRefVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueComponentBase from '../../../VueComponentBase';
import VOFilterForeignKeyWidgetComponent from './foreign_key/VOFilterForeignKeyWidgetComponent';
import './VOFilterWidgetComponent.scss';

@Component({
    template: require('./VOFilterWidgetComponent.pug'),
    components: {
        Vofilterforeignkeywidgetcomponent: VOFilterForeignKeyWidgetComponent
    }
})
export default class VOFilterWidgetComponent extends VueComponentBase {

    @Prop({ default: null })
    private page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    private all_page_widget: DashboardPageWidgetVO[];

    @Prop({ default: null })
    private dashboard: DashboardVO;

    @Prop({ default: null })
    private dashboard_page: DashboardPageVO;


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
        let options: VOFilterWidgetOptionsVO = this.widget_options;

        if ((!options) || (!options.vo_field_ref)) {
            return null;
        }

        return Object.assign(new VOFieldRefVO(), options.vo_field_ref);
    }

    get widget_options() {
        if (!this.page_widget) {
            return null;
        }


        let options: VOFilterWidgetOptionsVO = null;
        try {
            if (!!this.page_widget.json_options) {
                options = JSON.parse(this.page_widget.json_options) as VOFilterWidgetOptionsVO;
                options = options ? new VOFilterWidgetOptionsVO().from(options) : null;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return options;
    }
}