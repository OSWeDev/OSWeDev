import Vue from 'vue';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ComponentDatatableFieldVO from '../../../../../shared/modules/DAO/vos/datatable/ComponentDatatableFieldVO';
import ModuleMaintenance from '../../../../../shared/modules/Maintenance/ModuleMaintenance';
import MaintenanceVO from '../../../../../shared/modules/Maintenance/vos/MaintenanceVO';
import MenuElementVO from '../../../../../shared/modules/Menu/vos/MenuElementVO';
import CRUDComponentManager from '../../../../ts/components/crud/CRUDComponentManager';
import MenuController from '../../../../ts/components/menu/MenuController';
import VueModuleBase from '../../../../ts/modules/VueModuleBase';
import VueAppController from '../../../../VueAppController';

export default class MaintenanceAdminVueModule extends VueModuleBase {


    // istanbul ignore next: nothing to test
    public static getInstance(): MaintenanceAdminVueModule {
        if (!MaintenanceAdminVueModule.instance) {
            MaintenanceAdminVueModule.instance = new MaintenanceAdminVueModule();
        }

        return MaintenanceAdminVueModule.instance;
    }

    private static instance: MaintenanceAdminVueModule = null;

    private constructor() {

        super(ModuleMaintenance.getInstance().name);
        this.policies_needed = [
            ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS]) {
            return;
        }

        const maintenanceMenuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
                    VueAppController.getInstance().app_name,
                    "MaintenanceAdminVueModule",
                    "fa-seacogsrch",
                    40,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(
            MaintenanceVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS,
                VueAppController.getInstance().app_name,
                "MaintenanceVO",
                "fa-cogs",
                10,
                null,
                null,
                maintenanceMenuBranch.id
            ),
            this.routes);

        const maintenance_crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[MaintenanceVO.API_TYPE_ID];
        Vue.component('Endmaintenacecomponent', async () => (await import('./endmaintenance_component/endmaintenance_component')));
        maintenance_crud.readDatatable.unshiftField(ComponentDatatableFieldVO.createNew('end_maintenance', 'Endmaintenacecomponent', 'maintenance_over'));
    }
}