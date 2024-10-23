import { IDatabase } from "pg-promise";
import ModuleAzureConnectServer from "../../../server/modules/AzureConnect/ModuleAzureConnectServer";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import GPTAssistantAPIFunctionParamVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO";
import GPTAssistantAPIFunctionVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO";
import { field_names, reflect } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20241023AddOseliaFunction_azure_get_last_unread_email implements IGeneratorWorker {

    private static instance: Patch20241023AddOseliaFunction_azure_get_last_unread_email = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20241023AddOseliaFunction_azure_get_last_unread_email';
    }

    public static getInstance(): Patch20241023AddOseliaFunction_azure_get_last_unread_email {
        if (!Patch20241023AddOseliaFunction_azure_get_last_unread_email.instance) {
            Patch20241023AddOseliaFunction_azure_get_last_unread_email.instance = new Patch20241023AddOseliaFunction_azure_get_last_unread_email();
        }
        return Patch20241023AddOseliaFunction_azure_get_last_unread_email.instance;
    }

    public async work(db: IDatabase<unknown>) {
        // azure_get_last_unread_email
        const gpt_function_name: string = ModuleAzureConnectServer.getInstance().name + '__' + reflect<ModuleAzureConnectServer>().azure_get_last_unread_email;
        let func: GPTAssistantAPIFunctionVO = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, gpt_function_name)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();

        if (!func) {

            func = new GPTAssistantAPIFunctionVO();
            func.gpt_function_description = 'Consulter le dernier mail non lu d\'une boîte mail Azure Office 365';
            func.gpt_function_name = gpt_function_name;
            func.module_name = ModuleAzureConnectServer.getInstance().name;
            func.module_function = reflect<ModuleAzureConnectServer>().azure_get_last_unread_email as string;
            func.prepend_thread_vo = true;
            func.use_promise_pipeline = false;
            func.json_stringify_output = true;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(func);

            await this.create_params_description_if_not_exists(func);
        }
    }

    public async create_params_description_if_not_exists(func: GPTAssistantAPIFunctionVO) {

        // tenantId: string,
        const tenantId_param: GPTAssistantAPIFunctionParamVO = new GPTAssistantAPIFunctionParamVO();
        tenantId_param.gpt_funcparam_name = 'tenantId';
        tenantId_param.gpt_funcparam_description = 'tenantId de l\'application Azure';
        tenantId_param.function_id = func.id;
        tenantId_param.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
        tenantId_param.required = true;
        tenantId_param.weight = 0;
        tenantId_param.default_json_value = null;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(tenantId_param);

        // clientId: string,
        const clientId_param: GPTAssistantAPIFunctionParamVO = new GPTAssistantAPIFunctionParamVO();
        clientId_param.gpt_funcparam_name = 'clientId';
        clientId_param.gpt_funcparam_description = 'clientId de l\'application Azure';
        clientId_param.function_id = func.id;
        clientId_param.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
        clientId_param.required = true;
        clientId_param.weight = 1;
        clientId_param.default_json_value = null;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(clientId_param);

        // email: string,
        const email_param: GPTAssistantAPIFunctionParamVO = new GPTAssistantAPIFunctionParamVO();
        email_param.gpt_funcparam_name = 'email';
        email_param.gpt_funcparam_description = 'email dont on consulte le dernier mail non lu';
        email_param.function_id = func.id;
        email_param.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
        email_param.required = true;
        email_param.weight = 2;
        email_param.default_json_value = null;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(email_param);

        // mark_as_read: string,
        const mark_as_read_param: GPTAssistantAPIFunctionParamVO = new GPTAssistantAPIFunctionParamVO();
        mark_as_read_param.gpt_funcparam_name = 'mark_as_read';
        mark_as_read_param.gpt_funcparam_description = 'Si on récupère un mail, on le marque comme lu. Par défaut false';
        mark_as_read_param.function_id = func.id;
        mark_as_read_param.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
        mark_as_read_param.required = false;
        mark_as_read_param.weight = 3;
        mark_as_read_param.default_json_value = JSON.stringify(false);
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(mark_as_read_param);

    }
}