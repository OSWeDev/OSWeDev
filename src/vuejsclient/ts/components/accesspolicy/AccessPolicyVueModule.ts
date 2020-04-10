import { RouteConfig } from 'vue-router';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import VueModuleBase from '../../../ts/modules/VueModuleBase';

export default class AccessPolicyVueModule extends VueModuleBase {
    public static getInstance(): AccessPolicyVueModule {
        if (!AccessPolicyVueModule.instance) {
            AccessPolicyVueModule.instance = new AccessPolicyVueModule();
        }

        return AccessPolicyVueModule.instance;
    }

    private static instance: AccessPolicyVueModule = null;

    private constructor() {
        super(ModuleAccessPolicy.getInstance().name);
    }

    public initialize() {
        this.routes.push(
            this.getRouteUser()
        );
    }

    public getRoutesMenu(): Array<{ route: RouteConfig, icon: string, text: string }> {
        let routes: Array<{ route: RouteConfig, icon: string, text: string }> = [];

        routes.push({
            route: this.getRouteUser(),
            icon: 'fa-user',
            text: 'menu.mon-compte'
        });

        return routes;
    }

    private getRouteUser(): RouteConfig {
        return {
            path: '/user',
            name: 'user',
            component: () => import(/* webpackChunkName: "UserComponent" */ './user/UserComponent')
        };
    }
}