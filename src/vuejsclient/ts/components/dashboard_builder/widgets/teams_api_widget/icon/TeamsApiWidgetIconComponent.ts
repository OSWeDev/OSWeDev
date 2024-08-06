import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import 'vue-slider-component/theme/default.css';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../../../VueComponentBase';
import './TeamsApiWidgetIconComponent.scss';

@Component({
    template: require('./TeamsApiWidgetIconComponent.pug'),
    components: {
    }
})
export default class TeamsApiWidgetIconComponent extends VueComponentBase {

}