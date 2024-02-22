import { field_names } from '../../../tools/ObjectHandler';
import UserVO from '../../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../../API/APIControllerWrapper';
import NumberParamVO, { NumberParamVOStatic } from '../../API/vos/apis/NumberParamVO';
import GetAPIDefinition from '../../API/vos/GetAPIDefinition';
import { query } from '../../ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../DAO/ModuleDAO';
import Module from '../../Module';
import ModuleTable from '../../ModuleTable';
import ModuleTableField from '../../ModuleTableField';
import VOsTypesManager from '../../VO/manager/VOsTypesManager';
import ClientVO from './vos/ClientVO';
import InformationsVO from './vos/InformationsVO';

export default class ModuleClient extends Module {
    public static APINAME_getInformationsClientUser: string = "getInformationsClientUser";
    public static APINAME_getClientsByUserId: string = "getClientsByUserId";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleClient {
        if (!ModuleClient.instance) {
            ModuleClient.instance = new ModuleClient();
        }
        return ModuleClient.instance;
    }

    private static instance: ModuleClient = null;

    public getInformationsClientUser: (userId: number) => Promise<InformationsVO> = APIControllerWrapper.sah(ModuleClient.APINAME_getInformationsClientUser);
    public getClientsByUserId: (userId: number) => Promise<ClientVO[]> = APIControllerWrapper.sah(ModuleClient.APINAME_getClientsByUserId);

    private constructor() {
        super(ClientVO.API_TYPE_ID, 'Client', 'Commerce/Client');
    }
    public registerApis() {
        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberParamVO, InformationsVO>(
            null,
            ModuleClient.APINAME_getInformationsClientUser,
            [InformationsVO.API_TYPE_ID],
            NumberParamVOStatic
        ));

        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberParamVO, ClientVO[]>(
            null,
            ModuleClient.APINAME_getClientsByUserId,
            [ClientVO.API_TYPE_ID],
            NumberParamVOStatic
        ));
    }

    public initialize() {
        this.initializeInformations();
        this.initializeClient();
    }

    public initializeInformations(): void {
        // Création de la table Informations
        let default_label_field: ModuleTableField<string> = new ModuleTableField(field_names<InformationsVO>().email, ModuleTableField.FIELD_TYPE_email, 'Email');
        let datatable_fields = [
            new ModuleTableField(field_names<InformationsVO>().nom, ModuleTableField.FIELD_TYPE_string, 'Nom'),
            new ModuleTableField(field_names<InformationsVO>().prenom, ModuleTableField.FIELD_TYPE_string, 'Prenom'),
            new ModuleTableField(field_names<InformationsVO>().telephone, ModuleTableField.FIELD_TYPE_string, 'Telephone'),
            new ModuleTableField(field_names<InformationsVO>().adresse, ModuleTableField.FIELD_TYPE_string, 'Adresse'),
            new ModuleTableField(field_names<InformationsVO>().code_postal, ModuleTableField.FIELD_TYPE_string, 'Code Postal'),
            new ModuleTableField(field_names<InformationsVO>().ville, ModuleTableField.FIELD_TYPE_string, 'Ville'),
            new ModuleTableField(field_names<InformationsVO>().societe, ModuleTableField.FIELD_TYPE_string, 'Societe'),
            new ModuleTableField(field_names<InformationsVO>().siret, ModuleTableField.FIELD_TYPE_string, 'Siret'),
            default_label_field,
        ];
        this.datatables.push(new ModuleTable<InformationsVO>(this, InformationsVO.API_TYPE_ID, () => new InformationsVO(), datatable_fields, default_label_field, 'Informations'));
    }

    public initializeClient(): void {
        // Création de la table Client
        let field_informations_id: ModuleTableField<number> = new ModuleTableField(field_names<ClientVO>().informations_id, ModuleTableField.FIELD_TYPE_foreign_key, 'Informations', true);
        let field_user_id: ModuleTableField<number> = new ModuleTableField(field_names<ClientVO>().user_id, ModuleTableField.FIELD_TYPE_foreign_key, 'User', true);

        let datatable_fields = [
            field_user_id,
            field_informations_id
        ];
        let dt = new ModuleTable<ClientVO>(this, ClientVO.API_TYPE_ID, () => new ClientVO(), datatable_fields, field_user_id, 'Client');
        field_user_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[UserVO.API_TYPE_ID]);
        field_informations_id.addManyToOneRelation(VOsTypesManager.moduleTables_by_voType[InformationsVO.API_TYPE_ID]);
        this.datatables.push(dt);
    }

    public async getClientById(clientId: number): Promise<ClientVO> {
        return query(ClientVO.API_TYPE_ID).filter_by_id(clientId).select_vo<ClientVO>();
    }

    public async getInformationsById(infoId: number): Promise<InformationsVO> {
        return query(InformationsVO.API_TYPE_ID).filter_by_id(infoId).select_vo<InformationsVO>();
    }
}