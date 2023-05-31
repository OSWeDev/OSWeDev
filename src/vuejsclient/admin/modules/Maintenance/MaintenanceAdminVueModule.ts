import Vue from 'vue';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import CRUD from '../../../../shared/modules/DAO/vos/CRUD';
import ComponentDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/ComponentDatatableFieldVO';
import ModuleMaintenance from '../../../../shared/modules/Maintenance/ModuleMaintenance';
import MaintenanceVO from '../../../../shared/modules/Maintenance/vos/MaintenanceVO';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuController from '../../../ts/components/menu/MenuController';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';

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
        this.policies_needed = [
            ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS]) {
            return;
        }

        let menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
                    VueAppController.getInstance().app_name,
                    "MaintenanceAdminVueModule",
                    "fa-podcast",
                    29,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(
            MaintenanceVO.API_TYPE_ID,
            this.get_maintenance_crud(),
            MenuElementVO.create_new(
                ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
                VueAppController.getInstance().app_name,
                "MaintenanceVO",
                "fa-podcast",
                10,
                null,
                null,
                menuBranch.id,
                false
            ),
            this.routes);

        if (!!this.post_initialization_hook) {
            await this.post_initialization_hook();
        }
    }

    private get_maintenance_crud(): CRUD<any> {
        let crud = CRUD.getNewCRUD(MaintenanceVO.API_TYPE_ID);

        Vue.component('Terminatemaintenancecomponent', async () => (await import('./component/TerminateMaintenanceComponent')));
        crud.readDatatable.pushField(ComponentDatatableFieldVO.createNew(
            'terminate',
            'Terminatemaintenancecomponent',
            'id'
        ));

        return crud;
    }
}