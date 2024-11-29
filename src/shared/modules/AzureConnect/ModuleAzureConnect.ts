import Module from '../Module';

export default class ModuleAzureConnect extends Module {

    public static MODULE_NAME: string = 'AzureConnect';

    // public static APINAME_azure_connect_callback: string = "azure_connect_callback";
    // public static APINAME_azure_connect: string = "azure_connect";
    // public static APINAME_azure_refresh_token: string = "azure_refresh_token";

    public static AZURE_CONNECT_CLIENT_ID_PARAM_NAME: string = "ModuleAzureConnect.AZURE_CONNECT_CLIENT_ID";
    public static AZURE_CONNECT_CLIENT_SECRET_PARAM_NAME: string = "ModuleAzureConnect.AZURE_CONNECT_CLIENT_SECRET";

    private static instance: ModuleAzureConnect = null;

    // public azure_connect_callback: (code: string) => void = APIControllerWrapper.sah(ModuleAzureConnect.APINAME_azure_connect_callback);
    // public azure_connect: (azure_connected_user: AzureConnectedUserVO) => void = APIControllerWrapper.sah(ModuleAzureConnect.APINAME_azure_connect);
    // public azure_refresh_token: (azure_connected_user: AzureConnectedUserVO) => void = APIControllerWrapper.sah(ModuleAzureConnect.APINAME_azure_refresh_token);

    private constructor() {
        super("azureConnect", ModuleAzureConnect.MODULE_NAME);
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleAzureConnect {
        if (!ModuleAzureConnect.instance) {
            ModuleAzureConnect.instance = new ModuleAzureConnect();
        }
        return ModuleAzureConnect.instance;
    }

    public initialize() {
        // this.initializeAzureConnectedUserVO();
    }

    public registerApis() {
        // APIControllerWrapper.registerApi(new GetAPIDefinition<AzureConnectCallbackParamVO, boolean>(
        //     null,
        //     ModuleAzureConnect.APINAME_azure_connect_callback,
        //     null,
        //     AzureConnectCallbackParamVOStatic
        // ));
        // APIControllerWrapper.registerApi(new PostAPIDefinition<AzureConnectedUserVO, void>(
        //     null,
        //     ModuleAzureConnect.APINAME_azure_connect_callback,
        //     [AzureConnectedUserVO.API_TYPE_ID]
        // ));
        // APIControllerWrapper.registerApi(new PostAPIDefinition<AzureConnectedUserVO, void>(
        //     null,
        //     ModuleAzureConnect.APINAME_azure_refresh_token,
        //     [AzureConnectedUserVO.API_TYPE_ID]
        // ));
    }

    // private initializeAzureConnectedUserVO() {
    //     const user_id = ModuleTableFieldController.create_new(AzureConnectedUserVO.API_TYPE_ID, field_names<AzureConnectedUserVO>().user_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, "Utilisateur", true);

    //     const fields = [
    //         user_id,

    //         ModuleTableFieldController.create_new(AzureConnectedUserVO.API_TYPE_ID, field_names<AzureConnectedUserVO>().access_token, ModuleTableFieldVO.FIELD_TYPE_string, "access_token"),
    //         ModuleTableFieldController.create_new(AzureConnectedUserVO.API_TYPE_ID, field_names<AzureConnectedUserVO>().refresh_token, ModuleTableFieldVO.FIELD_TYPE_string, "refresh_token"),

    //         ModuleTableFieldController.create_new(AzureConnectedUserVO.API_TYPE_ID, field_names<AzureConnectedUserVO>().registered_callback_name, ModuleTableFieldVO.FIELD_TYPE_string, "registered_callback_name"),
    //         ModuleTableFieldController.create_new(AzureConnectedUserVO.API_TYPE_ID, field_names<AzureConnectedUserVO>().connect_callback_redirect_url, ModuleTableFieldVO.FIELD_TYPE_string, "connect_callback_redirect_url"),
    //     ];

    //     const datatable = ModuleTableController.create_new(this.name, AzureConnectedUserVO, null, "Lien compte Azure");

    //     user_id.set_many_to_one_target_moduletable_name(UserVO.API_TYPE_ID);
    // }

}