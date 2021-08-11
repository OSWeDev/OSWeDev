import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
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
import TableFieldTypesManager from '../../../../../shared/modules/TableFieldTypes/TableFieldTypesManager';
import VueModuleBase from '../../../modules/VueModuleBase';
import CRUDComponentManager from '../../crud/CRUDComponentManager';
import DataImportAdminVueModule from '../../data_import/DataImportAdminVueModule';
import MenuBranch from '../../menu/vos/MenuBranch';
import MenuElementBase from '../../menu/vos/MenuElementBase';
import MenuLeaf from '../../menu/vos/MenuLeaf';
import MenuLeafRouteTarget from '../../menu/vos/MenuLeafRouteTarget';
import MenuPointer from '../../menu/vos/MenuPointer';
import MessageModuleCreateUpdateComponent from './create_update_component/message_module/MessageModuleCreateUpdateComponent';
import ReponseCreateUpdateComponent from './create_update_component/reponse/ReponseCreateUpdateComponent';
import AnimationImportModuleAdminVue from './import/module/AnimationImportModuleAdminVue';
import AnimationImportQRAdminVue from './import/qr/AnimationImportQRAdminVue';
import AnimationImportThemeAdminVue from './import/theme/AnimationImportThemeAdminVue';
import MessageModuleReadComponent from './read_component/message_module/MessageModuleReadComponent';
import ReponseReadComponent from './read_component/reponse/ReponseReadComponent';

export default class AnimationAdminVueModule extends VueModuleBase {

    public static DEFAULT_ANIMATION_MENU_BRANCH: MenuBranch = new MenuBranch(
        "AnimationAdminVueModule",
        MenuElementBase.PRIORITY_MEDIUM,
        "fa-graduation-cap",
        []
    );

    public static getInstance(): AnimationAdminVueModule {
        if (!AnimationAdminVueModule.instance) {
            AnimationAdminVueModule.instance = new AnimationAdminVueModule();
        }

        return AnimationAdminVueModule.instance;
    }

    private static instance: AnimationAdminVueModule = null;

    private constructor() {
        super(ModuleAnimation.getInstance().name);
    }

    public async initializeAsync() {
        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleAnimation.POLICY_BO_ACCESS)) {
            return;
        }

        CRUDComponentManager.getInstance().registerCRUD(
            AnimationThemeVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AnimationThemeVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-graduation-cap"),
                AnimationAdminVueModule.DEFAULT_ANIMATION_MENU_BRANCH
            ),
            this.routes
        );

        CRUDComponentManager.getInstance().registerCRUD(
            AnimationModuleVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AnimationModuleVO", MenuElementBase.PRIORITY_HIGH, "fa-graduation-cap"),
                AnimationAdminVueModule.DEFAULT_ANIMATION_MENU_BRANCH
            ),
            this.routes
        );

        CRUDComponentManager.getInstance().registerCRUD(
            AnimationQRVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AnimationQRVO", MenuElementBase.PRIORITY_MEDIUM, "fa-graduation-cap"),
                AnimationAdminVueModule.DEFAULT_ANIMATION_MENU_BRANCH
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

        let menuPointerTheme = new MenuPointer(
            new MenuLeaf(AnimationImportThemeAdminVue.ROUTE_NAME_IMPORT, MenuElementBase.PRIORITY_ULTRALOW + 10, "fa-folder-open"),
            AnimationAdminVueModule.DEFAULT_ANIMATION_MENU_BRANCH
        );
        menuPointerTheme.leaf.target = new MenuLeafRouteTarget(AnimationImportThemeAdminVue.ROUTE_NAME_IMPORT);
        menuPointerTheme.addToMenu();


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
        let menuPointerModule = new MenuPointer(
            new MenuLeaf(AnimationImportModuleAdminVue.ROUTE_NAME_IMPORT, MenuElementBase.PRIORITY_ULTRALOW + 11, "fa-folder-open"),
            AnimationAdminVueModule.DEFAULT_ANIMATION_MENU_BRANCH
        );
        menuPointerModule.leaf.target = new MenuLeafRouteTarget(AnimationImportModuleAdminVue.ROUTE_NAME_IMPORT);
        menuPointerModule.addToMenu();

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
        let menuPointerQR = new MenuPointer(
            new MenuLeaf(AnimationImportQRAdminVue.ROUTE_NAME_IMPORT, MenuElementBase.PRIORITY_ULTRALOW + 12, "fa-folder-open"),
            AnimationAdminVueModule.DEFAULT_ANIMATION_MENU_BRANCH
        );
        menuPointerQR.leaf.target = new MenuLeafRouteTarget(AnimationImportQRAdminVue.ROUTE_NAME_IMPORT);
        menuPointerQR.addToMenu();

        CRUDComponentManager.getInstance().registerCRUD(
            AnimationParametersVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AnimationParametersVO", MenuElementBase.PRIORITY_LOW, "fa-cogs"),
                AnimationAdminVueModule.DEFAULT_ANIMATION_MENU_BRANCH
            ),
            this.routes
        );

        CRUDComponentManager.getInstance().registerCRUD(
            AnimationUserModuleVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AnimationUserModuleVO", MenuElementBase.PRIORITY_ULTRALOW - 1, "fa-graduation-cap"),
                AnimationAdminVueModule.DEFAULT_ANIMATION_MENU_BRANCH
            ),
            this.routes
        );

        CRUDComponentManager.getInstance().registerCRUD(
            AnimationUserQRVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AnimationUserQRVO", MenuElementBase.PRIORITY_ULTRALOW - 1, "fa-graduation-cap"),
                AnimationAdminVueModule.DEFAULT_ANIMATION_MENU_BRANCH
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