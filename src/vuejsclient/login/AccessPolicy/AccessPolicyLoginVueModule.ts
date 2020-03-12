import ModuleAccessPolicy from '../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import VueModuleBase from '../../ts/modules/VueModuleBase';
import AccessPolicyLoginComponent from './login/AccessPolicyLoginComponent';
import AccessPolicyRecoverComponent from './recover/AccessPolicyRecoverComponent';
import AccessPolicyResetComponent from './reset/AccessPolicyResetComponent';


export default class AccessPolicyLoginVueModule extends VueModuleBase {

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
                component: AccessPolicyLoginComponent
            },
            {
                path: '/recover',
                name: 'recover',
                component: AccessPolicyRecoverComponent
            },
            {
                path: '/reset',
                name: 'reset',
                component: AccessPolicyResetComponent
            },
            {
                path: '/reset/:user_id/:challenge',
                name: 'reset simplified',
                component: AccessPolicyResetComponent,
                props: (route) => ({
                    prop_user_id: parseInt(route.params.user_id),
                    prop_challenge: route.params.challenge
                })
            }
        ];
    }
}