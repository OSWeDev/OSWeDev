import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import RolePolicyVO from '../../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import LangVO from '../../../../shared/modules/Translation/vos/LangVO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import VueModuleBase from '../../modules/VueModuleBase';
import CRUDComponentManager from '../crud/CRUDComponentManager';
import CRUD from '../crud/vos/CRUD';
import Datatable from '../datatable/vos/Datatable';
import ManyToOneReferenceDatatableField from '../datatable/vos/ManyToOneReferenceDatatableField';
import SimpleDatatableField from '../datatable/vos/SimpleDatatableField';
import MenuBranch from '../menu/vos/MenuBranch';
import MenuElementBase from '../menu/vos/MenuElementBase';
import MenuLeaf from '../menu/vos/MenuLeaf';
import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';
import MenuPointer from '../menu/vos/MenuPointer';
import AccessPolicyComponent from './AccessPolicyComponent';
import ComponentDatatableField from '../datatable/vos/ComponentDatatableField';
import ImpersonateComponent from './user/impersonate/ImpersonateComponent';

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

    public async initializeAsync() {

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

        // if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_USERS_MANAGMENT_ACCESS)) {
        //     CRUDComponentManager.getInstance().registerCRUD(
        //         UserRoleVO.API_TYPE_ID,
        //         null,
        //         new MenuPointer(
        //             new MenuLeaf("UserRoleVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-shield"),
        //             accessPolicyMenuBranch),
        //         this.routes);
        // }

        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS)) {
            let url: string = "/access_managment";
            let main_route_name: string = 'AccessPolicyComponent';

            this.routes.push({
                path: url,
                name: main_route_name,
                component: AccessPolicyComponent
            });
            let menuPointer = new MenuPointer(
                new MenuLeaf('AccessPolicyComponent', MenuElementBase.PRIORITY_ULTRAHIGH, "fa-cogs"),
                accessPolicyMenuBranch
            );
            menuPointer.leaf.target = new MenuLeafRouteTarget(main_route_name);
            menuPointer.addToMenu();

            CRUDComponentManager.getInstance().registerCRUD(
                RolePolicyVO.API_TYPE_ID,
                null,
                new MenuPointer(
                    new MenuLeaf("RolePolicyVO", MenuElementBase.PRIORITY_HIGH, "fa-shield"),
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

        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_IMPERSONATE)) {
            crud.readDatatable.pushField(new ComponentDatatableField(
                'impersonate',
                ImpersonateComponent,
                'id'
            ));
        }

        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("password"));
        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "lang_id",
            VOsTypesManager.getInstance().moduleTables_by_voType[LangVO.API_TYPE_ID], [
            new SimpleDatatableField("code_lang")
        ]));

        if (await ModuleAccessPolicy.getInstance().checkAccess(ModuleAccessPolicy.POLICY_BO_USERS_MANAGMENT_ACCESS)) {
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("password_change_date"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("reminded_pwd_1"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("reminded_pwd_2"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("invalidated"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("recovery_challenge"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("recovery_expiration"));
        }

        CRUD.addManyToManyFields(crud, VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        CRUD.addOneToManyFields(crud, VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);

        return crud;
    }
}