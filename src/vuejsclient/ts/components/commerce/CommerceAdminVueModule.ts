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
import InformationsVO from '../../../../shared/modules/Commerce/Client/vos/InformationsVO';
import LigneCommandeVO from '../../../../shared/modules/Commerce/Commande/vos/LigneCommandeVO';
import ModePaiementVO from '../../../../shared/modules/Commerce/Paiement/vos/ModePaiementVO';
import CategorieProduitVO from '../../../../shared/modules/Commerce/Produit/vos/CategorieProduitVO';
import TypeProduitVO from '../../../../shared/modules/Commerce/Produit/vos/TypeProduitVO';
import CRUD from '../crud/vos/CRUD';
import { CONNREFUSED } from 'dns';
import SimpleDatatableField from '../datatable/vos/SimpleDatatableField';
import Datatable from '../datatable/vos/Datatable';
import ManyToOneReferenceDatatableField from '../datatable/vos/ManyToOneReferenceDatatableField';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
import ComputedDatatableField from '../datatable/vos/ComputedDatatableField';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import FacturationVO from '../../../../shared/modules/Commerce/Produit/vos/FacturationVO';
import FacturationProduitVO from '../../../../shared/modules/Commerce/Produit/vos/FacturationProduitVO';

export default class CommerceAdminVueModule extends VueModuleBase {

    public static DEFAULT_COMMERCE_MENU_BRANCH: MenuBranch = new MenuBranch(
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
        this.initializeFacturation();
    }

    private initializeAbonnement(): void {
        let menuBranchAbonnement: MenuBranch = new MenuBranch(
            "AbonnementAdminVueModule",
            MenuElementBase.PRIORITY_MEDIUM,
            "fa-newspaper-o",
            []
        );
        CRUDComponentManager.getInstance().registerCRUD(
            AbonnementVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("AbonnementVO", MenuElementBase.PRIORITY_MEDIUM, "fa-newspaper-o"),
                CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
                menuBranchAbonnement
            ),
            this.routes
        );
        CRUDComponentManager.getInstance().registerCRUD(
            PackAbonnementVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("PackAbonnementVO", MenuElementBase.PRIORITY_MEDIUM, "fa-newspaper-o"),
                CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
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
                CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
                menuBranchClient,
            ),
            this.routes
        );
        CRUDComponentManager.getInstance().registerCRUD(
            InformationsVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("InformationsVO", MenuElementBase.PRIORITY_MEDIUM, "fa-user"),
                CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
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
            this.getCommandeCRUD(),
            new MenuPointer(
                new MenuLeaf("CommandeVO", MenuElementBase.PRIORITY_MEDIUM, "fa-shopping-cart"),
                CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
                menuBranchCommande,
            ),
            this.routes
        );
        CRUDComponentManager.getInstance().registerCRUD(
            LigneCommandeVO.API_TYPE_ID,
            this.getLigneCommandeCRUD(),
            new MenuPointer(
                new MenuLeaf("LigneCommandeVO", MenuElementBase.PRIORITY_MEDIUM, "fa-shopping-cart"),
                CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
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
            this.getPaiementCRUD(),
            new MenuPointer(
                new MenuLeaf("PaiementVO", MenuElementBase.PRIORITY_MEDIUM, "fa-credit-card"),
                CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
                menuBranchPaiement,
            ),
            this.routes
        );
        CRUDComponentManager.getInstance().registerCRUD(
            ModePaiementVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("ModePaiementVO", MenuElementBase.PRIORITY_MEDIUM, "fa-credit-card"),
                CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
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
            CategorieProduitVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("CategorieProduitVO", MenuElementBase.PRIORITY_MEDIUM, "fa-shopping-cart"),
                CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
                menuBranchProduit,
            ),
            this.routes
        );
        CRUDComponentManager.getInstance().registerCRUD(
            TypeProduitVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("TypeProduitVO", MenuElementBase.PRIORITY_MEDIUM, "fa-shopping-cart"),
                CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
                menuBranchProduit,
            ),
            this.routes
        );
        CRUDComponentManager.getInstance().registerCRUD(
            ProduitVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("ProduitVO", MenuElementBase.PRIORITY_MEDIUM, "fa-shopping-cart"),
                CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
                menuBranchProduit,
            ),
            this.routes
        );
    }

    private initializeFacturation(): void {
        let menuBranchFacturation: MenuBranch = new MenuBranch(
            "FacturationAdminVueModule",
            MenuElementBase.PRIORITY_MEDIUM,
            "fa-credit-card",
            []
        );
        CRUDComponentManager.getInstance().registerCRUD(
            FacturationVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("FacturationVO", MenuElementBase.PRIORITY_MEDIUM, "fa-shopping-cart"),
                CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
                menuBranchFacturation,
            ),
            this.routes
        );
        CRUDComponentManager.getInstance().registerCRUD(
            FacturationProduitVO.API_TYPE_ID,
            this.getFacturationProduitCRUD(),
            new MenuPointer(
                new MenuLeaf("FacturationProduitVO", MenuElementBase.PRIORITY_MEDIUM, "fa-shopping-cart"),
                CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
                menuBranchFacturation,
            ),
            this.routes
        );
    }

    private getCommandeCRUD(): CRUD<CommandeVO> {
        let crud: CRUD<CommandeVO> = new CRUD<CommandeVO>(new Datatable<CommandeVO>(CommandeVO.API_TYPE_ID));

        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("identifiant"));
        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("date"));
        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("statut"));

        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "client_id",
            VOsTypesManager.getInstance().moduleTables_by_voType[ClientVO.API_TYPE_ID], [
                new ManyToOneReferenceDatatableField<any>(
                    "user_id",
                    VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID], [
                        new SimpleDatatableField("name")
                    ])
            ]));

        CRUD.addManyToManyFields(crud, VOsTypesManager.getInstance().moduleTables_by_voType[CommandeVO.API_TYPE_ID]);
        CRUD.addOneToManyFields(crud, VOsTypesManager.getInstance().moduleTables_by_voType[CommandeVO.API_TYPE_ID]);

        return crud;
    }

    private getLigneCommandeCRUD(): CRUD<LigneCommandeVO> {
        let crud: CRUD<LigneCommandeVO> = new CRUD<LigneCommandeVO>(new Datatable<LigneCommandeVO>(LigneCommandeVO.API_TYPE_ID));

        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "commande_id",
            VOsTypesManager.getInstance().moduleTables_by_voType[CommandeVO.API_TYPE_ID], [
                new SimpleDatatableField("identifiant")
            ]));
        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "produit_id",
            VOsTypesManager.getInstance().moduleTables_by_voType[ProduitVO.API_TYPE_ID], [
                new SimpleDatatableField("titre")
            ]));
        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "informations_id",
            VOsTypesManager.getInstance().moduleTables_by_voType[InformationsVO.API_TYPE_ID], [
                new SimpleDatatableField("email")
            ]));
        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("prix_unitaire"));
        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("quantite"));

        CRUD.addManyToManyFields(crud, VOsTypesManager.getInstance().moduleTables_by_voType[LigneCommandeVO.API_TYPE_ID]);
        CRUD.addOneToManyFields(crud, VOsTypesManager.getInstance().moduleTables_by_voType[LigneCommandeVO.API_TYPE_ID]);

        return crud;
    }

    private getPaiementCRUD(): CRUD<PaiementVO> {
        let crud: CRUD<PaiementVO> = new CRUD<PaiementVO>(new Datatable<PaiementVO>(PaiementVO.API_TYPE_ID));

        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "abonnement_id",
            VOsTypesManager.getInstance().moduleTables_by_voType[AbonnementVO.API_TYPE_ID], [
                new SimpleDatatableField("echeance")
            ]));
        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "mode_paiement_id",
            VOsTypesManager.getInstance().moduleTables_by_voType[ModePaiementVO.API_TYPE_ID], [
                new SimpleDatatableField("mode")
            ]));
        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("statut"));

        CRUD.addManyToManyFields(crud, VOsTypesManager.getInstance().moduleTables_by_voType[PaiementVO.API_TYPE_ID]);
        CRUD.addOneToManyFields(crud, VOsTypesManager.getInstance().moduleTables_by_voType[PaiementVO.API_TYPE_ID]);

        return crud;
    }

    private getFacturationProduitCRUD(): CRUD<FacturationProduitVO> {
        let crud: CRUD<FacturationProduitVO> = new CRUD<FacturationProduitVO>(new Datatable<FacturationProduitVO>(FacturationProduitVO.API_TYPE_ID));

        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "facturation_id",
            VOsTypesManager.getInstance().moduleTables_by_voType[FacturationVO.API_TYPE_ID], [
                new SimpleDatatableField("titre")
            ]));
        crud.readDatatable.pushField(new ManyToOneReferenceDatatableField<any>(
            "produit_id",
            VOsTypesManager.getInstance().moduleTables_by_voType[ProduitVO.API_TYPE_ID], [
                new SimpleDatatableField("titre")
            ]));
        crud.readDatatable.pushField(new SimpleDatatableField<any, any>("par_defaut"));

        CRUD.addManyToManyFields(crud, VOsTypesManager.getInstance().moduleTables_by_voType[FacturationProduitVO.API_TYPE_ID]);
        CRUD.addOneToManyFields(crud, VOsTypesManager.getInstance().moduleTables_by_voType[FacturationProduitVO.API_TYPE_ID]);

        return crud;
    }
}