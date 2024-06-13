import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import VueComponentBase from '../../VueComponentBase';
import './DashboardPrinterComponent.scss';
import DashboardViewerComponent from '../viewer/DashboardViewerComponent';

@Component({
    template: require('./DashboardPrinterComponent.pug'),
    components: {
        Dashboardviewercomponent: DashboardViewerComponent,
    }
})
export default class DashboardPrinterComponent extends VueComponentBase {

    @Prop({ default: null })
    private dashboard_id: number;
}