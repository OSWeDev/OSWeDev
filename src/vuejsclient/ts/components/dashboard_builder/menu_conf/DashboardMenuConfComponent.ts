import Component from 'vue-class-component';
import { GridItem, GridLayout } from "vue-grid-layout";
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';
import IEditableDashboardPage from '../../../../../shared/modules/DashboardBuilder/interfaces/IEditableDashboardPage';
import DashboardPageVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import MenuOrganizerComponent from '../../menu/organizer/MenuOrganizerComponent';
import VueComponentBase from '../../VueComponentBase';
import { ModuleDashboardPageAction } from '../page/DashboardPageStore';
import DashboardBuilderWidgetsController from '../widgets/DashboardBuilderWidgetsController';
import './DashboardMenuConfComponent.scss';

@Component({
    template: require('./DashboardMenuConfComponent.pug'),
    components: {
        Menuorganizercomponent: MenuOrganizerComponent
    }
})
export default class DashboardMenuConfComponent extends VueComponentBase {

    @Prop()
    private dashboard: DashboardVO;


}