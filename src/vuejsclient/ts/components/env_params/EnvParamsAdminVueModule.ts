import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleEnvParam from '../../../../shared/modules/EnvParam/ModuleEnvParam';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import VueAppController from '../../../VueAppController';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import MenuController from '../menu/MenuController';

export default class EnvParamsAdminVueModule extends VueModuleBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): EnvParamsAdminVueModule {
        if (!EnvParamsAdminVueModule.instance) {
            EnvParamsAdminVueModule.instance = new EnvParamsAdminVueModule();
        }

        return EnvParamsAdminVueModule.instance;
    }

    private static instance: EnvParamsAdminVueModule = null;

    private constructor() {

        super(ModuleEnvParam.getInstance().name);
        this.policies_needed = [
            ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS]) {
            return;
        }

        const envparamsMenuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
                    VueAppController.getInstance().app_name,
                    "EnvParamsAdminVueModule",
                    "fa-cogs",
                    25,
                    null
                )
            );

        const url: string = "/env_params";
        const main_route_name: string = 'EnvParams';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import('./EnvParamsComponent')
        });
        const menuelt = MenuElementVO.create_new(
            ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
            VueAppController.getInstance().app_name,
            'EnvParams',
            "fa-cogs",
            10,
            main_route_name,
            true,
            envparamsMenuBranch.id
        );
        await MenuController.getInstance().declare_menu_element(menuelt);
    }
}