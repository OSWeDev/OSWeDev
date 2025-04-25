import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import 'vue-slider-component/theme/default.css';
import DashboardWidgetVO from '../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../../../VueComponentBase';
import './CMSCrudButtonsWidgetIconComponent.scss';

@Component({
    template: require('./CMSCrudButtonsWidgetIconComponent.pug'),
    components: {
    }
})
export default class CMSCrudButtonsWidgetIconComponent extends VueComponentBase {

    @Prop()
    private widget: DashboardWidgetVO;
}