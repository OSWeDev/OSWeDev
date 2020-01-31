import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ComponentDatatableField from '../../../../../shared/modules/DAO/vos/datatable/ComponentDatatableField';
import ModuleMaintenance from '../../../../../shared/modules/Maintenance/ModuleMaintenance';
import MaintenanceVO from '../../../../../shared/modules/Maintenance/vos/MaintenanceVO';
import CRUDComponentManager from '../../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../../ts/modules/VueModuleBase';
import EndMaintenaceComponent from './endmaintenance_component/endmaintenance_component';

export default class MaintenanceAdminVueModule extends VueModuleBase {


    public static getInstance(): MaintenanceAdminVueModule {
        if (!MaintenanceAdminVueModule.instance) {
            MaintenanceAdminVueModule.instance = new MaintenanceAdminVueModule();
        }

        return MaintenanceAdminVueModule.instance;
    }

    private static instance: MaintenanceAdminVueModule = null;

    private constructor() {

        super(ModuleMaintenance.getInstance().name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_MODULES_MANAGMENT_ACCESS)) {
            return;
        }

        let maintenanceMenuBranch: MenuBranch = new MenuBranch("MaintenanceAdminVueModule", MenuElementBase.PRIORITY_LOW, "fa-cogs", []);

        CRUDComponentManager.getInstance().registerCRUD(
            MaintenanceVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("MaintenanceVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-cogs"),
                maintenanceMenuBranch),
            this.routes);

        let maintenance_crud = CRUDComponentManager.getInstance().cruds_by_api_type_id[MaintenanceVO.API_TYPE_ID];
        maintenance_crud.readDatatable.unshiftField(new ComponentDatatableField('end_maintenance', EndMaintenaceComponent, 'maintenance_over'));
    }
}