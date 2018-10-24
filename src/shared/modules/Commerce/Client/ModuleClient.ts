import ClientVO from './vos/ClientVO';
import InformationsVO from './vos/InformationsVO';
import Module from '../../Module';
import ModuleTable from '../../ModuleTable';
import ModuleTableField from '../../ModuleTableField';
import ModuleAccessPolicy from '../../AccessPolicy/ModuleAccessPolicy';
import ModuleDAO from '../../DAO/ModuleDAO';

export default class ModuleClient extends Module {

    public static getInstance(): ModuleClient {
        if (!ModuleClient.instance) {
            ModuleClient.instance = new ModuleClient();
        }
        return ModuleClient.instance;
    }

    private static instance: ModuleClient = null;

    public datatable_informations: ModuleTable<InformationsVO> = null;
    public datatable_client: ModuleTable<ClientVO> = null;

    private constructor() {
        super('commerce_client', 'Client', 'Commerce/Client');
    }

    public async hook_module_configure(db) {
        return true;
    }

    public async hook_module_async_client_admin_initialization() { }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeInformations();
        this.initializeClient();
    }

    public initializeInformations(): void {
        // Création de la table Informations
        let datatable_fields = [
            new ModuleTableField('nom', ModuleTableField.FIELD_TYPE_string, 'Nom'),
            new ModuleTableField('prenom', ModuleTableField.FIELD_TYPE_string, 'Prenom'),
            new ModuleTableField('telephone', ModuleTableField.FIELD_TYPE_string, 'Telephone'),
            new ModuleTableField('adresse', ModuleTableField.FIELD_TYPE_string, 'Adresse'),
            new ModuleTableField('code_postal', ModuleTableField.FIELD_TYPE_string, 'Code Postal'),
            new ModuleTableField('ville', ModuleTableField.FIELD_TYPE_string, 'Ville'),
            new ModuleTableField('societe', ModuleTableField.FIELD_TYPE_string, 'Societe'),
            new ModuleTableField('siret', ModuleTableField.FIELD_TYPE_string, 'Siret'),
            new ModuleTableField('email', ModuleTableField.FIELD_TYPE_string, 'Email'),
        ];
        this.datatable_informations = new ModuleTable<InformationsVO>(this, InformationsVO.API_TYPE_ID, datatable_fields, null, 'Informations');
        this.datatables.push(this.datatable_informations);
    }

    public initializeClient(): void {
        // Création de la table Client
        let field_informations_id: ModuleTableField<number> = new ModuleTableField('informations_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Informations', true);
        let field_user_id: ModuleTableField<number> = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'User', true);

        let datatable_fields = [
            new ModuleTableField('id_client_facturationpro', ModuleTableField.FIELD_TYPE_string, 'ID Client FacturationPro'),
            field_user_id,
            field_informations_id
        ];
        this.datatable_client = new ModuleTable<ClientVO>(this, ClientVO.API_TYPE_ID, datatable_fields, null, 'Client');
        field_user_id.addManyToOneRelation(this.datatable_client, ModuleAccessPolicy.getInstance().user_datatable);
        field_informations_id.addManyToOneRelation(this.datatable_client, this.datatable_informations);
        this.datatables.push(this.datatable_client);
    }

    public async getClientById(clientId: number): Promise<ClientVO> {
        return ModuleDAO.getInstance().getVoById<ClientVO>(ClientVO.API_TYPE_ID, clientId);
    }

    public async getInformationsById(infoId: number): Promise<InformationsVO> {
        return ModuleDAO.getInstance().getVoById<InformationsVO>(InformationsVO.API_TYPE_ID, infoId);
    }
}