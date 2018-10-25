import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import ModuleCommerce from '../../../../shared/modules/Commerce/ModuleCommerce';
import AbonnementVO from '../../../../shared/modules/Commerce/Abonnement/vos/AbonnementVO';
import ClientVO from '../../../../shared/modules/Commerce/Client/vos/ClientVO';
import CommandeVO from '../../../../shared/modules/Commerce/Commande/vos/CommandeVO';
import PaiementVO from '../../../../shared/modules/Commerce/Paiement/vos/PaiementVO';
import ProduitVO from '../../../../shared/modules/Commerce/Produit/vos/ProduitVO';
import ServiceVO from '../../../../shared/modules/Commerce/Service/vos/ServiceVO';

export default class CommerceAdminVueModule extends VueModuleBase {

    public static DEFAULT_CMS_MENU_BRANCH: MenuBranch = new MenuBranch(
        "CommerceAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-shopping-cart",
        []
    );

    public static getInstance(): CommerceAdminVueModule {
        if (!CommerceAdminVueModule.instance) {
            CommerceAdminVueModule.instance = new CommerceAdminVueModule();
        }

        return CommerceAdminVueModule.instance;
    }

    private static instance: CommerceAdminVueModule = null;

    private constructor() {

        super(ModuleCommerce.getInstance().name);
    }

    public initialize() {
        let menuBranch: MenuBranch = CommerceAdminVueModule.DEFAULT_CMS_MENU_BRANCH;

        CRUDComponentManager.getInstance().registerCRUD(
            AbonnementVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AbonnementVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-newspaper-o"),
                menuBranch,
            ),
            this.routes
        );

        CRUDComponentManager.getInstance().registerCRUD(
            ClientVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("ClientVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-user"),
                menuBranch,
            ),
            this.routes
        );

        CRUDComponentManager.getInstance().registerCRUD(
            CommandeVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("CommandeVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-shopping-cart"),
                menuBranch,
            ),
            this.routes
        );

        CRUDComponentManager.getInstance().registerCRUD(
            PaiementVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("PaiementVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-credit-card"),
                menuBranch,
            ),
            this.routes
        );

        CRUDComponentManager.getInstance().registerCRUD(
            ProduitVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("ProduitVO", MenuElementBase.PRIORITY_ULTRAHIGH, ""),
                menuBranch,
            ),
            this.routes
        );

        CRUDComponentManager.getInstance().registerCRUD(
            ServiceVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("ServiceVO", MenuElementBase.PRIORITY_ULTRAHIGH, ""),
                menuBranch,
            ),
            this.routes
        );
    }
}