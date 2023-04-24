import Vue from 'vue';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import RolePolicyVO from '../../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserLogVO from '../../../../shared/modules/AccessPolicy/vos/UserLogVO';
import UserSessionVO from '../../../../shared/modules/AccessPolicy/vos/UserSessionVO';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import CRUD from '../../../../shared/modules/DAO/vos/CRUD';
import ComponentDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/ComponentDatatableFieldVO';
import Datatable from '../../../../shared/modules/DAO/vos/datatable/Datatable';
import ManyToOneReferenceDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableFieldVO';
import SimpleDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
import ExportLogVO from '../../../../shared/modules/DataExport/vos/apis/ExportLogVO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import LangVO from '../../../../shared/modules/Translation/vos/LangVO';
import VOsTypesManager from '../../../../shared/modules/VO/manager/VOsTypesManager';
import TextHandler from '../../../../shared/tools/TextHandler';
import VueAppController from '../../../VueAppController';
import VueModuleBase from '../../modules/VueModuleBase';
import CRUDComponentManager from '../crud/CRUDComponentManager';
import TableWidgetController from '../dashboard_builder/widgets/table_widget/TableWidgetController';
import MenuController from '../menu/MenuController';
import AccessPolicyVueController from './AccessPolicyVueController';

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
        this.policies_needed = [
            ModuleAccessPolicy.POLICY_BO_USERS_LIST_ACCESS,
            ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS,
            ModuleAccessPolicy.POLICY_BO_USERS_MANAGMENT_ACCESS,
            ModuleAccessPolicy.POLICY_SENDINITPWD,
            ModuleAccessPolicy.POLICY_SENDRECAPTURE,
            ModuleAccessPolicy.POLICY_IMPERSONATE
        ];
    }

    public initialize() {

        Vue.component('Impersonatecomponent', async () => (await import(/* webpackChunkName: "ImpersonateComponent" */  './user/impersonate/ImpersonateComponent')));
        TableWidgetController.getInstance().register_component(
            ComponentDatatableFieldVO.createNew(
                'impersonate',
                'Impersonatecomponent',
                'id'
            ).setModuleTable(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID])
        );
        Vue.component('Sendinitpwdcomponent', async () => (await import(/* webpackChunkName: "SendInitPwdComponent" */  './user/sendinitpwd/SendInitPwdComponent')));
        TableWidgetController.getInstance().register_component(
            ComponentDatatableFieldVO.createNew(
                'sendinitpwd',
                'Sendinitpwdcomponent',
                'id'
            ).setModuleTable(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID])
        );
        Vue.component('Sendrecapturecomponent', async () => (await import(/* webpackChunkName: "SendRecaptureComponent" */  './user/sendrecapture/SendRecaptureComponent')));
        TableWidgetController.getInstance().register_component(
            ComponentDatatableFieldVO.createNew(
                'sendrecapture',
                'Sendrecapturecomponent',
                'id'
            ).setModuleTable(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID])
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

            await CRUDComponentManager.getInstance().registerCRUD(
                UserSessionVO.API_TYPE_ID,
                null,
                MenuElementVO.create_new(
                    ModuleAccessPolicy.POLICY_BO_USERS_LIST_ACCESS,
                    VueAppController.getInstance().app_name,
                    "UserSessionVO",
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
        }

        if (this.policies_loaded[ModuleAccessPolicy.POLICY_BO_RIGHTS_MANAGMENT_ACCESS]) {
            let url: string = "/access_managment";
            let main_route_name: string = 'AccessPolicyComponent';

            this.routes.push({
                path: url,
                name: main_route_name,
                component: () => import(/* webpackChunkName: "AccessPolicyComponent" */ './AccessPolicyComponent')
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
        let crud: CRUD<UserVO> = new CRUD<UserVO>(new Datatable<UserVO>(UserVO.API_TYPE_ID));

        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("name"));
        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("firstname"));
        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("lastname"));
        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("email"));
        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("phone"));

        if (this.policies_loaded[ModuleAccessPolicy.POLICY_IMPERSONATE]) {
            Vue.component('Impersonatecomponent', async () => (await import(/* webpackChunkName: "ImpersonateComponent" */  './user/impersonate/ImpersonateComponent')));
            crud.readDatatable.pushField(ComponentDatatableFieldVO.createNew(
                'impersonate',
                'Impersonatecomponent',
                'id'
            ));
        }

        crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("password"));
        if (this.policies_loaded[ModuleAccessPolicy.POLICY_SENDINITPWD]) {
            Vue.component('Sendinitpwdcomponent', async () => (await import(/* webpackChunkName: "SendInitPwdComponent" */  './user/sendinitpwd/SendInitPwdComponent')));
            crud.readDatatable.pushField(ComponentDatatableFieldVO.createNew(
                'sendinitpwd',
                'Sendinitpwdcomponent',
                'id'
            ));
        }
        if (this.policies_loaded[ModuleAccessPolicy.POLICY_SENDRECAPTURE]) {
            Vue.component('Sendrecapturecomponent', async () => (await import(/* webpackChunkName: "SendRecaptureComponent" */  './user/sendrecapture/SendRecaptureComponent')));
            crud.readDatatable.pushField(ComponentDatatableFieldVO.createNew(
                'sendrecapture',
                'Sendrecapturecomponent',
                'id'
            ));
        }

        crud.readDatatable.pushField(ManyToOneReferenceDatatableFieldVO.createNew(
            "lang_id",
            VOsTypesManager.moduleTables_by_voType[LangVO.API_TYPE_ID], [
            SimpleDatatableFieldVO.createNew("code_lang")
        ]));

        if (this.policies_loaded[ModuleAccessPolicy.POLICY_BO_USERS_MANAGMENT_ACCESS]) {
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("blocked"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("archived"));

            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("password_change_date"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("reminded_pwd_1"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("reminded_pwd_2"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("invalidated"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("recovery_challenge"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("recovery_expiration"));
            crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("creation_date"));
        }

        CRUD.addManyToManyFields(crud, VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID], [UserLogVO.API_TYPE_ID, ExportLogVO.API_TYPE_ID]);
        CRUD.addOneToManyFields(crud, VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID], [UserLogVO.API_TYPE_ID, ExportLogVO.API_TYPE_ID]);

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