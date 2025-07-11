import { RouteConfig } from 'vue-router';
import ModuleOselia from '../../../../shared/modules/Oselia/ModuleOselia';
import VueModuleBase from '../../../ts/modules/VueModuleBase';

export default class OseliaVueModule extends VueModuleBase {
    private static instance: OseliaVueModule = null;

    private constructor() {
        super(ModuleOselia.getInstance().name);
    }

    public static getInstance(): OseliaVueModule {
        if (!OseliaVueModule.instance) {
            OseliaVueModule.instance = new OseliaVueModule();
        }

        return OseliaVueModule.instance;
    }

    public initialize() {
        this.routes.push(
            this.get_route_oselia_referrer_not_found(),
            this.get_route_oselia_referrer_activation(),
            ...this.get_routes_oselia(),
        );
    }

    private get_routes_oselia(): RouteConfig[] {
        return [{
            path: '/oselia/:thread_vo_id',
            name: 'oselia',
            component: () => import('./oselia_db/OseliaDBComponent'),
            props: (route) => ({
                thread_vo_id: parseInt(route.params.thread_vo_id),
                parent_client_tab_id: null,
            })
        }, {
            path: '/oselia/:thread_vo_id/:parent_client_tab_id',
            name: 'oselia',
            component: () => import('./oselia_db/OseliaDBComponent'),
            props: (route) => ({
                thread_vo_id: parseInt(route.params.thread_vo_id),
                parent_client_tab_id: route.params.parent_client_tab_id,
            })
        }];
    }


    private get_route_oselia_referrer_not_found(): RouteConfig {
        return {
            path: '/oselia_referrer_not_found',
            name: 'oselia_referrer_not_found',
            component: () => import('./oselia_referrer_not_found/OseliaReferrerNotFoundComponent')
        };
    }

    private get_route_oselia_referrer_activation(): RouteConfig {
        return {
            path: '/oselia_referrer_activation/:referrer_user_ott/:openai_thread_id/:openai_assistant_id',
            name: 'oselia_referrer_activation',
            caseSensitive: true,
            component: () => import('./oselia_referrer_activation/OseliaReferrerActivationComponent'),
            props: (route) => ({
                referrer_user_ott: route.params.referrer_user_ott,
                openai_thread_id: route.params.openai_thread_id,
                openai_assistant_id: route.params.openai_assistant_id
            })
        };
    }
}