import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import RolePoliciesVO from '../../../../../shared/modules/AccessPolicy/vos/RolePoliciesVO';
import RoleVO from '../../../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserRolesVO from '../../../../../shared/modules/AccessPolicy/vos/UserRolesVO';
import CRUDComponentManager from '../../../../ts/components/crud/CRUDComponentManager';
import CRUD from '../../../../ts/components/crud/vos/CRUD';
import Datatable from '../../../../ts/components/datatable/vos/Datatable';
import ManyToOneReferenceDatatableField from '../../../../ts/components/datatable/vos/ManyToOneReferenceDatatableField';
import SimpleDatatableField from '../../../../ts/components/datatable/vos/SimpleDatatableField';
import MenuBranch from '../../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../../ts/modules/VueModuleBase';

export default class AccessPolicyAdminVueModule extends VueModuleBase {


    public static getInstance(): AccessPolicyAdminVueModule {
        if (!AccessPolicyAdminVueModule.instance) {
            AccessPolicyAdminVueModule.instance = new AccessPolicyAdminVueModule();
        }

        return AccessPolicyAdminVueModule.instance;
    }

    private static instance: AccessPolicyAdminVueModule = null;

    private constructor() {

        super(ModuleAccessPolicy.getInstance().name);

        let accessPolicyMenuBranch: MenuBranch = new MenuBranch("AccessPolicyAdminVueModule", MenuElementBase.PRIORITY_HIGH, "fa-shield", []);

        CRUDComponentManager.getInstance().registerCRUD(
            RoleVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("RoleVOAccessPolicyAdminVueModule", MenuElementBase.PRIORITY_ULTRALOW, "fa-shield"),
                accessPolicyMenuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            UserRolesVO.API_TYPE_ID,
            this.getUserRolesCRUD(),
            new MenuPointer(
                new MenuLeaf("UserRolesVOAccessPolicyAdminVueModule", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-shield"),
                accessPolicyMenuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            AccessPolicyGroupVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AccessPolicyGroupVOAccessPolicyAdminVueModule", MenuElementBase.PRIORITY_LOW, "fa-shield"),
                accessPolicyMenuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            AccessPolicyVO.API_TYPE_ID,
            this.getAccessPolicyCRUD(),
            new MenuPointer(
                new MenuLeaf("AccessPolicyVOAccessPolicyAdminVueModule", MenuElementBase.PRIORITY_MEDIUM, "fa-shield"),
                accessPolicyMenuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            RolePoliciesVO.API_TYPE_ID,
            this.getRolePoliciesCRUD(),
            new MenuPointer(
                new MenuLeaf("RolePoliciesVOAccessPolicyAdminVueModule", MenuElementBase.PRIORITY_HIGH, "fa-shield"),
                accessPolicyMenuBranch),
            this.routes);
    }

    protected getUserRolesCRUD(): CRUD<UserRolesVO> {
        let crud: CRUD<UserRolesVO> = new CRUD<UserRolesVO>(new Datatable<UserRolesVO>(ModuleAccessPolicy.getInstance().userroles_datatable));

        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "role_id",
            ModuleAccessPolicy.getInstance().role_datatable, [
                new SimpleDatatableField("translatable_name")
            ]));
        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "user_id",
            ModuleAccessPolicy.getInstance().user_datatable, [
                new SimpleDatatableField("name")
            ]));

        return crud;
    }

    protected getRolePoliciesCRUD(): CRUD<RolePoliciesVO> {
        let crud: CRUD<RolePoliciesVO> = new CRUD<RolePoliciesVO>(new Datatable<RolePoliciesVO>(ModuleAccessPolicy.getInstance().rolepolicies_datatable));

        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "role_id",
            ModuleAccessPolicy.getInstance().role_datatable, [
                new SimpleDatatableField("translatable_name")
            ]));
        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "accpol_id",
            ModuleAccessPolicy.getInstance().role_datatable, [
                new SimpleDatatableField("translatable_name")
            ]));
        crud.readDatatable.pushField(new SimpleDatatableField("granted"));

        return crud;
    }

    protected getAccessPolicyCRUD(): CRUD<RoleVO> {
        let crud: CRUD<AccessPolicyVO> = new CRUD<AccessPolicyVO>(new Datatable<AccessPolicyVO>(ModuleAccessPolicy.getInstance().accesspolicy_datatable));

        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "group_id",
            ModuleAccessPolicy.getInstance().accesspolicygroup_datatable, [
                new SimpleDatatableField("translatable_name")
            ]));
        crud.readDatatable.pushField(new SimpleDatatableField("uniq_id"));
        crud.readDatatable.pushField(new SimpleDatatableField("translatable_name"));

        return crud;
    }
}