import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../../../VueComponentBase';
import './CeliaThreadWidgetIconComponent.scss';

@Component({
    template: require('./CeliaThreadWidgetIconComponent.pug'),
    components: {
    }
})
export default class CeliaThreadWidgetIconComponent extends VueComponentBase {

    @Prop()
    private widget: DashboardWidgetVO;
}