import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import './SupervisionitemDragPanelComponent.scss';
import VueComponentBase from '../../VueComponentBase';
import SupervisedItemComponent from '../item/SupervisedItemComponent';
import { Route } from 'vue-router/types/router';

@Component({
    template: require('./SupervisionitemDragPanelComponent.pug'),
    components: {
        Superviseditemcomponent: SupervisedItemComponent,
        Draggablewindowcomponent: () => import('../../draggable_window/DraggableWindowComponent'),
    }
})

export default class SupervisionItemDragPanelComponent extends VueComponentBase {
    private sup_item_id: number = null;
    private sup_api_type_id: string = null;

    @Watch('$route', { immediate: true, deep: false })
    private onRouteChanged(newRoute: Route, oldRoute: Route) {
        console.log('Nouvelle route :', newRoute);
        this.set_sup_item_id(newRoute);
        console.log('Ancienne route :', oldRoute);
        // Ici, tu peux appeler une méthode ou mettre à jour des données
    }

    private mounted(): void {
        const route: Route = Object.assign({}, this.$router.currentRoute);
        this.set_sup_item_id(route);
    }

    private set_sup_item_id(route: Route) {
        const supItemId = route.query.sup_item_id;
        const type = route.query.type;

        this.sup_item_id = supItemId ? parseInt(supItemId) : null;
        this.sup_api_type_id = type ? type : null;
    }

}