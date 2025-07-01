import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import 'vue-slider-component/theme/default.css';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../../../VueComponentBase';
import './CMSPrintParamWidgetIconComponent.scss';

@Component({
    template: require('./CMSPrintParamWidgetIconComponent.pug'),
    components: {
    }
})
export default class CMSPrintParamWidgetIconComponent extends VueComponentBase {

    @Prop()
    private widget: DashboardWidgetVO;
}