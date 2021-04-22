import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AnonymizationFieldConfVO from '../../../../shared/modules/Anonymization/vos/AnonymizationFieldConfVO';
import ModuleParams from '../../../../shared/modules/Params/ModuleParams';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';

export default class AnonymizationAdminVueModule extends VueModuleBase {

    public static DEFAULT_IMPORT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "AnonymizationAdminVueModule",
        MenuElementBase.PRIORITY_ULTRALOW,
        "fa-user-secret",
        []
    );

    public static getInstance(): AnonymizationAdminVueModule {
        if (!AnonymizationAdminVueModule.instance) {
            AnonymizationAdminVueModule.instance = new AnonymizationAdminVueModule();
        }

        return AnonymizationAdminVueModule.instance;
    }

    private static instance: AnonymizationAdminVueModule = null;

    private constructor() {

        super(ModuleParams.getInstance().name);
    }

    public async initializeAsync() {

        let menuBranch: MenuBranch = AnonymizationAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH;

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleParams.POLICY_BO_ACCESS)) {
            return;
        }


        CRUDComponentManager.getInstance().registerCRUD(
            AnonymizationFieldConfVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf(AnonymizationFieldConfVO.API_TYPE_ID, MenuElementBase.PRIORITY_MEDIUM, "fa-user-secret")
            ),
            this.routes);
    }
}