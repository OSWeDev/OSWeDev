import ModuleAPI from '../API/ModuleAPI';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import SendRequestParamVO, { SendRequestParamVOStatic } from './vos/SendRequestParamVO';

export default class ModuleRequest extends Module {

    public static MODULE_NAME: string = 'Request';

    public static METHOD_GET: string = "GET";
    public static METHOD_POST: string = "POST";

    public static APINAME_sendRequestFromApp = "send_request_from_app";

    public static getInstance(): ModuleRequest {
        if (!ModuleRequest.instance) {
            ModuleRequest.instance = new ModuleRequest();
        }
        return ModuleRequest.instance;
    }

    private static instance: ModuleRequest = null;

    public sendRequestFromApp: (
        method: string,
        host: string,
        path: string,
        posts: {},
        headers: {},
        sendHttps: boolean) => Promise<any> = ModuleAPI.sah(ModuleRequest.APINAME_sendRequestFromApp);

    private constructor() {

        super("request", ModuleRequest.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];
    }

    public registerApis() {

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<SendRequestParamVO, any>(
            null,
            ModuleRequest.APINAME_sendRequestFromApp,
            [],
            SendRequestParamVOStatic
        ));
    }
}