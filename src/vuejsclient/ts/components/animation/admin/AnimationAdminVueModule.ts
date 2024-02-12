import MessageModuleTableFieldTypeController from '../../../../../shared/modules/Animation/fields/message_module/MessageModuleTableFieldTypeController';
import ReponseTableFieldTypeController from '../../../../../shared/modules/Animation/fields/reponse/ReponseTableFieldTypeController';
import ModuleAnimation from '../../../../../shared/modules/Animation/ModuleAnimation';
import AnimationModuleVO from '../../../../../shared/modules/Animation/vos/AnimationModuleVO';
import AnimationParametersVO from '../../../../../shared/modules/Animation/vos/AnimationParametersVO';
import AnimationQRVO from '../../../../../shared/modules/Animation/vos/AnimationQRVO';
import AnimationThemeVO from '../../../../../shared/modules/Animation/vos/AnimationThemeVO';
import AnimationUserModuleVO from '../../../../../shared/modules/Animation/vos/AnimationUserModuleVO';
import AnimationUserQRVO from '../../../../../shared/modules/Animation/vos/AnimationUserQRVO';
import Datatable from '../../../../../shared/modules/DAO/vos/datatable/Datatable';
import DatatableField from '../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import MenuElementVO from '../../../../../shared/modules/Menu/vos/MenuElementVO';
import TableFieldTypesManager from '../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import VueAppController from '../../../../VueAppController';
import VueModuleBase from '../../../modules/VueModuleBase';
import CRUDComponentManager from '../../crud/CRUDComponentManager';
import DataImportAdminVueModule from '../../data_import/DataImportAdminVueModule';
import MenuController from '../../menu/MenuController';
import MessageModuleCreateUpdateComponent from './create_update_component/message_module/MessageModuleCreateUpdateComponent';
import ReponseCreateUpdateComponent from './create_update_component/reponse/ReponseCreateUpdateComponent';
import AnimationImportModuleAdminVue from './import/module/AnimationImportModuleAdminVue';
import AnimationImportQRAdminVue from './import/qr/AnimationImportQRAdminVue';
import AnimationImportThemeAdminVue from './import/theme/AnimationImportThemeAdminVue';
import MessageModuleReadComponent from './read_component/message_module/MessageModuleReadComponent';
import ReponseReadComponent from './read_component/reponse/ReponseReadComponent';

export default class AnimationAdminVueModule extends VueModuleBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): AnimationAdminVueModule {
        if (!AnimationAdminVueModule.instance) {
            AnimationAdminVueModule.instance = new AnimationAdminVueModule();
        }

        return AnimationAdminVueModule.instance;
    }

    private static instance: AnimationAdminVueModule = null;

    private constructor() {
        super(ModuleAnimation.getInstance().name);
        this.policies_needed = [
            ModuleAnimation.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleAnimation.POLICY_BO_ACCESS]) {
            return;
        }

        let menubranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleAnimation.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "AnimationAdminVueModule",
                    "fa-graduation-cap",
                    30,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(
            AnimationThemeVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleAnimation.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                "AnimationThemeVO",
                "fa-graduation-cap",
                10,
                null,
                null,
                menubranch.id
            ),
            this.routes
        );

        await CRUDComponentManager.getInstance().registerCRUD(
            AnimationModuleVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleAnimation.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                "AnimationModuleVO",
                "fa-graduation-cap",
                20,
                null,
                null,
                menubranch.id
            ),
            this.routes
        );

        await CRUDComponentManager.getInstance().registerCRUD(
            AnimationQRVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleAnimation.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                "AnimationQRVO",
                "fa-graduation-cap",
                30,
                null,
                null,
                menubranch.id
            ),
            this.routes
        );

        await CRUDComponentManager.getInstance().registerCRUD(
            AnimationParametersVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleAnimation.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                "AnimationParametersVO",
                "fa-cogs",
                40,
                null,
                null,
                menubranch.id
            ),
            this.routes
        );

        //ajout d'importTheme
        this.routes.push({
            path: AnimationImportThemeAdminVue.ROUTE_PATH_IMPORT,
            name: AnimationImportThemeAdminVue.ROUTE_NAME_IMPORT,
            component: AnimationImportThemeAdminVue,
        });
        this.routes.push({
            path: AnimationImportThemeAdminVue.ROUTE_PATH_IMPORT + '/' + DataImportAdminVueModule.IMPORT_MODAL + '/:date_index',
            name: AnimationImportThemeAdminVue.ROUTE_NAME_IMPORT + '_modal',
            component: AnimationImportThemeAdminVue,
            props: (route) => ({
                modal_show: true,
                initial_selected_segment: route.params.date_index,
            })
        });

        let menuPointerTheme = MenuElementVO.create_new(
            ModuleAnimation.POLICY_BO_ACCESS,
            VueAppController.getInstance().app_name,
            AnimationImportThemeAdminVue.ROUTE_NAME_IMPORT,
            "fa-folder-open",
            60,
            AnimationImportThemeAdminVue.ROUTE_NAME_IMPORT,
            true,
            menubranch.id
        );
        await MenuController.getInstance().declare_menu_element(menuPointerTheme);



        //importModule
        this.routes.push({
            path: AnimationImportModuleAdminVue.ROUTE_PATH_IMPORT,
            name: AnimationImportModuleAdminVue.ROUTE_NAME_IMPORT,
            component: AnimationImportModuleAdminVue,
        });
        this.routes.push({
            path: AnimationImportModuleAdminVue.ROUTE_PATH_IMPORT + '/' + DataImportAdminVueModule.IMPORT_MODAL + '/:date_index',
            name: AnimationImportModuleAdminVue.ROUTE_NAME_IMPORT + '_modal',
            component: AnimationImportModuleAdminVue,
            props: (route) => ({
                modal_show: true,
                initial_selected_segment: route.params.date_index,
            })
        });

        let menuPointerModule = MenuElementVO.create_new(
            ModuleAnimation.POLICY_BO_ACCESS,
            VueAppController.getInstance().app_name,
            AnimationImportModuleAdminVue.ROUTE_NAME_IMPORT,
            "fa-folder-open",
            61,
            AnimationImportModuleAdminVue.ROUTE_NAME_IMPORT,
            true,
            menubranch.id
        );
        await MenuController.getInstance().declare_menu_element(menuPointerModule);


        //importQR
        this.routes.push({
            path: AnimationImportQRAdminVue.ROUTE_PATH_IMPORT,
            name: AnimationImportQRAdminVue.ROUTE_NAME_IMPORT,
            component: AnimationImportQRAdminVue,
        });
        this.routes.push({
            path: AnimationImportQRAdminVue.ROUTE_PATH_IMPORT + '/' + DataImportAdminVueModule.IMPORT_MODAL + '/:date_index',
            name: AnimationImportQRAdminVue.ROUTE_NAME_IMPORT + '_modal',
            component: AnimationImportQRAdminVue,
            props: (route) => ({
                modal_show: true,
                initial_selected_segment: route.params.date_index,
            })
        });

        let menuPointerQR = MenuElementVO.create_new(
            ModuleAnimation.POLICY_BO_ACCESS,
            VueAppController.getInstance().app_name,
            AnimationImportQRAdminVue.ROUTE_NAME_IMPORT,
            "fa-folder-open",
            62,
            AnimationImportQRAdminVue.ROUTE_NAME_IMPORT,
            true,
            menubranch.id
        );
        await MenuController.getInstance().declare_menu_element(menuPointerQR);

        await CRUDComponentManager.getInstance().registerCRUD(
            AnimationParametersVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleAnimation.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                "AnimationParametersVO",
                "fa-cogs",
                40,
                null,
                null,
                menubranch.id
            ),
            this.routes
        );

        await CRUDComponentManager.getInstance().registerCRUD(
            AnimationUserModuleVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleAnimation.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                "AnimationUserModuleVO",
                "fa-graduation-cap",
                50,
                null,
                null,
                menubranch.id
            ),
            this.routes
        );

        await CRUDComponentManager.getInstance().registerCRUD(
            AnimationUserQRVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleAnimation.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                "AnimationUserQRVO",
                "fa-graduation-cap",
                50,
                null,
                null,
                menubranch.id
            ),
            this.routes
        );

        TableFieldTypesManager.getInstance().registerTableFieldTypeComponents(MessageModuleTableFieldTypeController.getInstance().name, MessageModuleReadComponent, MessageModuleCreateUpdateComponent);
        TableFieldTypesManager.getInstance().registerTableFieldTypeComponents(ReponseTableFieldTypeController.getInstance().name, ReponseReadComponent, ReponseCreateUpdateComponent);
    }

    private pushFieldsCrud(cruds: Array<Datatable<any>>, field: DatatableField<any, any>) {
        for (let i in cruds) {
            cruds[i].pushField(field);
        }
    }

    private removeFieldsCrud(cruds: Array<Datatable<any>>, module_table_field_ids: string[]) {
        for (let i in cruds) {
            cruds[i].removeFields(module_table_field_ids);
        }
    }
}