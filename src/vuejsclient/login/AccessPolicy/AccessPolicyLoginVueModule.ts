import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import VueModuleBase from '../../ts/modules/VueModuleBase';


export default class AccessPolicyLoginVueModule extends VueModuleBase {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!AccessPolicyLoginVueModule.instance) {
            AccessPolicyLoginVueModule.instance = new AccessPolicyLoginVueModule();
        }

        return AccessPolicyLoginVueModule.instance;
    }

    private static instance: AccessPolicyLoginVueModule = null;

    private constructor() {
        super(ModuleAccessPolicy.getInstance().name);
    }

    public initialize() {
        this.routes = [
            {
                path: '/',
                name: 'login',
                component: () => import('./login/AccessPolicyLoginComponent')
            },
            {
                path: '/signin',
                name: 'signin',
                component: () => import('./signin/AccessPolicySigninComponent')
            },
            {
                path: '/recover',
                name: 'recover',
                component: () => import('./recover/AccessPolicyRecoverComponent')
            },
            {
                path: '/reset',
                name: 'reset',
                component: () => import('./reset/AccessPolicyResetComponent')
            },
            {
                path: '/reset/:user_id/:challenge',
                name: 'reset simplified',
                component: () => import('./reset/AccessPolicyResetComponent'),
                props: (route) => ({
                    prop_user_id: parseInt(route.params.user_id),
                    prop_challenge: route.params.challenge
                })
            }
        ];
    }
}