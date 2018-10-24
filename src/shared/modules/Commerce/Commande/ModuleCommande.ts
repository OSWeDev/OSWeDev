import CommandeVO from './vos/CommandeVO';
import ModuleClient from '../Client/ModuleClient';
import Module from '../../Module';
import ModuleTable from '../../ModuleTable';
import LigneCommandeVO from './vos/LigneCommandeVO';
import LigneCommandeDetailsVO from './vos/LigneCommandeDetailsVO';
import ModuleTableField from '../../ModuleTableField';
import ModuleService from '../Service/ModuleService';
import ModuleDAO from '../../DAO/ModuleDAO';
import ModuleAPI from '../../API/ModuleAPI';
import NumberParamVO from '../../API/vos/apis/NumberParamVO';
import ServiceVO from '../Service/vos/ServiceVO';
import ModuleProduit from '../Produit/ModuleProduit';
import GetAPIDefinition from '../../API/vos/GetAPIDefinition';

export default class ModuleCommande extends Module {
    public static APINAME_getCommandesUser: string = "getCommandesUser";
    public static APINAME_getLignesCommandeByCommandeId: string = "getLignesCommandeByCommandeId";

    public static getInstance(): ModuleCommande {
        if (!ModuleCommande.instance) {
            ModuleCommande.instance = new ModuleCommande();
        }
        return ModuleCommande.instance;
    }

    private static instance: ModuleCommande = null;

    public datatable_commande: ModuleTable<CommandeVO> = null;
    public datatable_ligne_commande: ModuleTable<LigneCommandeVO> = null;

    private constructor() {
        super('commerce_commande', 'Commande', 'Commerce/Commande');
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, CommandeVO[]>(
            ModuleCommande.APINAME_getCommandesUser,
            [CommandeVO.API_TYPE_ID],
            NumberParamVO.translateCheckAccessParams,
            NumberParamVO.URL,
            NumberParamVO.translateToURL,
            NumberParamVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, LigneCommandeVO[]>(
            ModuleCommande.APINAME_getLignesCommandeByCommandeId,
            [LigneCommandeVO.API_TYPE_ID],
            NumberParamVO.translateCheckAccessParams,
            NumberParamVO.URL,
            NumberParamVO.translateToURL,
            NumberParamVO.translateFromREQ
        ));
    }

    public async hook_module_configure(db) {
        return true;
    }

    public async hook_module_async_client_admin_initialization() { }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        if (ModuleClient.getInstance().actif) {
            this.initializeCommande();
        }

        if (ModuleService.getInstance().actif) {
            this.initializeLigneCommande();
        }
    }

    public initializeCommande(): void {
        // Table Commande
        let field_client_id: ModuleTableField<number> = new ModuleTableField('client_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Client', true);
        let datatable_fields = [
            new ModuleTableField('date', ModuleTableField.FIELD_TYPE_date, 'Date'),
            new ModuleTableField('statut', ModuleTableField.FIELD_TYPE_string, 'Statut'),
            field_client_id
        ];
        this.datatable_commande = new ModuleTable<CommandeVO>(this, CommandeVO.API_TYPE_ID, datatable_fields, null, 'Commande');
        field_client_id.addManyToOneRelation(this.datatable_commande, ModuleClient.getInstance().datatable_client);
        this.datatables.push(this.datatable_commande);
    }

    public initializeLigneCommande(): void {
        // Table Ligne De Commande
        let field_commande_id: ModuleTableField<number> = new ModuleTableField('commande_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Commande', true);
        let field_service_id: ModuleTableField<number> = new ModuleTableField('service_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Service', true);

        let datatable_fields = [
            new ModuleTableField('prix_unitaire', ModuleTableField.FIELD_TYPE_float, 'Prix unitaire'),
            new ModuleTableField('quantite', ModuleTableField.FIELD_TYPE_float, 'Quantite'),
            field_commande_id,
            field_service_id,
        ];
        this.datatable_ligne_commande = new ModuleTable<LigneCommandeVO>(this, LigneCommandeVO.API_TYPE_ID, datatable_fields, null, 'Ligne commande');
        field_commande_id.addManyToOneRelation(this.datatable_ligne_commande, this.datatable_commande);
        field_service_id.addManyToOneRelation(this.datatable_ligne_commande, ModuleService.getInstance().datatable);
        this.datatables.push(this.datatable_ligne_commande);
    }

    public async getCommandesUser(userId: number): Promise<CommandeVO[]> {
        return ModuleAPI.getInstance().handleAPI<NumberParamVO, CommandeVO[]>(ModuleCommande.APINAME_getCommandesUser, userId);
    }

    public async getCommandeById(commandeId: number): Promise<CommandeVO> {
        return ModuleDAO.getInstance().getVoById<CommandeVO>(CommandeVO.API_TYPE_ID, commandeId);
    }

    public async getLignesCommandeByCommandeId(commandeId: number): Promise<LigneCommandeVO[]> {
        return ModuleAPI.getInstance().handleAPI<NumberParamVO, LigneCommandeVO[]>(ModuleCommande.APINAME_getLignesCommandeByCommandeId, commandeId);
    }

    public async getDetailsLignesCommandeByCommandeId(commandeId: number): Promise<LigneCommandeDetailsVO[]> {
        let detailLigneCommande: LigneCommandeDetailsVO[] = [];

        let lignes: LigneCommandeVO[] = await this.getLignesCommandeByCommandeId(commandeId);

        if (lignes) {
            for (let i in lignes) {
                let ligne: LigneCommandeVO = lignes[i];
                let service: ServiceVO = await ModuleService.getInstance().getServiceById(ligne.service_id);

                detailLigneCommande.push(
                    new LigneCommandeDetailsVO(
                        ligne,
                        service,
                        (service) ? await ModuleProduit.getInstance().getProduitById(service.produit_id) : null,
                        (service) ? await ModuleClient.getInstance().getInformationsById(service.informations_id) : null,
                    )
                )
            }
        }

        return detailLigneCommande;
    }
}