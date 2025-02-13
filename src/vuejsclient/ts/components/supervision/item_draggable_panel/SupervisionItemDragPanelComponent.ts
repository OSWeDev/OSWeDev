import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import './SupervisionitemDragPanelComponent.scss';
import VueComponentBase from '../../VueComponentBase';
import SupervisedItemComponent from '../item/SupervisedItemComponent';
import { Route } from 'vue-router/types/router';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleSupervision from '../../../../../shared/modules/Supervision/ModuleSupervision';

@Component({
    template: require('./SupervisionitemDragPanelComponent.pug'),
    components: {
        Superviseditemcomponent: SupervisedItemComponent,
        Draggablewindowcomponent: () => import('../../draggable_window/DraggableWindowComponent'),
    }
})

/**
 * affiche l'item responsable de l'ouverture de l’onglet "supervision" sur ce même onglet
 * à appeler sur le vue_main de l'application, sous réserve de droits d’accès
 */
export default class SupervisionItemDragPanelComponent extends VueComponentBase {
    private sup_item_id: number = null;
    private sup_api_type_id: string = null;
    private has_access_pause: boolean = false;

    @Watch('$route', { immediate: true, deep: false })
    private onRouteChanged(newRoute: Route, oldRoute: Route) {
        console.log('Nouvelle route :', newRoute);
        this.set_sup_item_id(newRoute);
        console.log('Ancienne route :', oldRoute);
        // Ici, tu peux appeler une méthode ou mettre à jour des données
    }

    private async mounted(): Promise<void> {
        const route: Route = Object.assign({}, this.$router.currentRoute);
        this.set_sup_item_id(route);
        this.has_access_pause = await ModuleAccessPolicy.getInstance().testAccess(ModuleSupervision.POLICY_ACTION_PAUSE_ACCESS);
    }

    private set_sup_item_id(route: Route) {
        const supItemId = route.query.sup_item_id;
        const type = route.query.type;

        this.sup_item_id = supItemId ? parseInt(supItemId) : this.sup_item_id;
        this.sup_api_type_id = type ? type : this.sup_api_type_id;
    }

}