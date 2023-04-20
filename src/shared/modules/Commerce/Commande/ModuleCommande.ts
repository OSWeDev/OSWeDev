import APIControllerWrapper from '../../API/APIControllerWrapper';
import NumberAndStringParamVO, { NumberAndStringParamVOStatic } from '../../API/vos/apis/NumberAndStringParamVO';
import NumberParamVO, { NumberParamVOStatic } from '../../API/vos/apis/NumberParamVO';
import GetAPIDefinition from '../../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../../API/vos/PostAPIDefinition';
import { query } from '../../ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../DAO/ModuleDAO';
import Module from '../../Module';
import ModuleTable from '../../ModuleTable';
import ModuleTableField from '../../ModuleTableField';
import { VOsTypesManager } from '../../VO/manager/VOsTypesManager';
import ModuleClient from '../Client/ModuleClient';
import ClientVO from '../Client/vos/ClientVO';
import InformationsVO from '../Client/vos/InformationsVO';
import ModuleProduit from '../Produit/ModuleProduit';
import ProduitsParamLignesParamVO, { ProduitsParamLignesParamVOStatic } from '../Produit/vos/apis/ProduitsParamLignesParamVO';
import ProduitVO from '../Produit/vos/ProduitVO';
import TypeProduitVO from '../Produit/vos/TypeProduitVO';
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
        this.fields = [];
        this.datatables = [];

        this.initializeCommande();
        this.initializeLigneCommande();
    }

    public initializeCommande(): void {
        // Table Commande
        let field_client_id: ModuleTableField<number> = new ModuleTableField('client_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Client', true);
        let datatable_fields = [
            new ModuleTableField('identifiant', ModuleTableField.FIELD_TYPE_string, 'Identifiant', true),
            new ModuleTableField('date', ModuleTableField.FIELD_TYPE_tstz, 'Date', true),
            new ModuleTableField('statut', ModuleTableField.FIELD_TYPE_enum, 'Statut', true).setEnumValues({
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
        let dt = new ModuleTable<CommandeVO>(this, CommandeVO.API_TYPE_ID, () => new CommandeVO(), datatable_fields, field_client_id, 'Commande');
        field_client_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ClientVO.API_TYPE_ID]);
        this.datatables.push(dt);
    }

    public initializeLigneCommande(): void {
        // Table Ligne De Commande
        let field_commande_id: ModuleTableField<number> = new ModuleTableField('commande_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Commande', true);
        let field_produit_id: ModuleTableField<number> = new ModuleTableField('produit_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Produit', true);
        let field_informations_id: ModuleTableField<number> = new ModuleTableField('informations_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Informations', true);

        let datatable_fields = [
            new ModuleTableField('prix_unitaire', ModuleTableField.FIELD_TYPE_amount, 'Prix unitaire', true),
            new ModuleTableField('quantite', ModuleTableField.FIELD_TYPE_float, 'Quantite', true),
            field_commande_id,
            field_produit_id,
            field_informations_id
        ];
        let dt = new ModuleTable<LigneCommandeVO>(this, LigneCommandeVO.API_TYPE_ID, () => new LigneCommandeVO(), datatable_fields, field_commande_id, 'Ligne commande');
        field_commande_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[CommandeVO.API_TYPE_ID]);
        field_produit_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[ProduitVO.API_TYPE_ID]);
        field_informations_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[InformationsVO.API_TYPE_ID]);
        this.datatables.push(dt);
    }

    public async getCommandeById(commandeId: number): Promise<CommandeVO> {
        return query(CommandeVO.API_TYPE_ID).filter_by_id(commandeId).select_vo<CommandeVO>();
    }

    public async getDetailsLignesCommandeByCommandeId(commandeId: number): Promise<LigneCommandeDetailsVO[]> {
        let detailLigneCommande: LigneCommandeDetailsVO[] = [];

        let lignes: LigneCommandeVO[] = await this.getLignesCommandeByCommandeId(commandeId);

        if (lignes) {
            for (let i in lignes) {
                let ligne: LigneCommandeVO = lignes[i];
                let produit: ProduitVO = await ModuleProduit.getInstance().getProduitById(ligne.produit_id);
                let informations: InformationsVO = await ModuleClient.getInstance().getInformationsById(ligne.informations_id);
                let typeProduit: TypeProduitVO = (produit) ? await query(TypeProduitVO.API_TYPE_ID).filter_by_id(produit.type_produit_id).select_vo<TypeProduitVO>() : null;
                let ligneParam: ParamLigneCommandeVO = (typeProduit) ? await this.getParamLigneCommandeById(ligne.id, typeProduit.vo_type_param) : null;

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