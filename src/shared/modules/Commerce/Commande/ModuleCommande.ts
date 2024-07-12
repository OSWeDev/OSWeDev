import { field_names } from '../../../tools/ObjectHandler';
import APIControllerWrapper from '../../API/APIControllerWrapper';
import GetAPIDefinition from '../../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../../API/vos/PostAPIDefinition';
import NumberAndStringParamVO, { NumberAndStringParamVOStatic } from '../../API/vos/apis/NumberAndStringParamVO';
import NumberParamVO, { NumberParamVOStatic } from '../../API/vos/apis/NumberParamVO';
import { query } from '../../ContextFilter/vos/ContextQueryVO';
import ModuleTableController from '../../DAO/ModuleTableController';
import ModuleTableFieldController from '../../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../DAO/vos/ModuleTableFieldVO';
import Module from '../../Module';
import ModuleClient from '../Client/ModuleClient';
import ClientVO from '../Client/vos/ClientVO';
import InformationsVO from '../Client/vos/InformationsVO';
import ModuleProduit from '../Produit/ModuleProduit';
import ProduitVO from '../Produit/vos/ProduitVO';
import TypeProduitVO from '../Produit/vos/TypeProduitVO';
import ProduitsParamLignesParamVO, { ProduitsParamLignesParamVOStatic } from '../Produit/vos/apis/ProduitsParamLignesParamVO';
import CommandeVO from './vos/CommandeVO';
import LigneCommandeDetailsVO from './vos/LigneCommandeDetailsVO';
import LigneCommandeVO from './vos/LigneCommandeVO';
import ParamLigneCommandeVO from './vos/ParamLigneCommandeVO';

export default class ModuleCommande extends Module {
    public static APINAME_getCommandesUser: string = "getCommandesUser";
    public static APINAME_getLignesCommandeByCommandeId: string = "getLignesCommandeByCommandeId";
    public static APINAME_ajouterAuPanier: string = "ajouterAuPanier";
    public static APINAME_getParamLigneCommandeById: string = "getParamLigneCommandeById";
    public static APINAME_creationPanier: string = "creationPanier";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleCommande {
        if (!ModuleCommande.instance) {
            ModuleCommande.instance = new ModuleCommande();
        }
        return ModuleCommande.instance;
    }

    private static instance: ModuleCommande = null;


    public getParamLigneCommandeById: (ligneId: number, vo_type_param: string) => Promise<ParamLigneCommandeVO> = APIControllerWrapper.sah(ModuleCommande.APINAME_getParamLigneCommandeById);
    public getCommandesUser: (userId: number) => Promise<CommandeVO[]> = APIControllerWrapper.sah(ModuleCommande.APINAME_getCommandesUser);
    public getLignesCommandeByCommandeId: (commandeId: number) => Promise<LigneCommandeVO[]> = APIControllerWrapper.sah(ModuleCommande.APINAME_getLignesCommandeByCommandeId);
    public creationPanier: () => Promise<CommandeVO> = APIControllerWrapper.sah(ModuleCommande.APINAME_creationPanier);

    private constructor() {
        super(CommandeVO.API_TYPE_ID, 'Commande', 'Commerce/Commande');
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberParamVO, CommandeVO[]>(
            null,
            ModuleCommande.APINAME_getCommandesUser,
            [CommandeVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberParamVO, LigneCommandeVO[]>(
            null,
            ModuleCommande.APINAME_getLignesCommandeByCommandeId,
            [LigneCommandeVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<ProduitsParamLignesParamVO, CommandeVO>(
            null,
            ModuleCommande.APINAME_ajouterAuPanier,
            [CommandeVO.API_TYPE_ID],
            ProduitsParamLignesParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberAndStringParamVO, ParamLigneCommandeVO>(
            null,
            ModuleCommande.APINAME_getParamLigneCommandeById,
            [],
            NumberAndStringParamVOStatic
        ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<null, CommandeVO>(
            null,
            ModuleCommande.APINAME_creationPanier,
            [CommandeVO.API_TYPE_ID],
        ));
    }

    public initialize() {
        this.initializeCommande();
        this.initializeLigneCommande();
    }

    public initializeCommande(): void {
        // Table Commande
        const field_client_id: ModuleTableFieldVO = ModuleTableFieldController.create_new(CommandeVO.API_TYPE_ID, field_names<CommandeVO>().client_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Client', true);
        const datatable_fields = [
            ModuleTableFieldController.create_new(CommandeVO.API_TYPE_ID, field_names<CommandeVO>().identifiant, ModuleTableFieldVO.FIELD_TYPE_string, 'Identifiant', true),
            ModuleTableFieldController.create_new(CommandeVO.API_TYPE_ID, field_names<CommandeVO>().date, ModuleTableFieldVO.FIELD_TYPE_tstz, 'Date', true),
            ModuleTableFieldController.create_new(CommandeVO.API_TYPE_ID, field_names<CommandeVO>().statut, ModuleTableFieldVO.FIELD_TYPE_enum, 'Statut', true).setEnumValues({
                [CommandeVO.STATUT_PANIER]: CommandeVO.STATUT_LABELS[CommandeVO.STATUT_PANIER],
                [CommandeVO.STATUT_ANNULE]: CommandeVO.STATUT_LABELS[CommandeVO.STATUT_ANNULE],
                [CommandeVO.STATUT_EN_ATTENTE]: CommandeVO.STATUT_LABELS[CommandeVO.STATUT_EN_ATTENTE],
                [CommandeVO.STATUT_EN_COURS_DE_TRAITEMENT]: CommandeVO.STATUT_LABELS[CommandeVO.STATUT_EN_COURS_DE_TRAITEMENT],
                [CommandeVO.STATUT_TUNNEL_ACHAT_VALIDATION_PANIER]: CommandeVO.STATUT_LABELS[CommandeVO.STATUT_TUNNEL_ACHAT_VALIDATION_PANIER],
                [CommandeVO.STATUT_TUNNEL_ACHAT_VERIFICATION]: CommandeVO.STATUT_LABELS[CommandeVO.STATUT_TUNNEL_ACHAT_VERIFICATION],
                [CommandeVO.STATUT_TUNNEL_ACHAT_PAIEMENT]: CommandeVO.STATUT_LABELS[CommandeVO.STATUT_TUNNEL_ACHAT_PAIEMENT],
                [CommandeVO.STATUT_TERMINE]: CommandeVO.STATUT_LABELS[CommandeVO.STATUT_TERMINE],
            }),
            field_client_id
        ];
        const dt = ModuleTableController.create_new(this.name, CommandeVO, field_client_id, 'Commande');
        field_client_id.set_many_to_one_target_moduletable_name(ClientVO.API_TYPE_ID);
    }

    public initializeLigneCommande(): void {
        // Table Ligne De Commande
        const field_commande_id: ModuleTableFieldVO = ModuleTableFieldController.create_new(LigneCommandeVO.API_TYPE_ID, field_names<LigneCommandeVO>().commande_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Commande', true);
        const field_produit_id: ModuleTableFieldVO = ModuleTableFieldController.create_new(LigneCommandeVO.API_TYPE_ID, field_names<LigneCommandeVO>().produit_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Produit', true);
        const field_informations_id: ModuleTableFieldVO = ModuleTableFieldController.create_new(LigneCommandeVO.API_TYPE_ID, field_names<LigneCommandeVO>().informations_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Informations', true);

        const datatable_fields = [
            ModuleTableFieldController.create_new(LigneCommandeVO.API_TYPE_ID, field_names<LigneCommandeVO>().prix_unitaire, ModuleTableFieldVO.FIELD_TYPE_amount, 'Prix unitaire', true),
            ModuleTableFieldController.create_new(LigneCommandeVO.API_TYPE_ID, field_names<LigneCommandeVO>().quantite, ModuleTableFieldVO.FIELD_TYPE_float, 'Quantite', true),
            field_commande_id,
            field_produit_id,
            field_informations_id
        ];
        const dt = ModuleTableController.create_new(this.name, LigneCommandeVO, field_commande_id, 'Ligne commande');
        field_commande_id.set_many_to_one_target_moduletable_name(CommandeVO.API_TYPE_ID);
        field_produit_id.set_many_to_one_target_moduletable_name(ProduitVO.API_TYPE_ID);
        field_informations_id.set_many_to_one_target_moduletable_name(InformationsVO.API_TYPE_ID);
    }

    public async getCommandeById(commandeId: number): Promise<CommandeVO> {
        return query(CommandeVO.API_TYPE_ID).filter_by_id(commandeId).select_vo<CommandeVO>();
    }

    public async getDetailsLignesCommandeByCommandeId(commandeId: number): Promise<LigneCommandeDetailsVO[]> {
        const detailLigneCommande: LigneCommandeDetailsVO[] = [];

        const lignes: LigneCommandeVO[] = await this.getLignesCommandeByCommandeId(commandeId);

        if (lignes) {
            for (const i in lignes) {
                const ligne: LigneCommandeVO = lignes[i];
                const produit: ProduitVO = await ModuleProduit.getInstance().getProduitById(ligne.produit_id);
                const informations: InformationsVO = await ModuleClient.getInstance().getInformationsById(ligne.informations_id);
                const typeProduit: TypeProduitVO = (produit) ? await query(TypeProduitVO.API_TYPE_ID).filter_by_id(produit.type_produit_id).select_vo<TypeProduitVO>() : null;
                const ligneParam: ParamLigneCommandeVO = (typeProduit) ? await this.getParamLigneCommandeById(ligne.id, typeProduit.vo_type_param) : null;

                detailLigneCommande.push(
                    new LigneCommandeDetailsVO(
                        ligne,
                        produit,
                        informations,
                        ligneParam
                    )
                );
            }
        }

        return detailLigneCommande;
    }

    public getStatutCommande(commande: CommandeVO): string {
        if (commande && commande.statut != null) {
            return CommandeVO.STATUT_LABELS[commande.statut];
        }

        return null;
    }
}