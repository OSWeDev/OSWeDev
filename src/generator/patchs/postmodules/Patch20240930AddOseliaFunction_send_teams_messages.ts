import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import ModuleOseliaServer from "../../../server/modules/Oselia/ModuleOseliaServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import GPTAssistantAPIFunctionParamVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO";
import GPTAssistantAPIFunctionVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO";
import { field_names, reflect } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20240930AddOseliaFunction_send_teams_messages implements IGeneratorWorker {

    private static instance: Patch20240930AddOseliaFunction_send_teams_messages = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240930AddOseliaFunction_send_teams_messages';
    }

    public static getInstance(): Patch20240930AddOseliaFunction_send_teams_messages {
        if (!Patch20240930AddOseliaFunction_send_teams_messages.instance) {
            Patch20240930AddOseliaFunction_send_teams_messages.instance = new Patch20240930AddOseliaFunction_send_teams_messages();
        }
        return Patch20240930AddOseliaFunction_send_teams_messages.instance;
    }

    public async work(db: IDatabase<unknown>) {
        // send_message_to_teams_info_oselia
        const gpt_function_name: string = ModuleOseliaServer.getInstance().name + '__' + reflect<ModuleOseliaServer>().send_message_to_teams_info_oselia;
        let func: GPTAssistantAPIFunctionVO = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, gpt_function_name)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();

        if (!func) {

            func = new GPTAssistantAPIFunctionVO();
            func.gpt_function_description = 'Envoyer un message d\'information sur Teams';
            func.gpt_function_name = gpt_function_name;
            func.module_name = ModuleOseliaServer.getInstance().name;
            func.module_function = reflect<ModuleOseliaServer>().send_message_to_teams_info_oselia as string;
            func.prepend_thread_vo = true;
            func.use_promise_pipeline = false;
            func.json_stringify_output = false;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(func);

            await this.create_params_description_if_not_exists(func);
        }

        // send_message_to_teams_warn_oselia
        const gpt_function_name_warn: string = ModuleOseliaServer.getInstance().name + '__' + reflect<ModuleOseliaServer>().send_message_to_teams_warn_oselia;
        let func_warn: GPTAssistantAPIFunctionVO = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, gpt_function_name_warn)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();

        if (!func_warn) {

            func_warn = new GPTAssistantAPIFunctionVO();
            func_warn.gpt_function_description = 'Envoyer un message d\'avertissement sur Teams';
            func_warn.gpt_function_name = gpt_function_name_warn;
            func_warn.module_name = ModuleOseliaServer.getInstance().name;
            func_warn.module_function = reflect<ModuleOseliaServer>().send_message_to_teams_warn_oselia as string;
            func_warn.prepend_thread_vo = true;
            func_warn.use_promise_pipeline = false;
            func_warn.json_stringify_output = false;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(func_warn);

            await this.create_params_description_if_not_exists(func_warn);
        }

        // send_message_to_teams_error_oselia
        const gpt_function_name_error: string = ModuleOseliaServer.getInstance().name + '__' + reflect<ModuleOseliaServer>().send_message_to_teams_error_oselia;
        let func_error: GPTAssistantAPIFunctionVO = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, gpt_function_name_error)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();

        if (!func_error) {

            func_error = new GPTAssistantAPIFunctionVO();
            func_error.gpt_function_description = 'Envoyer un message d\'erreur sur Teams';
            func_error.gpt_function_name = gpt_function_name_error;
            func_error.module_name = ModuleOseliaServer.getInstance().name;
            func_error.module_function = reflect<ModuleOseliaServer>().send_message_to_teams_error_oselia as string;
            func_error.prepend_thread_vo = true;
            func_error.use_promise_pipeline = false;
            func_error.json_stringify_output = false;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(func_error);

            await this.create_params_description_if_not_exists(func_error);
        }

        // send_message_to_teams_success_oselia
        const gpt_function_name_success: string = ModuleOseliaServer.getInstance().name + '__' + reflect<ModuleOseliaServer>().send_message_to_teams_success_oselia;
        let func_success: GPTAssistantAPIFunctionVO = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, gpt_function_name_success)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();

        if (!func_success) {

            func_success = new GPTAssistantAPIFunctionVO();
            func_success.gpt_function_description = 'Envoyer un message de succès sur Teams';
            func_success.gpt_function_name = gpt_function_name_success;
            func_success.module_name = ModuleOseliaServer.getInstance().name;
            func_success.module_function = reflect<ModuleOseliaServer>().send_message_to_teams_success_oselia as string;
            func_success.prepend_thread_vo = true;
            func_success.use_promise_pipeline = false;
            func_success.json_stringify_output = false;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(func_success);

            await this.create_params_description_if_not_exists(func_success);
        }
    }

    public async create_params_description_if_not_exists(func: GPTAssistantAPIFunctionVO) {
        // title: string,
        const title_param: GPTAssistantAPIFunctionParamVO = new GPTAssistantAPIFunctionParamVO();
        title_param.gpt_funcparam_name = 'title';
        title_param.gpt_funcparam_description = 'Le titre du message à envoyer';
        title_param.function_id = func.id;
        title_param.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
        title_param.required = true;
        title_param.weight = 0;
        title_param.default_json_value = null;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(title_param);

        // content: string,
        const content_param: GPTAssistantAPIFunctionParamVO = new GPTAssistantAPIFunctionParamVO();
        content_param.gpt_funcparam_name = 'content';
        content_param.gpt_funcparam_description = 'Le contenu du message à envoyer - format compatible Teams (markdown)';
        content_param.function_id = func.id;
        content_param.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
        content_param.required = true;
        content_param.weight = 1;
        content_param.default_json_value = null;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(content_param);
    }
}