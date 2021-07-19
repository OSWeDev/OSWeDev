import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import ModuleNFCConnect from '../../../../shared/modules/NFCConnect/ModuleNFCConnect';
import NFCTagUserVO from '../../../../shared/modules/NFCConnect/vos/NFCTagUserVO';
import NFCTagVO from '../../../../shared/modules/NFCConnect/vos/NFCTagVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import MenuController from '../menu/MenuController';

export default class NFCConnectAdminVueModule extends VueModuleBase {

    public static getInstance(): NFCConnectAdminVueModule {
        if (!NFCConnectAdminVueModule.instance) {
            NFCConnectAdminVueModule.instance = new NFCConnectAdminVueModule();
        }

        return NFCConnectAdminVueModule.instance;
    }

    private static instance: NFCConnectAdminVueModule = null;

    private constructor() {

        super(ModuleNFCConnect.getInstance().name);
        this.policies_needed = [
            ModuleNFCConnect.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleNFCConnect.POLICY_BO_ACCESS]) {
            return;
        }

        let menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleNFCConnect.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "NFCConnectAdminVueModule",
                    "fa-wifi",
                    20,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(
            NFCTagVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleNFCConnect.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                NFCTagVO.API_TYPE_ID,
                "fa-wifi",
                10,
                null,
                null,
                menuBranch.id
            ),
            this.routes);
        await CRUDComponentManager.getInstance().registerCRUD(
            NFCTagUserVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleNFCConnect.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                NFCTagUserVO.API_TYPE_ID,
                "fa-wifi",
                20,
                null,
                null,
                menuBranch.id
            ),

            this.routes);
    }
}