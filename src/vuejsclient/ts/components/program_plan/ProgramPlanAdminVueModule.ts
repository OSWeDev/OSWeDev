import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import ModuleProgramPlanBase from '../../../../shared/modules/ProgramPlan/ModuleProgramPlanBase';

export default class ProgramPlanAdminVueModule extends VueModuleBase {

    public static DEFAULT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "ProgramPlanAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-calendar",
        []
    );

    public static getInstance(): ProgramPlanAdminVueModule {
        if (!ProgramPlanAdminVueModule.instance) {
            ProgramPlanAdminVueModule.instance = new ProgramPlanAdminVueModule();
        }

        return ProgramPlanAdminVueModule.instance;
    }

    private static instance: ProgramPlanAdminVueModule = null;

    private constructor() {

        super(ModuleProgramPlanBase.getInstance().name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleProgramPlanBase.POLICY_BO_ACCESS)) {
            return;
        }

        let menuBranch: MenuBranch = ProgramPlanAdminVueModule.DEFAULT_MENU_BRANCH;

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlanBase.getInstance().program_category_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlanBase.getInstance().program_category_type_id, MenuElementBase.PRIORITY_ULTRAHIGH, "fa-list"),
                menuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlanBase.getInstance().program_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlanBase.getInstance().program_type_id, MenuElementBase.PRIORITY_ULTRAHIGH + 1, "fa-list"),
                menuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlanBase.getInstance().facilitator_region_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlanBase.getInstance().facilitator_region_type_id, MenuElementBase.PRIORITY_HIGH, "fa-bullseye"),
                menuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlanBase.getInstance().enseigne_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlanBase.getInstance().enseigne_type_id, MenuElementBase.PRIORITY_HIGH, "fa-bullseye"),
                menuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlanBase.getInstance().contact_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlanBase.getInstance().contact_type_id, MenuElementBase.PRIORITY_HIGH, "fa-bullseye"),
                menuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlanBase.getInstance().target_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlanBase.getInstance().target_type_id, MenuElementBase.PRIORITY_HIGH + 1, "fa-bullseye"),
                menuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlanBase.getInstance().target_contact_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlanBase.getInstance().target_contact_type_id, MenuElementBase.PRIORITY_HIGH, "fa-bullseye"),
                menuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlanBase.getInstance().program_target_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlanBase.getInstance().program_target_type_id, MenuElementBase.PRIORITY_HIGH + 2, "fa-bullseye"),
                menuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlanBase.getInstance().partner_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlanBase.getInstance().partner_type_id, MenuElementBase.PRIORITY_MEDIUM - 1, "fa-sitemap"),
                menuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlanBase.getInstance().manager_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlanBase.getInstance().manager_type_id, MenuElementBase.PRIORITY_MEDIUM, "fa-sitemap"),
                menuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlanBase.getInstance().facilitator_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlanBase.getInstance().facilitator_type_id, MenuElementBase.PRIORITY_LOW, "fa-user-circle"),
                menuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlanBase.getInstance().program_facilitator_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlanBase.getInstance().program_facilitator_type_id, MenuElementBase.PRIORITY_LOW + 1, "fa-user-circle"),
                menuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            ModuleProgramPlanBase.getInstance().program_manager_type_id,
            null,
            new MenuPointer(
                new MenuLeaf(ModuleProgramPlanBase.getInstance().program_manager_type_id, MenuElementBase.PRIORITY_MEDIUM + 1, "fa-sitemap"),
                menuBranch),
            this.routes);
    }
}