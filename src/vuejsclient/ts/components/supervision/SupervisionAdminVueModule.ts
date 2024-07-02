import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import ISupervisedItem from '../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import ModuleSupervision from '../../../../shared/modules/Supervision/ModuleSupervision';
import SupervisionController from '../../../../shared/modules/Supervision/SupervisionController';
import SupervisedCategoryVO from '../../../../shared/modules/Supervision/vos/SupervisedCategoryVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import MenuController from '../menu/MenuController';
import './supervision_crud.scss';

export default class SupervisionAdminVueModule extends VueModuleBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): SupervisionAdminVueModule {
        if (!SupervisionAdminVueModule.instance) {
            SupervisionAdminVueModule.instance = new SupervisionAdminVueModule();
        }

        return SupervisionAdminVueModule.instance;
    }

    private static instance: SupervisionAdminVueModule = null;

    public enabled_categories_by_key: { [key: string]: string[] } = {};
    public item_filter_conditions_by_key: { [key: string]: (supervised_item: ISupervisedItem) => boolean } = {};

    public menuBranch: MenuElementVO = null;

    private constructor() {

        super(ModuleSupervision.getInstance().name);
        this.policies_needed = [
            ModuleSupervision.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleSupervision.POLICY_BO_ACCESS]) {
            return;
        }

        this.menuBranch = await MenuController.getInstance().declare_menu_element(
            MenuElementVO.create_new(
                ModuleSupervision.POLICY_BO_ACCESS,
                VueAppController.APP_NAME_ADMIN,
                "SupervisionAdminVueModule",
                "fa-tachometer",
                20,
                null
            )
        );

        const registered_api_types = SupervisionController.getInstance().registered_controllers;
        for (const api_type in registered_api_types) {
            const registered_api_type: ISupervisedItemController<any> = registered_api_types[api_type];

            if (!registered_api_type.is_actif()) {
                continue;
            }

            await CRUDComponentManager.getInstance().registerCRUD(
                api_type,
                null,
                MenuElementVO.create_new(
                    ModuleSupervision.POLICY_BO_ACCESS,
                    VueAppController.APP_NAME_ADMIN,
                    api_type,
                    "fa-table",
                    20,
                    null,
                    null,
                    this.menuBranch.id
                ),
                this.routes
            );
        }


        //initializing dashboard
        // let main_route_name: string = 'SupervisionDashboard';
        this.routes.push({
            path: "/supervision/:dashboard_key?",
            name: SupervisionController.ROUTE_NAME_DASHBOARD,
            component: () => import('./dashboard/SupervisionDashboardComponent'),
            props: true
        });

        const menuPointer = MenuElementVO.create_new(
            ModuleSupervision.POLICY_BO_ACCESS,
            VueAppController.APP_NAME_ADMIN,
            SupervisionController.ROUTE_NAME_DASHBOARD,
            "fa-tachometer",
            10,
            SupervisionController.ROUTE_NAME_DASHBOARD,
            true,
            this.menuBranch.id
        );

        menuPointer.target_route_params = JSON.stringify({ dashboard_key: SupervisionController.SUPERVISION_DASHBOARD_KEY });
        await MenuController.getInstance().declare_menu_element(menuPointer);

        this.routes.push({
            path: "/supervision/:dashboard_key/item/:supervised_item_vo_type/:supervised_item_vo_id",
            name: SupervisionController.ROUTE_NAME_DASHBOARD_ITEM,
            component: () => import('./dashboard/SupervisionDashboardComponent'),
            props: true
        });

        //initializing categoryCRUD
        await CRUDComponentManager.getInstance().registerCRUD(
            SupervisedCategoryVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleSupervision.POLICY_BO_ACCESS,
                VueAppController.APP_NAME_ADMIN,
                "SupervisedCategoryVO",
                "fa-table",
                20,
                null,
                null,
                this.menuBranch.id
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