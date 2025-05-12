import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import 'vue-slider-component/theme/default.css';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../../../VueComponentBase';
import './OseliaRunGraphWidgetIconComponent.scss';

@Component({
    template: require('./OseliaRunGraphWidgetIconComponent.pug'),
    components: {
    }
})
export default class OseliaRunGraphWidgetIconComponent extends VueComponentBase {

    @Prop()
    private widget: DashboardWidgetVO;
}