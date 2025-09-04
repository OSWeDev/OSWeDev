import Vue from 'vue';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import RolePolicyVO from '../../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserLogVO from '../../../../shared/modules/AccessPolicy/vos/UserLogVO';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ModuleTableController from '../../../../shared/modules/DAO/ModuleTableController';
import CRUD from '../../../../shared/modules/DAO/vos/CRUD';
import ComponentDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/ComponentDatatableFieldVO';
import Datatable from '../../../../shared/modules/DAO/vos/datatable/Datatable';
import ManyToOneReferenceDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableFieldVO';
import SimpleDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import TableWidgetManager from '../../../../shared/modules/DashboardBuilder/manager/TableWidgetManager';
import ExportLogVO from '../../../../shared/modules/DataExport/vos/apis/ExportLogVO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import LangVO from '../../../../shared/modules/Translation/vos/LangVO';
import TextHandler from '../../../../shared/tools/TextHandler';
import VueAppController from '../../../VueAppController';
import VueModuleBase from '../../modules/VueModuleBase';
import CRUDComponentManager from '../crud/CRUDComponentManager';
import MenuController from '../menu/MenuController';
import AccessPolicyVueController from './AccessPolicyVueController';

export default class AccessPolicyAdminVueModule extends VueModuleBase {
    private static instance: AccessPolicyAdminVueModule = null;

    private constructor() {

        super(ModuleAccessPolicy.getInstance().name);
        this.policies_needed = [
            ModuleAccessPolicy.POLICY_BO_USERS_LIST_ACCESS,
            ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS,
            ModuleAccessPolicy.POLICY_BO_USERS_MANAGMENT_ACCESS,
            ModuleAccessPolicy.POLICY_SENDINITPWD,
            ModuleAccessPolicy.POLICY_SENDRECAPTURE,
            ModuleAccessPolicy.POLICY_IMPERSONATE
        ];
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): AccessPolicyAdminVueModule {
        if (!AccessPolicyAdminVueModule.instance) {
            AccessPolicyAdminVueModule.instance = new AccessPolicyAdminVueModule();
        }

        return AccessPolicyAdminVueModule.instance;
    }

    public initialize() {

        Vue.component('Impersonatecomponent', async () => (await import('./user/impersonate/ImpersonateComponent')));
        TableWidgetManager.register_component(
            ComponentDatatableFieldVO.createNew(
                'impersonate',
                'Impersonatecomponent',
                'id'
            ).setModuleTable(ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID])
        );
        Vue.component('Sendinitpwdcomponent', async () => (await import('./user/sendinitpwd/SendInitPwdComponent')));
        TableWidgetManager.register_component(
            ComponentDatatableFieldVO.createNew(
                'sendinitpwd',
                'Sendinitpwdcomponent',
                'id'
            ).setModuleTable(ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID])
        );
        Vue.component('Sendrecapturecomponent', async () => (await import('./user/sendrecapture/SendRecaptureComponent')));
        TableWidgetManager.register_component(
            ComponentDatatableFieldVO.createNew(
                'sendrecapture',
                'Sendrecapturecomponent',
                'id'
            ).setModuleTable(ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID])
        );
    }

    public async initializeAsync() {

        let accessPolicyMenuBranch: MenuElementVO = null;

        if (this.policies_loaded[ModuleAccessPolicy.POLICY_BO_USERS_LIST_ACCESS]) {
            accessPolicyMenuBranch =
                await MenuController.getInstance().declare_menu_element(
                    MenuElementVO.create_new(
                        ModuleAccessPolicy.POLICY_BO_USERS_LIST_ACCESS,
                        VueAppController.getInstance().app_name,
                        "AccessPolicyAdminVueModule",
                        "fa-shield",
                        0,
                        null
                    )
                );

            await CRUDComponentManager.getInstance().registerCRUD(
                UserVO.API_TYPE_ID,
                await this.getUserCRUD(),
                MenuElementVO.create_new(
                    ModuleAccessPolicy.POLICY_BO_USERS_LIST_ACCESS,
                    VueAppController.getInstance().app_name,
                    "UserVO",
                    "fa-lock",
                    0,
                    null,
                    null,
                    accessPolicyMenuBranch.id
                ),
                this.routes,
                null,
                null,
                false
            );
            await AccessPolicyVueController.getInstance().conf_precreate_uservo_unicity();
        }

        if (this.policies_loaded[ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS]) {
            let url: string = "/access_managment";
            let main_route_name: string = 'AccessPolicyComponent';

            this.routes.push({
                path: url,
                name: main_route_name,
                component: () => import('./AccessPolicyComponent')
            });
            let menuelt =
                MenuElementVO.create_new(
                    ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS,
                    VueAppController.getInstance().app_name,
                    "AccessPolicyComponent",
                    "fa-cogs",
                    10,
                    main_route_name,
                    true,
                    accessPolicyMenuBranch.id
                );
            await MenuController.getInstance().declare_menu_element(menuelt);


            url = "/compare_and_patch_roles";
            main_route_name = 'AccessPolicyCompareAndPatchComponent';

            this.routes.push({
                path: url,
                name: main_route_name,
                component: () => import('./compare_and_patch/AccessPolicyCompareAndPatchComponent')
            });
            menuelt =
                MenuElementVO.create_new(
                    ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS,
                    VueAppController.getInstance().app_name,
                    "AccessPolicyCompareAndPatchComponent",
                    "fa-code-compare",
                    15,
                    main_route_name,
                    true,
                    accessPolicyMenuBranch.id
                );
            await MenuController.getInstance().declare_menu_element(menuelt);


            await CRUDComponentManager.getInstance().registerCRUD(
                RolePolicyVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS,
                    VueAppController.getInstance().app_name,
                    "RolePolicyVO",
                    "fa-shield",
                    20,
                    null,
                    null,
                    accessPolicyMenuBranch.id
                ),
                this.routes);

            await CRUDComponentManager.getInstance().registerCRUD(
                AccessPolicyVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS,
                    VueAppController.getInstance().app_name,
                    "AccessPolicyVO",
                    "fa-shield",
                    30,
                    null,
                    null,
                    accessPolicyMenuBranch.id
                ),
                this.routes);

            await CRUDComponentManager.getInstance().registerCRUD(
                AccessPolicyGroupVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS,
                    VueAppController.getInstance().app_name,
                    "AccessPolicyGroupVO",
                    "fa-shield",
                    40,
                    null,
                    null,
                    accessPolicyMenuBranch.id
                ),
                this.routes);

            await CRUDComponentManager.getInstance().registerCRUD(
                RoleVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS,
                    VueAppController.getInstance().app_name,
                    "RoleVO",
                    "fa-shield",
                    50,
                    null,
                    null,
                    accessPolicyMenuBranch.id
                ),
                this.routes);
        }
    }

    protected async getUserCRUD(): Promise<CRUD<UserVO>> {
        const crud: CRUD<UserVO> = new CRUD<UserVO>(new Datatable<UserVO>(UserVO.API_TYPE_ID));

        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("name"));
        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("firstname"));
        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("lastname"));
        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("email"));
        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("phone"));

        if (this.policies_loaded[ModuleAccessPolicy.POLICY_IMPERSONATE]) {
            Vue.component('Impersonatecomponent', async () => (await import('./user/impersonate/ImpersonateComponent')));
            crud.readDatatable.pushField(ComponentDatatableFieldVO.createNew(
                'impersonate',
                'Impersonatecomponent',
                'id'
            ));
        }

        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("password"));
        if (this.policies_loaded[ModuleAccessPolicy.POLICY_SENDINITPWD]) {
            Vue.component('Sendinitpwdcomponent', async () => (await import('./user/sendinitpwd/SendInitPwdComponent')));
            crud.readDatatable.pushField(ComponentDatatableFieldVO.createNew(
                'sendinitpwd',
                'Sendinitpwdcomponent',
                'id'
            ));
        }
        if (this.policies_loaded[ModuleAccessPolicy.POLICY_SENDRECAPTURE]) {
            Vue.component('Sendrecapturecomponent', async () => (await import('./user/sendrecapture/SendRecaptureComponent')));
            crud.readDatatable.pushField(ComponentDatatableFieldVO.createNew(
                'sendrecapture',
                'Sendrecapturecomponent',
                'id'
            ));
        }

        crud.readDatatable.pushField(ManyToOneReferenceDatatableFieldVO.createNew(
            "lang_id",
            ModuleTableController.module_tables_by_vo_type[LangVO.API_TYPE_ID], [
                SimpleDatatableFieldVO.createNew("code_lang")
            ]));

        if (this.policies_loaded[ModuleAccessPolicy.POLICY_BO_USERS_MANAGMENT_ACCESS]) {
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("blocked"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("force_mfa_config"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("mfa_enabled"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("archived"));

            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("password_change_date"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("reminded_pwd_1"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("reminded_pwd_2"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("invalidated"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("recovery_challenge"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("recovery_expiration"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("creation_date"));
        }

        CRUD.addManyToManyFields(crud, ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID], [UserLogVO.API_TYPE_ID, ExportLogVO.API_TYPE_ID]);
        CRUD.addOneToManyFields(crud, ModuleTableController.module_tables_by_vo_type[UserVO.API_TYPE_ID], [UserLogVO.API_TYPE_ID, ExportLogVO.API_TYPE_ID]);

        crud.readDatatable.removeFields(["ref.module_mailer_mail_sent_by_id"]);
        crud.readDatatable.removeFields(["ref.module_mailer_mail_sent_to_id"]);

        crud.reset_newvo_after_each_creation = true;
        crud.hook_prepare_new_vo_for_creation = async (vo: IDistantVOBase) => {
            // On génère un mot de passe par défaut

            (vo as UserVO).password = TextHandler.getInstance().generatePassword();
        };

        return crud;
    }
}