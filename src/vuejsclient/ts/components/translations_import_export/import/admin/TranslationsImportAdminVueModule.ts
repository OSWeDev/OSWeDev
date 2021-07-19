import MenuElementVO from '../../../../../../shared/modules/Menu/vos/MenuElementVO';
import ModuleTranslationsImport from '../../../../../../shared/modules/Translation/import/ModuleTranslationsImport';
import VueAppController from '../../../../../VueAppController';
import VueModuleBase from '../../../../modules/VueModuleBase';
import DataImportAdminVueModule from '../../../data_import/DataImportAdminVueModule';
import MenuController from '../../../menu/MenuController';



export default class TranslationsImportAdminVueModule extends VueModuleBase {

    public static ROUTE_PATH: string = "/import/translations";

    public static getInstance(): TranslationsImportAdminVueModule {
        if (!TranslationsImportAdminVueModule.instance) {
            TranslationsImportAdminVueModule.instance = new TranslationsImportAdminVueModule();
        }

        return TranslationsImportAdminVueModule.instance;
    }

    private static instance: TranslationsImportAdminVueModule = null;

    private constructor() {

        super(ModuleTranslationsImport.getInstance().name);
        this.policies_needed = [
            ModuleTranslationsImport.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleTranslationsImport.POLICY_BO_ACCESS]) {
            return;
        }

        let url: string = TranslationsImportAdminVueModule.ROUTE_PATH;
        let main_route_name: string = 'TranslationsImport';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: () => import(/* webpackChunkName: "TranslationsImportComponent" */ './TranslationsImportComponent'),
            props: (route) => ({
                key: main_route_name
            })
        });

        url = TranslationsImportAdminVueModule.ROUTE_PATH + '/' + DataImportAdminVueModule.IMPORT_MODAL;

        this.routes.push({
            path: url,
            name: main_route_name + '__Modal',
            component: () => import(/* webpackChunkName: "TranslationsImportComponent" */ './TranslationsImportComponent'),
            props: (route) => ({
                key: main_route_name,
                modal_show: true
            })
        });

        let menuPointer = MenuElementVO.create_new(
            ModuleTranslationsImport.POLICY_BO_ACCESS,
            VueAppController.getInstance().app_name,
            main_route_name,
            "fa-upload",
            10,
            main_route_name,
            true,
            DataImportAdminVueModule.getInstance().menuBranch.id
        );
        await MenuController.getInstance().declare_menu_element(menuPointer);
    }
}