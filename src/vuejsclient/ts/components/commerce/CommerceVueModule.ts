import { RouteConfig } from 'vue-router';
import ModuleCommerce from '../../../../shared/modules/Commerce/ModuleCommerce';
import VueModuleBase from '../../../ts/modules/VueModuleBase';

export default class CommerceVueModule extends VueModuleBase {
    public static getInstance(): CommerceVueModule {
        if (!CommerceVueModule.instance) {
            CommerceVueModule.instance = new CommerceVueModule();
        }

        return CommerceVueModule.instance;
    }

    private static instance: CommerceVueModule = null;

    private constructor() {
        super(ModuleCommerce.getInstance().name);
    }

    public initialize() {
        this.routes.push(
            this.getRouteCommandes(),
            this.getRouteCommandeDetail(),
        );
    }

    public getRoutesMenu(): Array<{ route: RouteConfig, icon: string, text: string }> {
        const routes: Array<{ route: RouteConfig, icon: string, text: string }> = [];

        routes.push({
            route: this.getRouteCommandes(),
            icon: 'fa-shopping-cart',
            text: 'menu.mes-commandes'
        });

        return routes;
    }

    private getRouteCommandes(): RouteConfig {
        return {
            path: '/commandes',
            name: 'commandes',
            component: () => import('./commande/liste/CommandeListeComponent')
        };
    }

    private getRouteCommandeDetail(): RouteConfig {
        return {
            path: '/commande/:commande_id',
            name: 'commande_detail',
            component: () => import('./commande/detail/CommandeDetailComponent'),
            props: (route) => ({
                commande_id: parseInt(route.params.commande_id)
            })
        };
    }
}