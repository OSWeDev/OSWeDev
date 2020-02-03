import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ComponentDatatableField from '../../../../shared/modules/DAO/vos/datatable/ComponentDatatableField';
import ModuleMaintenance from '../../../../shared/modules/Maintenance/ModuleMaintenance';
import MaintenanceVO from '../../../../shared/modules/Maintenance/vos/MaintenanceVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import TerminateMaintenanceComponent from './component/TerminateMaintenanceComponent';
import CRUD from '../../../../shared/modules/DAO/vos/CRUD';

export default class MaintenanceAdminVueModule extends VueModuleBase {


    public static getInstance(post_initialization_hook: () => Promise<void> = null): MaintenanceAdminVueModule {
        if (!MaintenanceAdminVueModule.instance) {
            MaintenanceAdminVueModule.instance = new MaintenanceAdminVueModule();
        }

        return MaintenanceAdminVueModule.instance;
    }

    private static instance: MaintenanceAdminVueModule = null;
    private post_initialization_hook: () => Promise<void> = null;

    private constructor(post_initialization_hook: () => Promise<void> = null) {

        super(ModuleMaintenance.getInstance().name);
        this.post_initialization_hook = post_initialization_hook;
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS)) {
            return;
        }

        let menuBranch: MenuBranch = new MenuBranch("MaintenanceAdminVueModule", MenuElementBase.PRIORITY_MEDIUM - 1, "fa-podcast", []);

        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS)) {
            CRUDComponentManager.getInstance().registerCRUD(
                MaintenanceVO.API_TYPE_ID,
                this.get_maintenance_crud(),
                new MenuPointer(
                    new MenuLeaf("MaintenanceVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-podcast"),
                    menuBranch),
                this.routes);
        }

        if (!!this.post_initialization_hook) {
            await this.post_initialization_hook();
        }
    }

    private get_maintenance_crud(): CRUD<any> {
        let crud = CRUD.getNewCRUD(MaintenanceVO.API_TYPE_ID);

        crud.readDatatable.pushField(new ComponentDatatableField(
            'terminate',
            TerminateMaintenanceComponent,
            'id'
        ));

        return crud;
    }
}