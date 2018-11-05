import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import ModuleCommerce from '../../../../shared/modules/Commerce/ModuleCommerce';
import AbonnementVO from '../../../../shared/modules/Commerce/Abonnement/vos/AbonnementVO';
import PackAbonnementVO from '../../../../shared/modules/Commerce/Abonnement/vos/PackAbonnementVO';
import ClientVO from '../../../../shared/modules/Commerce/Client/vos/ClientVO';
import CommandeVO from '../../../../shared/modules/Commerce/Commande/vos/CommandeVO';
import PaiementVO from '../../../../shared/modules/Commerce/Paiement/vos/PaiementVO';
import ProduitVO from '../../../../shared/modules/Commerce/Produit/vos/ProduitVO';
import ServiceVO from '../../../../shared/modules/Commerce/Service/vos/ServiceVO';
import InformationsVO from '../../../../shared/modules/Commerce/Client/vos/InformationsVO';
import LigneCommandeVO from '../../../../shared/modules/Commerce/Commande/vos/LigneCommandeVO';
import ModePaiementVO from '../../../../shared/modules/Commerce/Paiement/vos/ModePaiementVO';
import CategorieProduitVO from '../../../../shared/modules/Commerce/Produit/vos/CategorieProduitVO';

export default class CommerceAdminVueModule extends VueModuleBase {

    public static DEFAULT_CMS_MENU_BRANCH: MenuBranch = new MenuBranch(
        "CommerceAdminVueModule",
        MenuElementBase.PRIORITY_MEDIUM,
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

    public initialize(): void {
        this.initializeAbonnement();
        this.initializeClient();
        this.initializeCommande();
        this.initializePaiement();
        this.initializeProduit();
    }

    private initializeAbonnement(): void {
        let menuBranchAbonnement: MenuBranch = new MenuBranch(
            "AbonnementAdminVueModule",
            MenuElementBase.PRIORITY_MEDIUM,
            "fa-user",
            []
        );
        CRUDComponentManager.getInstance().registerCRUD(
            AbonnementVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AbonnementVO", MenuElementBase.PRIORITY_MEDIUM, "fa-newspaper-o"),
                CommerceAdminVueModule.DEFAULT_CMS_MENU_BRANCH,
                menuBranchAbonnement
            ),
            this.routes
        );
        CRUDComponentManager.getInstance().registerCRUD(
            PackAbonnementVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("PackAbonnementVO", MenuElementBase.PRIORITY_MEDIUM, "fa-newspaper-o"),
                CommerceAdminVueModule.DEFAULT_CMS_MENU_BRANCH,
                menuBranchAbonnement
            ),
            this.routes
        );
    }

    private initializeClient(): void {
        let menuBranchClient: MenuBranch = new MenuBranch(
            "ClientAdminVueModule",
            MenuElementBase.PRIORITY_MEDIUM,
            "fa-user",
            []
        );
        CRUDComponentManager.getInstance().registerCRUD(
            ClientVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("ClientVO", MenuElementBase.PRIORITY_MEDIUM, "fa-user"),
                CommerceAdminVueModule.DEFAULT_CMS_MENU_BRANCH,
                menuBranchClient,
            ),
            this.routes
        );
        CRUDComponentManager.getInstance().registerCRUD(
            InformationsVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("InformationsVO", MenuElementBase.PRIORITY_MEDIUM, "fa-user"),
                CommerceAdminVueModule.DEFAULT_CMS_MENU_BRANCH,
                menuBranchClient,
            ),
            this.routes
        );
    }

    private initializeCommande(): void {
        let menuBranchCommande: MenuBranch = new MenuBranch(
            "CommandeAdminVueModule",
            MenuElementBase.PRIORITY_MEDIUM,
            "fa-shopping-cart",
            []
        );
        CRUDComponentManager.getInstance().registerCRUD(
            CommandeVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("CommandeVO", MenuElementBase.PRIORITY_MEDIUM, "fa-shopping-cart"),
                CommerceAdminVueModule.DEFAULT_CMS_MENU_BRANCH,
                menuBranchCommande,
            ),
            this.routes
        );
        CRUDComponentManager.getInstance().registerCRUD(
            LigneCommandeVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("LigneCommandeVO", MenuElementBase.PRIORITY_MEDIUM, "fa-shopping-cart"),
                CommerceAdminVueModule.DEFAULT_CMS_MENU_BRANCH,
                menuBranchCommande,
            ),
            this.routes
        );
        CRUDComponentManager.getInstance().registerCRUD(
            ServiceVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("ServiceVO", MenuElementBase.PRIORITY_MEDIUM, ""),
                CommerceAdminVueModule.DEFAULT_CMS_MENU_BRANCH,
                menuBranchCommande,
            ),
            this.routes
        );
    }

    private initializePaiement(): void {
        let menuBranchPaiement: MenuBranch = new MenuBranch(
            "PaiementAdminVueModule",
            MenuElementBase.PRIORITY_MEDIUM,
            "fa-credit-card",
            []
        );
        CRUDComponentManager.getInstance().registerCRUD(
            PaiementVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("PaiementVO", MenuElementBase.PRIORITY_MEDIUM, "fa-credit-card"),
                CommerceAdminVueModule.DEFAULT_CMS_MENU_BRANCH,
                menuBranchPaiement,
            ),
            this.routes
        );
        CRUDComponentManager.getInstance().registerCRUD(
            ModePaiementVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("ModePaiementVO", MenuElementBase.PRIORITY_MEDIUM, "fa-credit-card"),
                CommerceAdminVueModule.DEFAULT_CMS_MENU_BRANCH,
                menuBranchPaiement,
            ),
            this.routes
        );
    }

    private initializeProduit(): void {
        let menuBranchProduit: MenuBranch = new MenuBranch(
            "ProduitAdminVueModule",
            MenuElementBase.PRIORITY_MEDIUM,
            "fa-shopping-cart",
            []
        );
        CRUDComponentManager.getInstance().registerCRUD(
            ProduitVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("ProduitVO", MenuElementBase.PRIORITY_MEDIUM, ""),
                CommerceAdminVueModule.DEFAULT_CMS_MENU_BRANCH,
                menuBranchProduit,
            ),
            this.routes
        );
        CRUDComponentManager.getInstance().registerCRUD(
            CategorieProduitVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("CategorieProduitVO", MenuElementBase.PRIORITY_MEDIUM, ""),
                CommerceAdminVueModule.DEFAULT_CMS_MENU_BRANCH,
                menuBranchProduit,
            ),
            this.routes
        );
    }
}