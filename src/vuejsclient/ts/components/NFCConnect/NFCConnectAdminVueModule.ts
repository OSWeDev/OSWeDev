import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleNFCConnect from '../../../../shared/modules/NFCConnect/ModuleNFCConnect';
import NFCTagUserVO from '../../../../shared/modules/NFCConnect/vos/NFCTagUserVO';
import NFCTagVO from '../../../../shared/modules/NFCConnect/vos/NFCTagVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';

export default class NFCConnectAdminVueModule extends VueModuleBase {

    public static DEFAULT_IMPORT_MENU_BRANCH: MenuBranch = new MenuBranch(
        "NFCConnectAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-wifi",
        []
    );

    public static getInstance(): NFCConnectAdminVueModule {
        if (!NFCConnectAdminVueModule.instance) {
            NFCConnectAdminVueModule.instance = new NFCConnectAdminVueModule();
        }

        return NFCConnectAdminVueModule.instance;
    }

    private static instance: NFCConnectAdminVueModule = null;

    private constructor() {

        super(ModuleNFCConnect.getInstance().name);
    }

    public async initializeAsync() {

        let menuBranch: MenuBranch = NFCConnectAdminVueModule.DEFAULT_IMPORT_MENU_BRANCH;

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleNFCConnect.POLICY_BO_ACCESS)) {
            return;
        }

        CRUDComponentManager.getInstance().registerCRUD(
            NFCTagVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf(NFCTagVO.API_TYPE_ID, MenuElementBase.PRIORITY_ULTRAHIGH, "fa-wifi")
            ),
            this.routes);
        CRUDComponentManager.getInstance().registerCRUD(
            NFCTagUserVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf(NFCTagUserVO.API_TYPE_ID, MenuElementBase.PRIORITY_HIGH, "fa-wifi")
            ),
            this.routes);
    }
}