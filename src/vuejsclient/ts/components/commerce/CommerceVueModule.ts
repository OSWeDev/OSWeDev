import ModuleCommerce from '../../../../shared/modules/Commerce/ModuleCommerce';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import CommandeListeComponent from './commande/liste/CommandeListeComponent';
import CommandeDetailComponent from './commande/detail/CommandeDetailComponent';
import ClientComponent from './client/ClientComponent';
import { RouteConfig } from 'vue-router';

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
        let routes: Array<{ route: RouteConfig, icon: string, text: string }> = [];

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
            component: CommandeListeComponent
        };
    }

    private getRouteCommandeDetail(): RouteConfig {
        return {
            path: '/commande/:commande_id',
            name: 'commande_detail',
            component: CommandeDetailComponent,
            props: (route) => ({
                commande_id: parseInt(route.params.commande_id)
            })
        };
    }
}