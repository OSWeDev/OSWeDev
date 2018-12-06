import AccessPolicyVO from '../../AccessPolicy/vos/AccessPolicyVO';
import ModuleDAO from '../../DAO/ModuleDAO';
import Module from '../../Module';
import ModuleTable from '../../ModuleTable';
import ModuleTableField from '../../ModuleTableField';
import VOsTypesManager from '../../VOsTypesManager';
import ClientVO from './vos/ClientVO';
import InformationsVO from './vos/InformationsVO';
import ModuleAPI from '../../API/ModuleAPI';
import NumberParamVO from '../../API/vos/apis/NumberParamVO';
import GetAPIDefinition from '../../API/vos/GetAPIDefinition';
import UserVO from '../../AccessPolicy/vos/UserVO';

export default class ModuleClient extends Module {
    public static APINAME_getInformationsClientUser: string = "getInformationsClientUser";
    public static APINAME_getClientsByUserId: string = "getClientsByUserId";

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
        super(ClientVO.API_TYPE_ID, 'Client', 'Commerce/Client');
    }
    public registerApis() {
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, InformationsVO>(
            ModuleClient.APINAME_getInformationsClientUser,
            [InformationsVO.API_TYPE_ID],
            NumberParamVO.translateCheckAccessParams,
            NumberParamVO.URL,
            NumberParamVO.translateToURL,
            NumberParamVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, ClientVO[]>(
            ModuleClient.APINAME_getClientsByUserId,
            [ClientVO.API_TYPE_ID],
            NumberParamVO.translateCheckAccessParams,
            NumberParamVO.URL,
            NumberParamVO.translateToURL,
            NumberParamVO.translateFromREQ
        ));
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeInformations();
        this.initializeClient();
    }

    public initializeInformations(): void {
        // Création de la table Informations
        let default_label_field: ModuleTableField<string> = new ModuleTableField('email', ModuleTableField.FIELD_TYPE_string, 'Email');
        let datatable_fields = [
            new ModuleTableField('nom', ModuleTableField.FIELD_TYPE_string, 'Nom'),
            new ModuleTableField('prenom', ModuleTableField.FIELD_TYPE_string, 'Prenom'),
            new ModuleTableField('telephone', ModuleTableField.FIELD_TYPE_string, 'Telephone'),
            new ModuleTableField('adresse', ModuleTableField.FIELD_TYPE_string, 'Adresse'),
            new ModuleTableField('code_postal', ModuleTableField.FIELD_TYPE_string, 'Code Postal'),
            new ModuleTableField('ville', ModuleTableField.FIELD_TYPE_string, 'Ville'),
            new ModuleTableField('societe', ModuleTableField.FIELD_TYPE_string, 'Societe'),
            new ModuleTableField('siret', ModuleTableField.FIELD_TYPE_string, 'Siret'),
            default_label_field,
        ];
        this.datatable_informations = new ModuleTable<InformationsVO>(this, InformationsVO.API_TYPE_ID, datatable_fields, default_label_field, 'Informations');
        this.datatables.push(this.datatable_informations);
    }

    public initializeClient(): void {
        // Création de la table Client
        let field_informations_id: ModuleTableField<number> = new ModuleTableField('informations_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Informations', true);
        let field_user_id: ModuleTableField<number> = new ModuleTableField('user_id', ModuleTableField.FIELD_TYPE_foreign_key, 'User', true);

        let datatable_fields = [
            field_user_id,
            field_informations_id
        ];
        this.datatable_client = new ModuleTable<ClientVO>(this, ClientVO.API_TYPE_ID, datatable_fields, field_user_id, 'Client');
        field_user_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[UserVO.API_TYPE_ID]);
        field_informations_id.addManyToOneRelation(this.datatable_informations);
        this.datatables.push(this.datatable_client);
    }

    public async getInformationsClientUser(userId: number): Promise<InformationsVO> {
        return ModuleAPI.getInstance().handleAPI<NumberParamVO, InformationsVO>(ModuleClient.APINAME_getInformationsClientUser, userId);
    }

    public async getClientById(clientId: number): Promise<ClientVO> {
        return ModuleDAO.getInstance().getVoById<ClientVO>(ClientVO.API_TYPE_ID, clientId);
    }

    public async getClientsByUserId(userId: number): Promise<ClientVO[]> {
        return ModuleAPI.getInstance().handleAPI<NumberParamVO, ClientVO[]>(ModuleClient.APINAME_getClientsByUserId, userId);
    }

    public async getInformationsById(infoId: number): Promise<InformationsVO> {
        return ModuleDAO.getInstance().getVoById<InformationsVO>(InformationsVO.API_TYPE_ID, infoId);
    }
}