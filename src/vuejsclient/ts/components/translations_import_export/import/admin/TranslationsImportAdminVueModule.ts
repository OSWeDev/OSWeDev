import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleTranslationsImport from '../../../../../../shared/modules/Translation/import/ModuleTranslationsImport';
import VueModuleBase from '../../../../modules/VueModuleBase';
import DataImportAdminVueModule from '../../../data_import/DataImportAdminVueModule';
import MenuElementBase from '../../../menu/vos/MenuElementBase';
import MenuLeaf from '../../../menu/vos/MenuLeaf';
import MenuLeafRouteTarget from '../../../menu/vos/MenuLeafRouteTarget';
import MenuPointer from '../../../menu/vos/MenuPointer';
import TranslationsImportComponent from './TranslationsImportComponent';



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
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleTranslationsImport.POLICY_BO_ACCESS)) {
            return;
        }

        let url: string = TranslationsImportAdminVueModule.ROUTE_PATH;
        let main_route_name: string = 'TranslationsImport';

        this.routes.push({
            path: url,
            name: main_route_name,
            component: TranslationsImportComponent,
            props: (route) => ({
                key: main_route_name
            })
        });

        url = TranslationsImportAdminVueModule.ROUTE_PATH + '/' + DataImportAdminVueModule.IMPORT_MODAL;

        this.routes.push({
            path: url,
            name: main_route_name + '__Modal',
            component: TranslationsImportComponent,
            props: (route) => ({
                key: main_route_name,
                modal_show: true
            })
        });

        let menuPointer = new MenuPointer(
            new MenuLeaf(main_route_name, MenuElementBase.PRIORITY_ULTRAHIGH, "fa-upload"),
            DataImportAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH
        );
        menuPointer.leaf.target = new MenuLeafRouteTarget(main_route_name);
        menuPointer.addToMenu();
    }
}