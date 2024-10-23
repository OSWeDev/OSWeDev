import ModuleDashboardBuilder from '../../../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import DashboardGraphVORefVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO';
import DashboardPageVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import DashboardWidgetVO from '../../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import VueAppController from '../../../VueAppController';
import CRUDComponentManager from '../crud/CRUDComponentManager';
import MenuController from '../menu/MenuController';
import DashboardBuilderVueModuleBase from './DashboardBuilderVueModuleBase';

export default class DashboardBuilderAdminVueModule extends DashboardBuilderVueModuleBase {

    protected static instance: DashboardBuilderAdminVueModule = null;

    protected constructor() {

        super();

        if (!this.policies_needed) {
            this.policies_needed = [
                ModuleDashboardBuilder.POLICY_BO_ACCESS,
                ModuleDashboardBuilder.POLICY_CMS_VERSION_BO_ACCESS
            ];
        } else {
            if (this.policies_needed.indexOf(ModuleDashboardBuilder.POLICY_BO_ACCESS) < 0) {
                this.policies_needed.push(ModuleDashboardBuilder.POLICY_BO_ACCESS);
            }
            if (this.policies_needed.indexOf(ModuleDashboardBuilder.POLICY_CMS_VERSION_BO_ACCESS) < 0) {
                this.policies_needed.push(ModuleDashboardBuilder.POLICY_CMS_VERSION_BO_ACCESS);
            }
        }
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): DashboardBuilderAdminVueModule {
        if (!DashboardBuilderAdminVueModule.instance) {
            DashboardBuilderAdminVueModule.instance = new DashboardBuilderAdminVueModule();
        }

        return DashboardBuilderAdminVueModule.instance;
    }

    public async initializeAsync() {

        await super.initializeAsync();

        let menuBranch: MenuElementVO = null;

        if (this.policies_loaded[ModuleDashboardBuilder.POLICY_BO_ACCESS] ||
            this.policies_loaded[ModuleDashboardBuilder.POLICY_CMS_VERSION_BO_ACCESS]
        ) {

            menuBranch = await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleDashboardBuilder.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "DashboardBuilderAdminVueModule",
                    "fa-area-chart",
                    20,
                    null
                )
            );
        }

        if (this.policies_loaded[ModuleDashboardBuilder.POLICY_CMS_VERSION_BO_ACCESS]) {

            const main_route_name_cms: string = 'CMSBuilder';

            const menuCMSPointer = MenuElementVO.create_new(
                ModuleDashboardBuilder.POLICY_CMS_VERSION_BO_ACCESS,
                VueAppController.getInstance().app_name,
                main_route_name_cms,
                "fa-area-chart",
                10,
                main_route_name_cms,
                true,
                menuBranch.id
            );

            //TODO FIXME ajouter les liens pour chaque checklist
            await MenuController.getInstance().declare_menu_element(menuCMSPointer);


            const main_route_name_cms_config: string = 'CMSConfig';

            const menuCMSConfigPointer = MenuElementVO.create_new(
                ModuleDashboardBuilder.POLICY_CMS_VERSION_BO_ACCESS,
                VueAppController.getInstance().app_name,
                main_route_name_cms_config,
                "fa-gear",
                10,
                main_route_name_cms_config,
                true,
                menuBranch.id
            );

            //TODO FIXME ajouter les liens pour chaque checklist
            await MenuController.getInstance().declare_menu_element(menuCMSConfigPointer);
        }

        if (!this.policies_loaded[ModuleDashboardBuilder.POLICY_BO_ACCESS]) {
            return;
        }

        let main_route_name: string = 'DashboardBuilder';

        const menuPointer = MenuElementVO.create_new(
            ModuleDashboardBuilder.POLICY_BO_ACCESS,
            VueAppController.getInstance().app_name,
            main_route_name,
            "fa-area-chart",
            10,
            main_route_name,
            true,
            menuBranch.id
        );

        //TODO FIXME ajouter les liens pour chaque checklist
        await MenuController.getInstance().declare_menu_element(menuPointer);

        main_route_name = 'DashboardBuilder_id';

        await CRUDComponentManager.getInstance().registerCRUD(
            DashboardVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleDashboardBuilder.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                DashboardVO.API_TYPE_ID,
                "fa-list",
                0,
                null,
                null,
                menuBranch.id
            ),
            this.routes);

        await CRUDComponentManager.getInstance().registerCRUD(
            DashboardPageVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleDashboardBuilder.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                DashboardPageVO.API_TYPE_ID,
                "fa-list",
                1,
                null,
                null,
                menuBranch.id
            ),
            this.routes);

        await CRUDComponentManager.getInstance().registerCRUD(
            DashboardWidgetVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleDashboardBuilder.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                DashboardWidgetVO.API_TYPE_ID,
                "fa-list",
                2,
                null,
                null,
                menuBranch.id
            ),
            this.routes);

        await CRUDComponentManager.getInstance().registerCRUD(
            DashboardPageWidgetVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleDashboardBuilder.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                DashboardPageWidgetVO.API_TYPE_ID,
                "fa-list",
                3,
                null,
                null,
                menuBranch.id
            ),
            this.routes);

        await CRUDComponentManager.getInstance().registerCRUD(
            DashboardGraphVORefVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleDashboardBuilder.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                DashboardGraphVORefVO.API_TYPE_ID,
                "fa-list",
                4,
                null,
                null,
                menuBranch.id
            ),
            this.routes);
    }
}