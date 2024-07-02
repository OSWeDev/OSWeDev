import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../../../VueComponentBase';
import './OseliaThreadWidgetIconComponent.scss';

@Component({
    template: require('./OseliaThreadWidgetIconComponent.pug'),
    components: {
    }
})
export default class OseliaThreadWidgetIconComponent extends VueComponentBase {

    @Prop()
    private widget: DashboardWidgetVO;
}