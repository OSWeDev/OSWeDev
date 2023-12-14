import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import 'vue-slider-component/theme/default.css';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../../../VueComponentBase';
import './CurrentUserFilterWidgetIconComponent.scss';

@Component({
    template: require('./CurrentUserFilterWidgetIconComponent.pug'),
    components: {
    }
})
export default class CurrentUserFilterWidgetIconComponent extends VueComponentBase {

    @Prop()
    private widget: DashboardWidgetVO;
}