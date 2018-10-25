import VueModuleBase from '../../../ts/modules/VueModuleBase';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import UserComponent from './user/UserComponent';

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
            {
                path: '/user',
                name: 'user',
                component: UserComponent
            }
        );
    }
}