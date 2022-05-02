import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import RolePolicyVO from '../../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../../shared/modules/AccessPolicy/vos/RoleVO';
import UserLogVO from '../../../../shared/modules/AccessPolicy/vos/UserLogVO';
import UserSessionVO from '../../../../shared/modules/AccessPolicy/vos/UserSessionVO';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import CRUD from '../../../../shared/modules/DAO/vos/CRUD';
import ComponentDatatableField from '../../../../shared/modules/DAO/vos/datatable/ComponentDatatableField';
import Datatable from '../../../../shared/modules/DAO/vos/datatable/Datatable';
import ManyToOneReferenceDatatableField from '../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableField';
import SimpleDatatableField from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableField';
import ExportLogVO from '../../../../shared/modules/DataExport/vos/apis/ExportLogVO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import LangVO from '../../../../shared/modules/Translation/vos/LangVO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import TextHandler from '../../../../shared/tools/TextHandler';
import VueAppController from '../../../VueAppController';
import VueModuleBase from '../../modules/VueModuleBase';
import CRUDComponentManager from '../crud/CRUDComponentManager';
import TableWidgetController from '../dashboard_builder/widgets/table_widget/TableWidgetController';
import MenuController from '../menu/MenuController';
import ImpersonateComponent from './user/impersonate/ImpersonateComponent';
import SendInitPwdComponent from './user/sendinitpwd/SendInitPwdComponent';
import SendRecaptureComponent from './user/sendrecapture/SendRecaptureComponent';

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
        TableWidgetController.getInstance().register_component(
            new ComponentDatatableField(
                'impersonate',
                ImpersonateComponent,
                'id'
            ).setModuleTable(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID])
        );
        TableWidgetController.getInstance().register_component(
            new ComponentDatatableField(
                'sendinitpwd',
                SendInitPwdComponent,
                'id'
            ).setModuleTable(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID])
        );
        TableWidgetController.getInstance().register_component(
            new ComponentDatatableField(
                'sendrecapture',
                SendRecaptureComponent,
                'id'
            ).setModuleTable(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID])
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

        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("name"));
        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("firstname"));
        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("lastname"));
        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("email"));
        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("phone"));

        if (this.policies_loaded[ModuleAccessPolicy.POLICY_IMPERSONATE]) {
            crud.readDatatable.pushField(new ComponentDatatableField(
                'impersonate',
                ImpersonateComponent,
                'id'
            ));
        }

        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("password"));
        if (this.policies_loaded[ModuleAccessPolicy.POLICY_SENDINITPWD]) {
            crud.readDatatable.pushField(new ComponentDatatableField(
                'sendinitpwd',
                SendInitPwdComponent,
                'id'
            ));
        }
        if (this.policies_loaded[ModuleAccessPolicy.POLICY_SENDRECAPTURE]) {
            crud.readDatatable.pushField(new ComponentDatatableField(
                'sendrecapture',
                SendRecaptureComponent,
                'id'
            ));
        }

        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "lang_id",
            VOsTypesManager.getInstance().moduleTables_by_voType[LangVO.API_TYPE_ID], [
            new SimpleDatatableField("code_lang")
        ]));

        if (this.policies_loaded[ModuleAccessPolicy.POLICY_BO_USERS_MANAGMENT_ACCESS]) {
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("blocked"));

            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("password_change_date"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("reminded_pwd_1"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("reminded_pwd_2"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("invalidated"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("recovery_challenge"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("recovery_expiration"));
            crud.readDatatable.pushField(new SimpleDatatableField<any, any>("creation_date"));
        }

        CRUD.addManyToManyFields(crud, VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID], [UserLogVO.API_TYPE_ID, ExportLogVO.API_TYPE_ID]);
        CRUD.addOneToManyFields(crud, VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID], [UserLogVO.API_TYPE_ID, ExportLogVO.API_TYPE_ID]);

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