// import UserVO from '../../../../shared/modules/AccessPolicy/vos/UserVO';
// import AbonnementVO from '../../../../shared/modules/Commerce/Abonnement/vos/AbonnementVO';
// import PackAbonnementVO from '../../../../shared/modules/Commerce/Abonnement/vos/PackAbonnementVO';
// import ClientVO from '../../../../shared/modules/Commerce/Client/vos/ClientVO';
// import InformationsVO from '../../../../shared/modules/Commerce/Client/vos/InformationsVO';
// import CommandeVO from '../../../../shared/modules/Commerce/Commande/vos/CommandeVO';
// import LigneCommandeVO from '../../../../shared/modules/Commerce/Commande/vos/LigneCommandeVO';
// import ModuleCommerce from '../../../../shared/modules/Commerce/ModuleCommerce';
// import ModePaiementVO from '../../../../shared/modules/Commerce/Paiement/vos/ModePaiementVO';
// import PaiementVO from '../../../../shared/modules/Commerce/Paiement/vos/PaiementVO';
// import CategorieProduitVO from '../../../../shared/modules/Commerce/Produit/vos/CategorieProduitVO';
// import FacturationProduitVO from '../../../../shared/modules/Commerce/Produit/vos/FacturationProduitVO';
// import FacturationVO from '../../../../shared/modules/Commerce/Produit/vos/FacturationVO';
// import ProduitVO from '../../../../shared/modules/Commerce/Produit/vos/ProduitVO';
// import TypeProduitVO from '../../../../shared/modules/Commerce/Produit/vos/TypeProduitVO';
// import Datatable from '../../../../shared/modules/DAO/vos/datatable/Datatable';
// import ManyToOneReferenceDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/ManyToOneReferenceDatatableFieldVO';
// import SimpleDatatableFieldVO from '../../../../shared/modules/DAO/vos/datatable/SimpleDatatableFieldVO';
// import {VOsTypesManager} from '../../../../shared/modules/VOsTypesManager';
// import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
// import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
// // import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
// import menuelt from '../../../ts/components/menu/vos/menuelt';
// import VueModuleBase from '../../../ts/modules/VueModuleBase';
// import CRUD from '../../../../shared/modules/DAO/vos/CRUD';
// import MenuController from '../menu/MenuController';
// import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
// import VueAppController from '../../../VueAppController';

// export default class CommerceAdminVueModule extends VueModuleBase {

//     public static DEFAULT_COMMERCE_MENU_BRANCH: MenuBranch = new MenuBranch(
//         "CommerceAdminVueModule",
//         30,
//         "fa-shopping-cart",
//         []
//     );

//     public static getInstance(): CommerceAdminVueModule {
//         if (!CommerceAdminVueModule.instance) {
//             CommerceAdminVueModule.instance = new CommerceAdminVueModule();
//         }

//         return CommerceAdminVueModule.instance;
//     }

//     private static instance: CommerceAdminVueModule = null;

//     private constructor() {

//         super(ModuleCommerce.getInstance().name);
//     }

//     public async initializeAsync(): void {
//         await this.initializeAbonnement();
//         await this.initializeClient();
//         await this.initializeCommande();
//         await this.initializePaiement();
//         await this.initializeProduit();
//         await this.initializeFacturation();
//     }

//     private async initializeAbonnement() {
//         let menuBranchAbonnement: MenuElementVO =
//             await MenuController.getInstance().declare_menu_element(
//                 MenuElementVO.create_new(
//                     null,
//                     VueAppController.getInstance().app_name,
//                     "AbonnementAdminVueModule",
//                     "fa-newspaper",
//                     30,
//                     null
//                 )
//             );

//         await CRUDComponentManager.getInstance().registerCRUD(
//             AbonnementVO.API_TYPE_ID,
//             null,
//             new menuelt(
//                 new MenuLeaf("AbonnementVO", 30, "fa-newspaper"),
//                 CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
//                 menuBranchAbonnement
//             ),
//             this.routes
//         );
//         await CRUDComponentManager.getInstance().registerCRUD(
//             PackAbonnementVO.API_TYPE_ID,
//             null,
//             new menuelt(
//                 new MenuLeaf("PackAbonnementVO", 30, "fa-newspaper"),
//                 CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
//                 menuBranchAbonnement
//             ),
//             this.routes
//         );
//     }

//     private async initializeClient() {
//         let menuBranchClient: MenuBranch = new MenuBranch(
//             "ClientAdminVueModule",
//             30,
//             "fa-user",
//             []
//         );

//         let menuBranchAbonnement: MenuElementVO =
//             await MenuController.getInstance().declare_menu_element(
//                 MenuElementVO.create_new(
//                     null,
//                     VueAppController.getInstance().app_name,
//                     "AbonnementAdminVueModule",
//                     "fa-newspaper",
//                     30,
//                     null
//                 )
//             );

//         await CRUDComponentManager.getInstance().registerCRUD(
//             ClientVO.API_TYPE_ID,
//             null,
//             new menuelt(
//                 new MenuLeaf("ClientVO", 30, "fa-user"),
//                 CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
//                 menuBranchClient,
//             ),
//             this.routes
//         );
//         await CRUDComponentManager.getInstance().registerCRUD(
//             InformationsVO.API_TYPE_ID,
//             null,
//             new menuelt(
//                 new MenuLeaf("InformationsVO", 30, "fa-user"),
//                 CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
//                 menuBranchClient,
//             ),
//             this.routes
//         );
//     }

//     private initializeCommande(): void {
//         let menuBranchCommande: MenuBranch = new MenuBranch(
//             "CommandeAdminVueModule",
//             30,
//             "fa-shopping-cart",
//             []
//         );
//         await CRUDComponentManager.getInstance().registerCRUD(
//             CommandeVO.API_TYPE_ID,
//             this.getCommandeCRUD(),
//             new menuelt(
//                 new MenuLeaf("CommandeVO", 30, "fa-shopping-cart"),
//                 CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
//                 menuBranchCommande,
//             ),
//             this.routes
//         );
//         await CRUDComponentManager.getInstance().registerCRUD(
//             LigneCommandeVO.API_TYPE_ID,
//             this.getLigneCommandeCRUD(),
//             new menuelt(
//                 new MenuLeaf("LigneCommandeVO", 30, "fa-shopping-cart"),
//                 CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
//                 menuBranchCommande,
//             ),
//             this.routes
//         );
//     }

//     private initializePaiement(): void {
//         let menuBranchPaiement: MenuBranch = new MenuBranch(
//             "PaiementAdminVueModule",
//             30,
//             "fa-credit-card",
//             []
//         );
//         await CRUDComponentManager.getInstance().registerCRUD(
//             PaiementVO.API_TYPE_ID,
//             this.getPaiementCRUD(),
//             new menuelt(
//                 new MenuLeaf("PaiementVO", 30, "fa-credit-card"),
//                 CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
//                 menuBranchPaiement,
//             ),
//             this.routes
//         );
//         await CRUDComponentManager.getInstance().registerCRUD(
//             ModePaiementVO.API_TYPE_ID,
//             null,
//             new menuelt(
//                 new MenuLeaf("ModePaiementVO", 30, "fa-credit-card"),
//                 CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
//                 menuBranchPaiement,
//             ),
//             this.routes
//         );
//     }

//     private initializeProduit(): void {
//         let menuBranchProduit: MenuBranch = new MenuBranch(
//             "ProduitAdminVueModule",
//             30,
//             "fa-shopping-cart",
//             []
//         );
//         await CRUDComponentManager.getInstance().registerCRUD(
//             CategorieProduitVO.API_TYPE_ID,
//             null,
//             new menuelt(
//                 new MenuLeaf("CategorieProduitVO", 30, "fa-shopping-cart"),
//                 CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
//                 menuBranchProduit,
//             ),
//             this.routes
//         );
//         await CRUDComponentManager.getInstance().registerCRUD(
//             TypeProduitVO.API_TYPE_ID,
//             null,
//             new menuelt(
//                 new MenuLeaf("TypeProduitVO", 30, "fa-shopping-cart"),
//                 CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
//                 menuBranchProduit,
//             ),
//             this.routes
//         );
//         await CRUDComponentManager.getInstance().registerCRUD(
//             ProduitVO.API_TYPE_ID,
//             null,
//             new menuelt(
//                 new MenuLeaf("ProduitVO", 30, "fa-shopping-cart"),
//                 CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
//                 menuBranchProduit,
//             ),
//             this.routes
//         );
//     }

//     private initializeFacturation(): void {
//         let menuBranchFacturation: MenuBranch = new MenuBranch(
//             "FacturationAdminVueModule",
//             30,
//             "fa-credit-card",
//             []
//         );
//         await CRUDComponentManager.getInstance().registerCRUD(
//             FacturationVO.API_TYPE_ID,
//             null,
//             new menuelt(
//                 new MenuLeaf("FacturationVO", 30, "fa-shopping-cart"),
//                 CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
//                 menuBranchFacturation,
//             ),
//             this.routes
//         );
//         await CRUDComponentManager.getInstance().registerCRUD(
//             FacturationProduitVO.API_TYPE_ID,
//             this.getFacturationProduitCRUD(),
//             new menuelt(
//                 new MenuLeaf("FacturationProduitVO", 30, "fa-shopping-cart"),
//                 CommerceAdminVueModule.DEFAULT_COMMERCE_MENU_BRANCH,
//                 menuBranchFacturation,
//             ),
//             this.routes
//         );
//     }

//     private getCommandeCRUD(): CRUD<CommandeVO> {
//         let crud: CRUD<CommandeVO> = new CRUD<CommandeVO>(new Datatable<CommandeVO>(CommandeVO.API_TYPE_ID));

//         crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("identifiant"));
//         crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("date"));
//         crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("statut"));

//         crud.readDatatable.pushField(ManyToOneReferenceDatatableFieldVO.createNew(
//             "client_id",
//             VOsTypesManager.moduleTables_by_voType[ClientVO.API_TYPE_ID], [
//             ManyToOneReferenceDatatableFieldVO.createNew(
//                 "user_id",
//                 VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID], [
//                 SimpleDatatableFieldVO.createNew("name")
//             ])
//         ]));

//         CRUD.addManyToManyFields(crud, VOsTypesManager.moduleTables_by_voType[CommandeVO.API_TYPE_ID]);
//         CRUD.addOneToManyFields(crud, VOsTypesManager.moduleTables_by_voType[CommandeVO.API_TYPE_ID]);

//         return crud;
//     }

//     private getLigneCommandeCRUD(): CRUD<LigneCommandeVO> {
//         let crud: CRUD<LigneCommandeVO> = new CRUD<LigneCommandeVO>(new Datatable<LigneCommandeVO>(LigneCommandeVO.API_TYPE_ID));

//         crud.readDatatable.pushField(ManyToOneReferenceDatatableFieldVO.createNew(
//             "commande_id",
//             VOsTypesManager.moduleTables_by_voType[CommandeVO.API_TYPE_ID], [
//             SimpleDatatableFieldVO.createNew("identifiant")
//         ]));
//         crud.readDatatable.pushField(ManyToOneReferenceDatatableFieldVO.createNew(
//             "produit_id",
//             VOsTypesManager.moduleTables_by_voType[ProduitVO.API_TYPE_ID], [
//             SimpleDatatableFieldVO.createNew("titre")
//         ]));
//         crud.readDatatable.pushField(ManyToOneReferenceDatatableFieldVO.createNew(
//             "informations_id",
//             VOsTypesManager.moduleTables_by_voType[InformationsVO.API_TYPE_ID], [
//             SimpleDatatableFieldVO.createNew("email")
//         ]));
//         crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("prix_unitaire"));
//         crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("quantite"));

//         CRUD.addManyToManyFields(crud, VOsTypesManager.moduleTables_by_voType[LigneCommandeVO.API_TYPE_ID]);
//         CRUD.addOneToManyFields(crud, VOsTypesManager.moduleTables_by_voType[LigneCommandeVO.API_TYPE_ID]);

//         return crud;
//     }

//     private getPaiementCRUD(): CRUD<PaiementVO> {
//         let crud: CRUD<PaiementVO> = new CRUD<PaiementVO>(new Datatable<PaiementVO>(PaiementVO.API_TYPE_ID));

//         crud.readDatatable.pushField(ManyToOneReferenceDatatableFieldVO.createNew(
//             "abonnement_id",
//             VOsTypesManager.moduleTables_by_voType[AbonnementVO.API_TYPE_ID], [
//             SimpleDatatableFieldVO.createNew("echeance")
//         ]));
//         crud.readDatatable.pushField(ManyToOneReferenceDatatableFieldVO.createNew(
//             "mode_paiement_id",
//             VOsTypesManager.moduleTables_by_voType[ModePaiementVO.API_TYPE_ID], [
//             SimpleDatatableFieldVO.createNew("mode")
//         ]));
//         crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("statut"));

//         CRUD.addManyToManyFields(crud, VOsTypesManager.moduleTables_by_voType[PaiementVO.API_TYPE_ID]);
//         CRUD.addOneToManyFields(crud, VOsTypesManager.moduleTables_by_voType[PaiementVO.API_TYPE_ID]);

//         return crud;
//     }

//     private getFacturationProduitCRUD(): CRUD<FacturationProduitVO> {
//         let crud: CRUD<FacturationProduitVO> = new CRUD<FacturationProduitVO>(new Datatable<FacturationProduitVO>(FacturationProduitVO.API_TYPE_ID));

//         crud.readDatatable.pushField(ManyToOneReferenceDatatableFieldVO.createNew(
//             "facturation_id",
//             VOsTypesManager.moduleTables_by_voType[FacturationVO.API_TYPE_ID], [
//             SimpleDatatableFieldVO.createNew("titre")
//         ]));
//         crud.readDatatable.pushField(ManyToOneReferenceDatatableFieldVO.createNew(
//             "produit_id",
//             VOsTypesManager.moduleTables_by_voType[ProduitVO.API_TYPE_ID], [
//             SimpleDatatableFieldVO.createNew("titre")
//         ]));
//         crud.readDatatable.pushField(SimpleDatatableFieldVO.createNew("par_defaut"));

//         CRUD.addManyToManyFields(crud, VOsTypesManager.moduleTables_by_voType[FacturationProduitVO.API_TYPE_ID]);
//         CRUD.addOneToManyFields(crud, VOsTypesManager.moduleTables_by_voType[FacturationProduitVO.API_TYPE_ID]);

//         return crud;
//     }
// }