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
import UserVO from '../../../../../shared/modules/AccessPolicy/vos/UserVO';
import VueAppController from '../../../../VueAppController';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import LangVO from '../../../../../shared/modules/Translation/vos/LangVO';
import ModulesManager from '../../../../../shared/modules/ModulesManager';
import Module from '../../../../../shared/modules/Module';

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

    public initialize() {

        let accessPolicyMenuBranch: MenuBranch = AccessPolicyAdminVueModule.DEFAULT_MENU_BRANCH;

        // TODO FIXME : TEMPorary right managment for old project compliance. Update ASAP
        // if (VueAppController.getInstance().hasRole(ModuleAccessPolicy.ROLE_SUPER_ADMIN) &&
        //     (((typeof VueAppController.getInstance().data_user.super_admin === "undefined") && (typeof VueAppController.getInstance().data_user.admin_central === "undefined")) ||
        //         (VueAppController.getInstance().data_user.super_admin || VueAppController.getInstance().data_user.admin_central))) {

        if ((
            VueAppController.getInstance().hasRole(ModuleAccessPolicy.ROLE_SUPER_ADMIN) ||
            (ModulesManager.getInstance().getModuleByNameAndRole('toyota', Module.SharedModuleRoleName) &&
                ModulesManager.getInstance().getModuleByNameAndRole('toyota', Module.SharedModuleRoleName).actif &&
                VueAppController.getInstance().hasRole('acces.toyota.roles.admin_central.label') ||
                VueAppController.getInstance().hasRole('acces.toyota.roles.fac_coventeam.label'))
        ) && (
                (
                    (typeof VueAppController.getInstance().data_user.super_admin === "undefined") &&
                    (typeof VueAppController.getInstance().data_user.admin_central === "undefined") &&
                    (typeof VueAppController.getInstance().data_user.admin === "undefined")
                ) || (
                    VueAppController.getInstance().data_user.super_admin || VueAppController.getInstance().data_user.admin_central
                )
            )) {
            CRUDComponentManager.getInstance().registerCRUD(
                UserVO.API_TYPE_ID,
                this.getUserCRUD(),
                new MenuPointer(
                    new MenuLeaf("UserVO", 0, "fa-lock"),
                    accessPolicyMenuBranch),
                this.routes);
        }

        if (VueAppController.getInstance().hasRole(ModuleAccessPolicy.ROLE_SUPER_ADMIN) && (
            (
                (typeof VueAppController.getInstance().data_user.super_admin === "undefined") &&
                (typeof VueAppController.getInstance().data_user.admin_central === "undefined") &&
                (typeof VueAppController.getInstance().data_user.admin === "undefined")
            ) || (
                VueAppController.getInstance().data_user.super_admin
            )
        )) {
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

    protected getUserCRUD(): CRUD<UserVO> {
        let crud: CRUD<UserVO> = new CRUD<UserVO>(new Datatable<UserVO>(UserVO.API_TYPE_ID));


        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("name"));
        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("email"));
        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("password"));

        // TODO FIXME ne doit pas avoir besoin de ça ici.... à remplacer ASAP
        if (ModulesManager.getInstance().getModuleByNameAndRole('gr', Module.SharedModuleRoleName) &&
            ModulesManager.getInstance().getModuleByNameAndRole('gr', Module.SharedModuleRoleName).actif) {
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("admin"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("super_admin"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("admin_central"));
        }

        if (VueAppController.getInstance().data_user.super_admin) {
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