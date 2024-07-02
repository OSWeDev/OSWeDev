import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import 'vue-slider-component/theme/default.css';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../../../VueComponentBase';
import './VarChoroplethChartWidgetIconComponent.scss';

@Component({
    template: require('./VarChoroplethChartWidgetIconComponent.pug'),
    components: {}
})
export default class VarChoroplethChartWidgetIconComponent extends VueComponentBase {

    @Prop()
    private widget: DashboardWidgetVO;
}