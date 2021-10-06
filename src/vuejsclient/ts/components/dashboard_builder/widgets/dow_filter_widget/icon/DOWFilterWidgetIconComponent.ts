import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import 'vue-slider-component/theme/default.css';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../../../VueComponentBase';
import './DOWFilterWidgetIconComponent.scss';

@Component({
    template: require('./DOWFilterWidgetIconComponent.pug'),
    components: {
    }
})
export default class DOWFilterWidgetIconComponent extends VueComponentBase {

    @Prop()
    private widget: DashboardWidgetVO;
}