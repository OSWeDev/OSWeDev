import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ISupervisedItem from '../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import ModuleSupervision from '../../../../shared/modules/Supervision/ModuleSupervision';
import SupervisionController from '../../../../shared/modules/Supervision/SupervisionController';
import SupervisedCategoryVO from '../../../../shared/modules/Supervision/vos/SupervisedCategoryVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import MenuLeafRouteTarget from '../menu/vos/MenuLeafRouteTarget';
import './supervision_crud.scss';

export default class SupervisionAdminVueModule extends VueModuleBase {

    public static DEFAULT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "SupervisionAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-tachometer",
        []
    );

    public static getInstance(): SupervisionAdminVueModule {
        if (!SupervisionAdminVueModule.instance) {
            SupervisionAdminVueModule.instance = new SupervisionAdminVueModule();
        }

        return SupervisionAdminVueModule.instance;
    }

    private static instance: SupervisionAdminVueModule = null;

    public enabled_categories_by_key: { [key: string]: string[] } = {};
    public item_filter_conditions_by_key: { [key: string]: (supervised_item: ISupervisedItem) => boolean } = {};


    private constructor() {

        super(ModuleSupervision.getInstance().name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleSupervision.POLICY_BO_ACCESS)) {
            return;
        }

        let registered_api_types = SupervisionController.getInstance().registered_controllers;
        for (let api_type in registered_api_types) {
            let registered_api_type: ISupervisedItemController<any> = registered_api_types[api_type];

            if (!registered_api_type.is_actif()) {
                continue;
            }

            CRUDComponentManager.getInstance().registerCRUD(
                api_type,
                null,
                new MenuPointer(
                    new MenuLeaf(api_type, MenuElementBase.PRIORITY_HIGH, "fa-table"),
                    SupervisionAdminVueModule.DEFAULT_MENU_BRANCH
                ),
                this.routes
            );
        }


        //initializing dashboard
        let main_route_name: string = 'SupervisionDashboard';
        this.routes.push({
            path: "/supervision/dashboard",
            name: main_route_name,
            component: () => import(/* webpackChunkName: "SupervisionDashboardComponent" */ './dashboard/SupervisionDashboardComponent'),
        });

        let menuPointer = new MenuPointer(
            new MenuLeaf('SupervisionDashboard', MenuElementBase.PRIORITY_ULTRAHIGH, "fa-tachometer"),
            SupervisionAdminVueModule.DEFAULT_MENU_BRANCH
        );
        menuPointer.leaf.target = new MenuLeafRouteTarget(main_route_name);
        menuPointer.addToMenu();

        this.routes.push({
            path: "/supervision/item/:vo_type/:id",
            name: 'SupervisedItem',
            component: () => import(/* webpackChunkName: "SupervisionDashboardComponent" */ './item/SupervisedItemComponent'),
            props: (route) => ({
                supervised_item_id: parseInt(route.params.id),
                supervised_item_vo_type: route.params.vo_type
            }),
        });

        //initializing categoryCRUD
        CRUDComponentManager.getInstance().registerCRUD(
            SupervisedCategoryVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("SupervisedCategoryVO", MenuElementBase.PRIORITY_HIGH, "fa-table"),
                SupervisionAdminVueModule.DEFAULT_MENU_BRANCH
            ),
            this.routes
        );
    }

    /**
     * permet de choisir les catégories à activer dans la supervision
     * @param key mot clé passé dans prop pour faire la liaison
     * @param categories_names les noms des catégories voulues
     */
    public enable_categories_for_key(key: string, categories_names: string[]): void {
        this.enabled_categories_by_key[key] = categories_names;
    }

    /**
     * permet de définir une fonction de test pour filtrer les Items affichées dans le dashboard de la supervision
     * @param key mot clé passé dans prop pour faire la liaison
     * @param condition fonction faisant le test sur l'item
     */
    public set_item_filter_condition_for_key(key: string, condition: (supervised_item: ISupervisedItem) => boolean): void {
        this.item_filter_conditions_by_key[key] = condition;
    }
}