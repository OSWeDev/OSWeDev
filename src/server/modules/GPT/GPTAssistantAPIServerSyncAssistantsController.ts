import { FunctionDefinition, FunctionParameters } from 'openai/resources';
import { Assistant, AssistantTool, AssistantsPage } from 'openai/resources/beta/assistants';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIAssistantFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleGPTServer from './ModuleGPTServer';

export default class GPTAssistantAPIServerSyncAssistantsController {

    /**
     * On récupère tous les assistants de l'API GPT et on les synchronise avec Osélia
     */
    private static async sync_assistants() {
        const assistants: Assistant[] = await GPTAssistantAPIServerSyncAssistantsController.get_all_assistants();
        const assistants_vos: GPTAssistantAPIAssistantVO[] = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID).exec_as_server().select_vos<GPTAssistantAPIAssistantVO>();
        const assistants_vos_by_gpt_id: { [gpt_assistant_id: string]: GPTAssistantAPIAssistantVO } = {};

        for (const i in assistants_vos) {
            const assistant_vo = assistants_vos[i];
            assistants_vos_by_gpt_id[assistant_vo.gpt_assistant_id] = assistant_vo;
        }

        for (const i in assistants) {
            const assistant = assistants[i];
            let found_vo: GPTAssistantAPIAssistantVO = assistants_vos_by_gpt_id[assistant.id];
            let needs_update = false;

            if (!found_vo) {
                found_vo = new GPTAssistantAPIAssistantVO();
                needs_update = true;
            }

            needs_update = needs_update ||
                (found_vo.gpt_assistant_id != assistant.id) ||
                (found_vo.created_at != assistant.created_at) ||
                (found_vo.description != assistant.description) ||
                (found_vo.instructions != assistant.instructions) ||
                (JSON.stringify(found_vo.metadata) != JSON.stringify(assistant.metadata)) ||
                (found_vo.model != assistant.model) ||
                (found_vo.nom != assistant.name) ||
                (found_vo.response_format != assistant.response_format) ||
                (found_vo.temperature != assistant.temperature) ||
                (JSON.stringify(found_vo.tool_resources) != JSON.stringify(assistant.tool_resources)) ||
                (JSON.stringify(found_vo.tools) != JSON.stringify(assistant.tools)) ||
                (found_vo.top_p != assistant.top_p) ||
                (!found_vo.archived);
            found_vo.gpt_assistant_id = assistant.id;
            found_vo.created_at = assistant.created_at;
            found_vo.description = assistant.description;
            found_vo.instructions = assistant.instructions;
            found_vo.metadata = assistant.metadata;
            found_vo.model = assistant.model;
            found_vo.nom = assistant.name;
            found_vo.response_format = assistant.response_format;
            found_vo.temperature = assistant.temperature;
            found_vo.tool_resources = assistant.tool_resources;
            found_vo.tools = assistant.tools;
            found_vo.top_p = assistant.top_p;
            found_vo.archived = false;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);

            /**
             * On doit synchroniser les fonctions/params de l'assistant
             */
            await this.sync_assistant_functions(found_vo, assistant);
        }

        // Les assistants qu'on trouve dans Osélia mais pas dans OpenAI, on les archive
        for (const gpt_assistant_id in assistants_vos_by_gpt_id) {

            if (assistants_vos_by_gpt_id[gpt_assistant_id]) {
                continue;
            }

            const found_vo = assistants_vos_by_gpt_id[gpt_assistant_id];
            found_vo.archived = true;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }
    }

    private static async sync_assistant_functions(
        assistant_vo: GPTAssistantAPIAssistantVO,
        assistant: Assistant
    ) {
        // On charge les fonctions issues de OpenAI et de Osélia
        const assistant_functions: GPTAssistantAPIFunctionVO[] = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_id(assistant_vo.id, GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .using(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<GPTAssistantAPIFunctionVO>();

        // On les trie par nom
        const assistant_functions_by_name: { [name: string]: GPTAssistantAPIFunctionVO } = {};
        for (const i in assistant_functions) {
            const assistant_function = assistant_functions[i];
            assistant_functions_by_name[assistant_function.gpt_function_name] = assistant_function;
        }

        const gpt_assistant_functions_by_name: { [name: string]: FunctionDefinition } = {};
        for (const i in assistant.tools) {
            const tool: AssistantTool = assistant.tools[i];

            switch (tool.type) {
                case 'function':
                    await this.sync_assistant_function(
                        assistant_vo,
                        assistant_functions_by_name,
                        assistant,
                        tool.function as FunctionDefinition
                    );
                    break;
                default:
                    break;
            }
        }

        // Les fonctions qu'on trouve dans Osélia mais pas dans OpenAI, on les archive
        for (const name in assistant_functions_by_name) {

            if (gpt_assistant_functions_by_name[name]) {
                continue;
            }

            const found_vo = assistant_functions_by_name[name];
            found_vo.archived = true;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }
    }

    private static async sync_assistant_function(
        assistant_vo: GPTAssistantAPIAssistantVO,
        assistant_functions_by_name: { [name: string]: GPTAssistantAPIFunctionVO },
        assistant: Assistant,
        tool: FunctionDefinition
    ) {
        let found_vo: GPTAssistantAPIFunctionVO = assistant_functions_by_name[tool.name];
        let needs_update = false;

        if (!found_vo) {
            found_vo = new GPTAssistantAPIFunctionVO();
            needs_update = true;
        }

        needs_update = needs_update ||
            (found_vo.gpt_function_description != tool.description) ||
            (found_vo.gpt_function_name != tool.name) ||
            (!found_vo.archived);

        if (needs_update) {
            found_vo.gpt_function_description = tool.description;
            found_vo.gpt_function_name = tool.name;
            // found_vo.module_function
            // found_vo.module_name
            // found_vo.prepend_thread_vo
            found_vo.archived = false;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }

        // On synchronise les paramètres de la fonction
        await this.sync_assistant_function_params(found_vo, tool.parameters);
    }

    private static async sync_assistant_function_params(
        assistant_function_vo: GPTAssistantAPIFunctionVO,
        params: FunctionParameters
    ) {
        // On charge les paramètres de la fonction
        const assistant_function_params: GPTAssistantAPIFunctionParamVO[] = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_id(assistant_function_vo.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<GPTAssistantAPIFunctionParamVO>();

        // On les trie par nom
        const assistant_function_params_by_name: { [name: string]: GPTAssistantAPIFunctionParamVO } = {};
        for (const i in assistant_function_params) {
            const assistant_function_param = assistant_function_params[i];
            assistant_function_params_by_name[assistant_function_param.gpt_funcparam_name] = assistant_function_param;
        }

        for (const param_name in params) {
            const param: unknown = params[param_name];
            let found_vo: GPTAssistantAPIFunctionParamVO = assistant_function_params_by_name[param_name];
            let needs_update = false;

            if (!found_vo) {
                found_vo = new GPTAssistantAPIFunctionParamVO();
                needs_update = true;
            }

            const from_openai = GPTAssistantAPIFunctionParamVO.from_GPT_FunctionParameters(param);
            needs_update = needs_update ||
                (JSON.stringify(from_openai.array_items_type) != JSON.stringify(found_vo.array_items_type)) ||
                (from_openai.function_id != assistant_function_vo.id) ||
                (from_openai.gpt_funcparam_description != found_vo.gpt_funcparam_description) ||
                (from_openai.gpt_funcparam_name != found_vo.gpt_funcparam_name) ||
                (JSON.stringify(from_openai.number_enum) != JSON.stringify(found_vo.number_enum)) ||
                (JSON.stringify(from_openai.object_fields) != JSON.stringify(found_vo.object_fields)) ||
                (from_openai.required != found_vo.required) ||
                (JSON.stringify(from_openai.string_enum) != JSON.stringify(found_vo.string_enum)) ||
                (from_openai.type != found_vo.type) ||
                (from_openai.weight != found_vo.weight);

            if (needs_update) {
                found_vo.array_items_type = from_openai.array_items_type;
                found_vo.function_id = assistant_function_vo.id;
                found_vo.gpt_funcparam_description = from_openai.gpt_funcparam_description;
                found_vo.gpt_funcparam_name = from_openai.gpt_funcparam_name;
                found_vo.number_enum = from_openai.number_enum;
                found_vo.object_fields = from_openai.object_fields;
                found_vo.required = from_openai.required;
                found_vo.string_enum = from_openai.string_enum;
                found_vo.type = from_openai.type;
                found_vo.weight = from_openai.weight;
                found_vo.archived = false;

                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
            }
        }

        // Les paramètres qu'on trouve dans Osélia mais pas dans OpenAI, on les archive
        for (const name in assistant_function_params_by_name) {

            if (params[name]) {
                continue;
            }

            const found_vo = assistant_function_params_by_name[name];
            found_vo.archived = true;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }
    }

    private static async get_all_assistants(): Promise<Assistant[]> {

        const res: Assistant[] = [];

        let assistants_page: AssistantsPage = await ModuleGPTServer.openai.beta.assistants.list();

        if (!assistants_page) {
            return res;
        }

        if (assistants_page.data && assistants_page.data.length) {
            res.concat(assistants_page.data);
        }

        while (assistants_page.hasNextPage()) {
            assistants_page = await assistants_page.getNextPage();
            res.concat(assistants_page.data);
        }

        return res;
    }
}