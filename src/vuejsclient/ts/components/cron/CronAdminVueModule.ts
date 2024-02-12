import ModuleCron from '../../../../shared/modules/Cron/ModuleCron';
import CronWorkerPlanification from '../../../../shared/modules/Cron/vos/CronWorkerPlanification';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import MenuController from '../menu/MenuController';

export default class CronAdminVueModule extends VueModuleBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): CronAdminVueModule {
        if (!CronAdminVueModule.instance) {
            CronAdminVueModule.instance = new CronAdminVueModule();
        }

        return CronAdminVueModule.instance;
    }

    private static instance: CronAdminVueModule = null;

    private constructor() {

        super(ModuleCron.getInstance().name);
        this.policies_needed = [
            ModuleCron.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleCron.POLICY_BO_ACCESS]) {
            return;
        }

        let importsMenuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleCron.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "CronAdminVueModule",
                    "fa-cogs",
                    20,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(
            CronWorkerPlanification.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleCron.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                "CronWorkerPlanification",
                "fa-calendar",
                20,
                null,
                null,
                importsMenuBranch.id
            ),
            this.routes);

        let url: string = "/cron/run";
        let main_route_name: string = 'CronRun';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import('./CronComponent')
        });
        let menuelt = MenuElementVO.create_new(
            ModuleCron.POLICY_BO_ACCESS,
            VueAppController.getInstance().app_name,
            'CronRun',
            "fa-play",
            10,
            main_route_name,
            true,
            importsMenuBranch.id
        );
        await MenuController.getInstance().declare_menu_element(menuelt);
    }
}