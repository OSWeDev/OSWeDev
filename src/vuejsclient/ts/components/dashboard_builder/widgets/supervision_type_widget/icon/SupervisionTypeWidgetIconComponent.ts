import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import 'vue-slider-component/theme/default.css';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../../../VueComponentBase';
import './SupervisionTypeWidgetIconComponent.scss';

@Component({
    template: require('./SupervisionTypeWidgetIconComponent.pug'),
    components: {
    }
})
export default class SupervisionTypeWidgetIconComponent extends VueComponentBase {

    @Prop()
    private widget: DashboardWidgetVO;
}