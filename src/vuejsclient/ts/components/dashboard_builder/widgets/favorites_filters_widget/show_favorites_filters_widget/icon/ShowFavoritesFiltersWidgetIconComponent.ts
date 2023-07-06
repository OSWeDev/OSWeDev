import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import DashboardWidgetVO from '../../../../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import VueComponentBase from '../../../../../VueComponentBase';
import './ShowFavoritesFiltersWidgetIconComponent.scss';
import 'vue-slider-component/theme/default.css';

@Component({
    template: require('./ShowFavoritesFiltersWidgetIconComponent.pug'),
    components: {
    }
})
export default class ShowFavoritesFiltersWidgetIconComponent extends VueComponentBase {

    @Prop()
    private widget: DashboardWidgetVO;
}