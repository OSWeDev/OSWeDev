import VueModuleBase from '../../modules/VueModuleBase';
import MenuBranch from '../menu/vos/MenuBranch';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import CRUDComponentManager from '../crud/CRUDComponentManager';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import MenuPointer from '../menu/vos/MenuPointer';
import MenuLeaf from '../menu/vos/MenuLeaf';
import UserRolesVO from '../../../../shared/modules/AccessPolicy/vos/UserRolesVO';
import MenuElementBase from '../menu/vos/MenuElementBase';
import RolePoliciesVO from '../../../../shared/modules/AccessPolicy/vos/RolePoliciesVO';
import AccessPolicyVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import AccessPolicyGroupVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import RoleVO from '../../../../shared/modules/AccessPolicy/vos/RoleVO';
import CRUD from '../crud/vos/CRUD';
import Datatable from '../datatable/vos/Datatable';
import SimpleDatatableField from '../datatable/vos/SimpleDatatableField';
import Module from '../../../../shared/modules/Module';
import ModulesManager from '../../../../shared/modules/ModulesManager';
import VueAppController from '../../../VueAppController';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ManyToOneReferenceDatatableField from '../datatable/vos/ManyToOneReferenceDatatableField';
import LangVO from '../../../../shared/modules/Translation/vos/LangVO';

export default class AccessPolicyAdminVueModule extends VueModuleBase {

    public static DEFAULT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "AccessPolicyAdminVueModule",
        0,
        "fa-shield",
        []
    );

    public static getInstance(): AccessPolicyAdminVueModule {
        if (!AccessPolicyAdminVueModule.instance) {
            AccessPolicyAdminVueModule.instance = new AccessPolicyAdminVueModule();
        }

        return AccessPolicyAdminVueModule.instance;
    }

    private static instance: AccessPolicyAdminVueModule = null;

    private constructor() {

        super(ModuleAccessPolicy.getInstance().name);
    }

    public async initialize() {

        let accessPolicyMenuBranch: MenuBranch = AccessPolicyAdminVueModule.DEFAULT_MENU_BRANCH;

        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_USERS_LIST_ACCESS)) {
            CRUDComponentManager.getInstance().registerCRUD(
                UserVO.API_TYPE_ID,
                await this.getUserCRUD(),
                new MenuPointer(
                    new MenuLeaf("UserVO", 0, "fa-lock"),
                    accessPolicyMenuBranch),
                this.routes);
        }

        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_USERS_MANAGMENT_ACCESS)) {
            CRUDComponentManager.getInstance().registerCRUD(
                UserRolesVO.API_TYPE_ID,
                null,
                new MenuPointer(
                    new MenuLeaf("UserRolesVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-shield"),
                    accessPolicyMenuBranch),
                this.routes);

            CRUDComponentManager.getInstance().registerCRUD(
                RolePoliciesVO.API_TYPE_ID,
                null,
                new MenuPointer(
                    new MenuLeaf("RolePoliciesVO", MenuElementBase.PRIORITY_HIGH, "fa-shield"),
                    accessPolicyMenuBranch),
                this.routes);

            CRUDComponentManager.getInstance().registerCRUD(
                AccessPolicyVO.API_TYPE_ID,
                null,
                new MenuPointer(
                    new MenuLeaf("AccessPolicyVO", MenuElementBase.PRIORITY_MEDIUM, "fa-shield"),
                    accessPolicyMenuBranch),
                this.routes);

            CRUDComponentManager.getInstance().registerCRUD(
                AccessPolicyGroupVO.API_TYPE_ID,
                null,
                new MenuPointer(
                    new MenuLeaf("AccessPolicyGroupVO", MenuElementBase.PRIORITY_LOW, "fa-shield"),
                    accessPolicyMenuBranch),
                this.routes);

            CRUDComponentManager.getInstance().registerCRUD(
                RoleVO.API_TYPE_ID,
                null,
                new MenuPointer(
                    new MenuLeaf("RoleVO", MenuElementBase.PRIORITY_ULTRALOW, "fa-shield"),
                    accessPolicyMenuBranch),
                this.routes);
        }
    }

    protected async getUserCRUD(): Promise<CRUD<UserVO>> {
        let crud: CRUD<UserVO> = new CRUD<UserVO>(new Datatable<UserVO>(UserVO.API_TYPE_ID));


        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("name"));
        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("email"));
        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("password"));

        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_USERS_MANAGMENT_ACCESS)) {
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("password_change_date"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("reminded_pwd_1"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("reminded_pwd_2"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("invalidated"));
            crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
                "lang_id",
                VOsTypesManager.getInstance().moduleTables_by_voType[LangVO.API_TYPE_ID], [
                    new SimpleDatatableField("code_lang")
                ]));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("recovery_challenge"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("recovery_expiration"));
        }

        return crud;
    }
}