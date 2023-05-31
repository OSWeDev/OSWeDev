import { Component } from 'vue-property-decorator';
import VueComponentBase from '../../../VueComponentBase';
import './VarsDatasExplorerComponent.scss';

@Component({
    template: require('./VarsDatasExplorerComponent.pug'),
    components: {
        Varsdatasexplorervisualizationcomponent: () => import('./visualization/VarsDatasExplorerVisualizationComponent'),
        Varsdatasexploreractionscomponent: () => import('./actions/VarsDatasExplorerActionsComponent'),
        Varsdatasexplorerfilterscomponent: () => import('./filters/VarsDatasExplorerFiltersComponent'),
    }
})
export default class VarsDatasExplorerComponent extends VueComponentBase {
}