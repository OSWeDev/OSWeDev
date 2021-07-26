import { Component } from 'vue-property-decorator';
import VueComponentBase from '../../../VueComponentBase';
import './VarsDatasExplorerComponent.scss';

@Component({
    template: require('./VarsDatasExplorerComponent.pug'),
    components: {
        Varsdatasexplorervisualizationcomponent: () => import(/* webpackChunkName: "VarsDatasExplorerVisualizationComponent" */ './visualization/VarsDatasExplorerVisualizationComponent'),
        Varsdatasexploreractionscomponent: () => import(/* webpackChunkName: "VarsDatasExplorerActionsComponent" */ './actions/VarsDatasExplorerActionsComponent'),
        Varsdatasexplorerfilterscomponent: () => import(/* webpackChunkName: "VarsDatasExplorerFiltersComponent" */ './filters/VarsDatasExplorerFiltersComponent'),
    }
})
export default class VarsDatasExplorerComponent extends VueComponentBase {
}