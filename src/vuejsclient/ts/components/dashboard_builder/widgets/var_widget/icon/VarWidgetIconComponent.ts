import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import 'vue-slider-component/theme/default.css';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../../../VueComponentBase';
import './VarWidgetIconComponent.scss';

@Component({
    template: require('./VarWidgetIconComponent.pug'),
    components: {
    }
})
export default class VarWidgetIconComponent extends VueComponentBase {

    @Prop()
    private widget: DashboardWidgetVO;

    get tooltip(): string {
        if (!this.widget) {
            return null;
        }

        return this.label('dashboards.widgets.icons_tooltips.' + this.widget.name);
    }
}