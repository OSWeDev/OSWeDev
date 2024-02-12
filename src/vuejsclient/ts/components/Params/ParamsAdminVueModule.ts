import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import ParamVO from '../../../../shared/modules/Params/vos/ParamVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import MenuController from '../menu/MenuController';

export default class ParamsAdminVueModule extends VueModuleBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): ParamsAdminVueModule {
        if (!ParamsAdminVueModule.instance) {
            ParamsAdminVueModule.instance = new ParamsAdminVueModule();
        }

        return ParamsAdminVueModule.instance;
    }

    private static instance: ParamsAdminVueModule = null;

    private constructor() {

        super(ModuleParams.getInstance().name);
        this.policies_needed = [
            ModuleParams.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleParams.POLICY_BO_ACCESS]) {
            return;
        }

        let menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleParams.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "ParamsAdminVueModule",
                    "fa-upload",
                    20,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(
            ParamVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleParams.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                ParamVO.API_TYPE_ID,
                "fa-cogs",
                30,
                null,
                null,
                menuBranch.id
            ),
            this.routes);
    }
}