import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import 'vue-slider-component/theme/default.css';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../../../VueComponentBase';
import './VarBarLineChartWidgetIconComponent.scss';

@Component({
    template: require('./VarBarLineChartWidgetIconComponent.pug'),
    components: {
    }
})
export default class VarBarLineChartWidgetIconComponent extends VueComponentBase {

    @Prop()
    private widget: DashboardWidgetVO;
}