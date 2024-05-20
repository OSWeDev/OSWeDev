import { FunctionDefinition, FunctionParameters } from 'openai/resources';
import { Assistant, AssistantCreateParams, AssistantTool, AssistantsPage } from 'openai/resources/beta/assistants';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIAssistantFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import ModuleGPTServer from './ModuleGPTServer';
import { cloneDeep } from 'lodash';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../shared/tools/ObjectHandler';

export default class GPTAssistantAPIServerSyncAssistantsController {

    public static async push_assistant_to_openai(assistant_vo: GPTAssistantAPIAssistantVO): Promise<Assistant> {
        try {

            if (!assistant_vo) {
                throw new Error('No assistant_vo provided');
            }

            let gpt_obj: Assistant = assistant_vo.gpt_assistant_id ? await ModuleGPTServer.openai.beta.assistants.retrieve(assistant_vo.gpt_assistant_id) : null;

            if (!gpt_obj) {

                // On récupère la définition des outils
                const tools: AssistantTool[] = await assistant_vo.get_openai_tools_definition();
                const tool_resources: AssistantCreateParams.ToolResources =

                    gpt_obj = await ModuleGPTServer.openai.beta.assistants.create({

                        model: assistant_vo.model,
                        name: assistant_vo.nom,
                        description: assistant_vo.description,
                        instructions: assistant_vo.instructions,
                        metadata: cloneDeep(assistant_vo.metadata),
                        response_format: cloneDeep(assistant_vo.response_format),
                        temperature: assistant_vo.temperature,
                        tool_resources: cloneDeep(assistant_vo.tool_resources),
                        tools: tools,
                        top_p: assistant_vo.top_p,
                    });

                if (!gpt_obj) {
                    throw new Error('Error while creating file in OpenAI');
                }
            } else {
                if ((vo.gpt_file_id != gpt_obj.id) ||
                    (vo.created_at != gpt_obj.created_at) ||
                    (vo.bytes != gpt_obj.bytes) ||
                    (vo.filename != gpt_obj.filename) ||
                    (vo.purpose != GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[gpt_obj.purpose])) {

                    // On doit mettre à jour mais en l'occurence il n'y a pas de méthode update pour les fichiers
                    // donc on supprime et on recrée
                    await ModuleGPTServer.openai.beta.assistants.del(gpt_obj.id);

                    gpt_obj = await ModuleGPTServer.openai.beta.assistants.create({

                        file: createReadStream(vo.filename) as unknown as Uploadable,
                        purpose: GPTAssistantAPIFileVO.TO_OPENAI_PURPOSE_MAP[vo.purpose] as "assistants" | "batch" | "fine-tune"
                    });

                    if (!gpt_obj) {
                        throw new Error('Error while creating file in OpenAI');
                    }
                }
            }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            if ((vo.gpt_file_id != gpt_obj.id) ||
                (vo.created_at != gpt_obj.created_at) ||
                (vo.bytes != gpt_obj.bytes) ||
                (vo.filename != gpt_obj.filename) ||
                (vo.purpose != GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[gpt_obj.purpose])) {

                vo.gpt_file_id = gpt_obj.id;
                vo.created_at = gpt_obj.created_at;
                vo.bytes = gpt_obj.bytes;
                vo.filename = gpt_obj.filename;
                vo.purpose = GPTAssistantAPIFileVO.FROM_OPENAI_PURPOSE_MAP[gpt_obj.purpose];
                vo.archived = false;

                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(vo);
            }

            return gpt_obj;
        } catch (error) {
            ConsoleHandler.error('Error while pushing file to OpenAI : ' + error);
            throw error;
        }
    }

    public static async get_assistant_or_sync(gpt_assistant_id: string): Promise<GPTAssistantAPIAssistantVO> {
        let assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().gpt_assistant_id, gpt_assistant_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantVO>();
        if (!assistant) {
            ConsoleHandler.warn('Assistant not found : ' + gpt_assistant_id + ' - Syncing Assistants');
            await GPTAssistantAPIServerSyncAssistantsController.sync_assistants();
        }

        assistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().gpt_assistant_id, gpt_assistant_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIAssistantVO>();
        if (!assistant) {
            ConsoleHandler.error('Assistant not found : ' + gpt_assistant_id + ' - Already tried to sync Assistants - Aborting');
            throw new Error('Assistant not found : ' + gpt_assistant_id + ' - Already tried to sync Assistants - Aborting');
        }

        return assistant;
    }

    /**
     * On récupère tous les assistants de l'API GPT et on les synchronise avec Osélia
     */
    public static async sync_assistants() {
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
                (JSON.stringify(found_vo.response_format) != JSON.stringify(assistant.response_format)) ||
                (found_vo.temperature != assistant.temperature) ||
                (JSON.stringify(found_vo.tool_resources) != JSON.stringify(assistant.tool_resources)) ||
                (JSON.stringify(found_vo.tools) != JSON.stringify(assistant.tools)) ||
                (found_vo.top_p != assistant.top_p) ||
                (!found_vo.archived);

            if (needs_update) {
                found_vo.gpt_assistant_id = assistant.id;
                found_vo.created_at = assistant.created_at;
                found_vo.description = assistant.description;
                found_vo.instructions = assistant.instructions;
                found_vo.metadata = cloneDeep(assistant.metadata);
                found_vo.model = assistant.model;
                found_vo.nom = assistant.name;
                found_vo.response_format = cloneDeep(assistant.response_format);
                found_vo.temperature = assistant.temperature;
                found_vo.tool_resources = cloneDeep(assistant.tool_resources);
                found_vo.tools_code_interpreter =;
                found_vo.tools_file_search =;
                found_vo.tools_functions =;
                found_vo.tools = cloneDeep(assistant.tools);
                found_vo.top_p = assistant.top_p;
                found_vo.archived = false;

                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
            }

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

            if (found_vo.archived) {
                continue;
            }

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

            if (found_vo.archived) {
                continue;
            }

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
                found_vo.array_items_type = cloneDeep(from_openai.array_items_type);
                found_vo.function_id = assistant_function_vo.id;
                found_vo.gpt_funcparam_description = from_openai.gpt_funcparam_description;
                found_vo.gpt_funcparam_name = from_openai.gpt_funcparam_name;
                found_vo.number_enum = cloneDeep(from_openai.number_enum);
                found_vo.object_fields = cloneDeep(from_openai.object_fields);
                found_vo.required = from_openai.required;
                found_vo.string_enum = cloneDeep(from_openai.string_enum);
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

            if (found_vo.archived) {
                continue;
            }

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