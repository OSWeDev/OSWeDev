import { field_names } from '../../../tools/ObjectHandler';
import UserVO from '../../AccessPolicy/vos/UserVO';
import APIControllerWrapper from '../../API/APIControllerWrapper';
import NumberParamVO, { NumberParamVOStatic } from '../../API/vos/apis/NumberParamVO';
import GetAPIDefinition from '../../API/vos/GetAPIDefinition';
import { query } from '../../ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../DAO/ModuleDAO';
import Module from '../../Module';
import ModuleTableVO from '../../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../../DAO/vos/ModuleTableFieldVO';
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
        const default_label_field: ModuleTableFieldVO<string> = ModuleTableFieldController.create_new(InformationsVO.API_TYPE_ID, field_names<InformationsVO>().email, ModuleTableFieldVO.FIELD_TYPE_email, 'Email');
        const datatable_fields = [
            ModuleTableFieldController.create_new(InformationsVO.API_TYPE_ID, field_names<InformationsVO>().nom, ModuleTableFieldVO.FIELD_TYPE_string, 'Nom'),
            ModuleTableFieldController.create_new(InformationsVO.API_TYPE_ID, field_names<InformationsVO>().prenom, ModuleTableFieldVO.FIELD_TYPE_string, 'Prenom'),
            ModuleTableFieldController.create_new(InformationsVO.API_TYPE_ID, field_names<InformationsVO>().telephone, ModuleTableFieldVO.FIELD_TYPE_string, 'Telephone'),
            ModuleTableFieldController.create_new(InformationsVO.API_TYPE_ID, field_names<InformationsVO>().adresse, ModuleTableFieldVO.FIELD_TYPE_string, 'Adresse'),
            ModuleTableFieldController.create_new(InformationsVO.API_TYPE_ID, field_names<InformationsVO>().code_postal, ModuleTableFieldVO.FIELD_TYPE_string, 'Code Postal'),
            ModuleTableFieldController.create_new(InformationsVO.API_TYPE_ID, field_names<InformationsVO>().ville, ModuleTableFieldVO.FIELD_TYPE_string, 'Ville'),
            ModuleTableFieldController.create_new(InformationsVO.API_TYPE_ID, field_names<InformationsVO>().societe, ModuleTableFieldVO.FIELD_TYPE_string, 'Societe'),
            ModuleTableFieldController.create_new(InformationsVO.API_TYPE_ID, field_names<InformationsVO>().siret, ModuleTableFieldVO.FIELD_TYPE_string, 'Siret'),
            default_label_field,
        ];
        this.datatables.push(new ModuleTableVO<InformationsVO>(this, InformationsVO.API_TYPE_ID, () => new InformationsVO(), datatable_fields, default_label_field, 'Informations'));
    }

    public initializeClient(): void {
        // Création de la table Client
        const field_informations_id: ModuleTableFieldVO<number> = ModuleTableFieldController.create_new(ClientVO.API_TYPE_ID, field_names<ClientVO>().informations_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Informations', true);
        const field_user_id: ModuleTableFieldVO<number> = ModuleTableFieldController.create_new(ClientVO.API_TYPE_ID, field_names<ClientVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'User', true);

        const datatable_fields = [
            field_user_id,
            field_informations_id
        ];
        const dt = new ModuleTableVO<ClientVO>(this, ClientVO.API_TYPE_ID, () => new ClientVO(), datatable_fields, field_user_id, 'Client');
        field_user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
        field_informations_id.set_many_to_one_target_moduletable_name(InformationsVO.API_TYPE_ID);
        this.datatables.push(dt);
    }

    public async getClientById(clientId: number): Promise<ClientVO> {
        return query(ClientVO.API_TYPE_ID).filter_by_id(clientId).select_vo<ClientVO>();
    }

    public async getInformationsById(infoId: number): Promise<InformationsVO> {
        return query(InformationsVO.API_TYPE_ID).filter_by_id(infoId).select_vo<InformationsVO>();
    }
}