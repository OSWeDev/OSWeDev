import { cloneDeep } from 'lodash';
import { FunctionDefinition, FunctionParameters } from 'openai/resources';
import { Assistant, AssistantCreateParams, AssistantTool, AssistantsPage } from 'openai/resources/beta/assistants';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import SortByVO from '../../../../shared/modules/ContextFilter/vos/SortByVO';
import NumRange from '../../../../shared/modules/DataRender/vos/NumRange';
import NumSegment from '../../../../shared/modules/DataRender/vos/NumSegment';
import GPTAssistantAPIAssistantFunctionVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO';
import GPTAssistantAPIAssistantVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIFunctionParamVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import GPTAssistantAPIToolResourcesVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIToolResourcesVO';
import ConsoleHandler from '../../../../shared/tools/ConsoleHandler';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import PromisePipeline from '../../../../shared/tools/PromisePipeline/PromisePipeline';
import { all_promises } from '../../../../shared/tools/PromiseTools';
import RangeHandler from '../../../../shared/tools/RangeHandler';
import ConfigurationService from '../../../env/ConfigurationService';
import ModuleDAOServer from '../../DAO/ModuleDAOServer';
import GPTAssistantAPIServerSyncFilesController from './GPTAssistantAPIServerSyncFilesController';
import ModuleGPTServer from '../ModuleGPTServer';
import GPTAssistantAPIServerSyncVectorStoresController from './GPTAssistantAPIServerSyncVectorStoresController';

export default class GPTAssistantAPIServerSyncAssistantsController {

    public static async push_assistant_to_openai(vo: GPTAssistantAPIAssistantVO): Promise<Assistant> {
        try {

            if (!vo) {
                throw new Error('No assistant_vo provided');
            }

            let gpt_obj: Assistant = vo.gpt_assistant_id ? await ModuleGPTServer.openai.beta.assistants.retrieve(vo.gpt_assistant_id) : null;

            // Si le vo est archivé, on doit supprimer en théorie dans OpenAI. On log pout le moment une erreur, on ne devrait pas arriver ici dans tous les cas
            if (vo.archived) {
                if (!!gpt_obj) {
                    ConsoleHandler.error('Error while pushing assistant to OpenAI : assistant is archived in Osélia but not in OpenAI');
                }
                return null;
            }

            const tools: AssistantTool[] = await GPTAssistantAPIServerSyncAssistantsController.tools_definition_to_openai_api(vo);
            const tool_resources: AssistantCreateParams.ToolResources = await GPTAssistantAPIServerSyncAssistantsController.tool_resources_to_openai_api(vo.tool_resources);

            if (!gpt_obj) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_assistant_to_openai: Creating assistant in OpenAI : ' + vo.nom);
                }

                // On récupère la définition des outils
                gpt_obj = await ModuleGPTServer.openai.beta.assistants.create({

                    model: vo.model,
                    name: vo.nom,
                    description: vo.description,
                    instructions: vo.instructions,
                    metadata: cloneDeep(vo.metadata),
                    response_format: cloneDeep(vo.response_format),
                    temperature: vo.temperature,
                    tool_resources: tool_resources,
                    tools: tools,
                    top_p: vo.top_p,
                });

                if (!gpt_obj) {
                    throw new Error('Error while creating assistant in OpenAI');
                }
            } else {

                // On récupère la définition des outils
                if (GPTAssistantAPIServerSyncAssistantsController.assistant_has_diff(vo, tools, tool_resources, gpt_obj)) {

                    if (ConfigurationService.node_configuration.debug_openai_sync) {
                        ConsoleHandler.log('push_assistant_to_openai: Updating assistant in OpenAI : ' + vo.nom);
                    }

                    // On doit mettre à jour
                    gpt_obj = await ModuleGPTServer.openai.beta.assistants.update(
                        gpt_obj.id,
                        {
                            model: vo.model,
                            name: vo.nom,
                            description: vo.description,
                            instructions: vo.instructions,
                            metadata: cloneDeep(vo.metadata),
                            response_format: cloneDeep(vo.response_format),
                            temperature: vo.temperature,
                            tool_resources: tool_resources,
                            tools: tools,
                            top_p: vo.top_p,
                        }
                    );

                    if (!gpt_obj) {
                        throw new Error('Error while creating assistant in OpenAI');
                    }
                }
            }

            // On met à jour le vo avec les infos de l'objet OpenAI si c'est nécessaire
            if (GPTAssistantAPIServerSyncAssistantsController.assistant_has_diff(vo, tools, tool_resources, gpt_obj) || (vo.archived)) {

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('push_assistant_to_openai: Updating assistant in Osélia : ' + vo.nom);
                }

                vo.gpt_assistant_id = gpt_obj.id;
                vo.created_at = gpt_obj.created_at;
                vo.description = gpt_obj.description;
                vo.instructions = gpt_obj.instructions;
                vo.metadata = cloneDeep(gpt_obj.metadata);
                vo.model = gpt_obj.model;
                vo.nom = gpt_obj.name;
                vo.response_format = cloneDeep(gpt_obj.response_format);
                vo.temperature = gpt_obj.temperature;
                vo.tool_resources = await GPTAssistantAPIServerSyncAssistantsController.tool_resources_from_openai_api(gpt_obj.tool_resources);
                vo.tools_code_interpreter = !!gpt_obj.tool_resources?.code_interpreter;
                vo.tools_file_search = !!gpt_obj.tool_resources?.file_search;
                vo.tools_functions = !!gpt_obj.tools?.length;
                vo.top_p = gpt_obj.top_p;
                vo.archived = false;

                await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(vo);

                // Si on a une modification de l'assistant, on doit aussi synchroniser les fonctions, dans le doute
                await GPTAssistantAPIServerSyncAssistantsController.sync_assistant_functions(vo, gpt_obj);
            }

            return gpt_obj;
        } catch (error) {
            ConsoleHandler.error('Error while pushing assistant to OpenAI : ' + error);
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

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_assistants: Syncing assistants');
        }

        const assistants: Assistant[] = await GPTAssistantAPIServerSyncAssistantsController.get_all_assistants();
        const assistants_vos: GPTAssistantAPIAssistantVO[] = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID).exec_as_server().select_vos<GPTAssistantAPIAssistantVO>();
        const assistants_vos_by_gpt_id: { [gpt_assistant_id: string]: GPTAssistantAPIAssistantVO } = {};

        for (const i in assistants_vos) {
            const assistant_vo = assistants_vos[i];
            assistants_vos_by_gpt_id[assistant_vo.gpt_assistant_id] = assistant_vo;
        }

        const promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.max_pool / 2);
        for (const i in assistants) {
            const assistant = assistants[i];

            await promise_pipeline.push(async () => {
                let found_vo: GPTAssistantAPIAssistantVO = assistants_vos_by_gpt_id[assistant.id];
                let needs_update = false;

                if (!found_vo) {
                    found_vo = new GPTAssistantAPIAssistantVO();
                    needs_update = true;
                }

                const tools: AssistantTool[] = await GPTAssistantAPIServerSyncAssistantsController.tools_definition_to_openai_api(found_vo);
                const tool_resources: AssistantCreateParams.ToolResources = await GPTAssistantAPIServerSyncAssistantsController.tool_resources_to_openai_api(found_vo.tool_resources);

                needs_update = needs_update ||
                    GPTAssistantAPIServerSyncAssistantsController.assistant_has_diff(found_vo, tools, tool_resources, assistant) ||
                    (!found_vo.archived);

                if (needs_update) {

                    if (ConfigurationService.node_configuration.debug_openai_sync) {
                        ConsoleHandler.log('sync_assistants: Updating assistant in Osélia : ' + assistant.name);
                    }

                    found_vo.gpt_assistant_id = assistant.id;
                    found_vo.created_at = assistant.created_at;
                    found_vo.description = assistant.description;
                    found_vo.instructions = assistant.instructions;
                    found_vo.metadata = cloneDeep(assistant.metadata);
                    found_vo.model = assistant.model;
                    found_vo.nom = assistant.name;
                    found_vo.response_format = cloneDeep(assistant.response_format);
                    found_vo.temperature = assistant.temperature;
                    found_vo.tool_resources = await GPTAssistantAPIServerSyncAssistantsController.tool_resources_from_openai_api(assistant.tool_resources);
                    found_vo.tools_code_interpreter = !!assistant.tool_resources?.code_interpreter;
                    found_vo.tools_file_search = !!assistant.tool_resources?.file_search;
                    found_vo.tools_functions = !!assistant.tools?.length;
                    found_vo.top_p = assistant.top_p;
                    found_vo.archived = false;

                    await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
                }

                /**
                 * On doit synchroniser les fonctions/params de l'assistant
                 */
                await GPTAssistantAPIServerSyncAssistantsController.sync_assistant_functions(found_vo, assistant);
            });
        }
        await promise_pipeline.end();

        // Les assistants qu'on trouve dans Osélia mais pas dans OpenAI, on les archive
        const to_update = [];
        for (const gpt_assistant_id in assistants_vos_by_gpt_id) {

            if (assistants_vos_by_gpt_id[gpt_assistant_id]) {
                continue;
            }

            const found_vo = assistants_vos_by_gpt_id[gpt_assistant_id];

            if (found_vo.archived) {
                continue;
            }

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_assistants: Archiving assistant in Osélia : ' + found_vo.nom);
            }

            found_vo.archived = true;
            to_update.push(found_vo);
        }
        await ModuleDAOServer.getInstance().insertOrUpdateVOs_as_server(to_update);
    }

    public static async tool_resources_from_openai_api(data: AssistantCreateParams.ToolResources): Promise<GPTAssistantAPIToolResourcesVO> {

        if (!data) {
            return null;
        }

        const res: GPTAssistantAPIToolResourcesVO = new GPTAssistantAPIToolResourcesVO();

        const promise_pipeline = new PromisePipeline(ConfigurationService.node_configuration.max_pool / 2);
        if (data.code_interpreter) {
            res.code_interpreter_gpt_file_ids = cloneDeep(data.code_interpreter.file_ids);

            const code_interpreter_file_ids_ranges: NumRange[] = [];
            for (const i in res.code_interpreter_gpt_file_ids) {
                const gpt_file_id = res.code_interpreter_gpt_file_ids[i];

                await promise_pipeline.push(async () => {
                    const assistant_file = await GPTAssistantAPIServerSyncFilesController.get_file_or_sync(gpt_file_id);

                    if (!assistant_file) {
                        throw new Error('GPTAssistantAPIToolResourcesVO: file not found:' + gpt_file_id);
                    }

                    code_interpreter_file_ids_ranges.push(RangeHandler.create_single_elt_NumRange(assistant_file.id, NumSegment.TYPE_INT));
                });
            }
            res.code_interpreter_file_ids_ranges = code_interpreter_file_ids_ranges;
        }

        if (data.file_search) {
            res.file_search_gpt_vector_store_ids = cloneDeep(data.file_search.vector_store_ids);

            const file_search_vector_store_ids_ranges: NumRange[] = [];
            for (const i in res.file_search_gpt_vector_store_ids) {
                const gpt_vector_store_id = res.file_search_gpt_vector_store_ids[i];

                await promise_pipeline.push(async () => {
                    const vector_store_file = await GPTAssistantAPIServerSyncVectorStoresController.get_vector_store_or_sync(gpt_vector_store_id);

                    if (!vector_store_file) {
                        throw new Error('GPTAssistantAPIToolResourcesVO: vector store not found:' + gpt_vector_store_id);
                    }

                    file_search_vector_store_ids_ranges.push(RangeHandler.create_single_elt_NumRange(vector_store_file.id, NumSegment.TYPE_INT));
                });
            }
            res.file_search_vector_store_ids_ranges = file_search_vector_store_ids_ranges;
        }

        await promise_pipeline.end();

        return res;
    }

    public static tool_resources_to_openai_api(vo: GPTAssistantAPIToolResourcesVO): AssistantCreateParams.ToolResources {

        if (!vo) {
            return null;
        }

        const res: AssistantCreateParams.ToolResources = {};

        if (vo.code_interpreter_gpt_file_ids) {
            res.code_interpreter = {
                file_ids: cloneDeep(vo.code_interpreter_gpt_file_ids)
            };
        }

        if (vo.file_search_gpt_vector_store_ids) {
            res.file_search = {
                vector_store_ids: cloneDeep(vo.file_search_gpt_vector_store_ids)
            };
        }

        return res;
    }

    private static async sync_assistant_functions(
        assistant_vo: GPTAssistantAPIAssistantVO,
        assistant: Assistant
    ) {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_assistant_functions: Syncing assistant functions : ' + assistant_vo.nom);
        }

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
                    await GPTAssistantAPIServerSyncAssistantsController.sync_assistant_function(
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

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_assistant_functions: Archiving assistant function in Osélia : ' + found_vo.gpt_function_name);
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

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_assistant_function: Syncing assistant function : ' + tool.name);
        }

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

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_assistant_function: Updating assistant function in Osélia : ' + tool.name);
            }

            found_vo.gpt_function_description = tool.description;
            found_vo.gpt_function_name = tool.name;
            // found_vo.module_function
            // found_vo.module_name
            // found_vo.prepend_thread_vo
            found_vo.archived = false;

            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(found_vo);
        }

        // On synchronise les paramètres de la fonction
        await GPTAssistantAPIServerSyncAssistantsController.sync_assistant_function_params(found_vo, tool.parameters);
    }

    private static async sync_assistant_function_params(
        assistant_function_vo: GPTAssistantAPIFunctionVO,
        params: FunctionParameters
    ) {

        if (ConfigurationService.node_configuration.debug_openai_sync) {
            ConsoleHandler.log('sync_assistant_function_params: Syncing assistant function params : ' + assistant_function_vo.gpt_function_name);
        }

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

                if (ConfigurationService.node_configuration.debug_openai_sync) {
                    ConsoleHandler.log('sync_assistant_function_params: Updating assistant function param in Osélia : ' + from_openai.gpt_funcparam_name);
                }

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

            if (ConfigurationService.node_configuration.debug_openai_sync) {
                ConsoleHandler.log('sync_assistant_function_params: Archiving assistant function param in Osélia : ' + found_vo.gpt_funcparam_name);
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

    private static async tools_definition_to_openai_api(assistant: GPTAssistantAPIAssistantVO): Promise<AssistantTool[]> {
        const res = [];

        if (assistant.tools_code_interpreter) {
            res.push({
                type: "code_interpreter"
            });
        }

        if (assistant.tools_file_search) {
            res.push({
                type: "file_search"
            });
        }

        if (assistant.tools_functions) {

            /**
             * On charge toutes les fonctions, dans l'ordre et on en tire la def de chacune
             */
            const functions = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
                .filter_by_id(assistant.id, GPTAssistantAPIAssistantVO.API_TYPE_ID)
                .using(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID)
                .set_sort(new SortByVO(GPTAssistantAPIAssistantFunctionVO.API_TYPE_ID, field_names<GPTAssistantAPIAssistantFunctionVO>().weight, true))
                .exec_as_server()
                .select_vos<GPTAssistantAPIFunctionVO>();

            const promises = [];
            for (const i in functions) {
                const func = functions[i];

                promises.push((async () => {
                    const params = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
                        .filter_by_id(func.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
                        .set_sort(new SortByVO(GPTAssistantAPIFunctionParamVO.API_TYPE_ID, field_names<GPTAssistantAPIFunctionParamVO>().weight, true))
                        .exec_as_server()
                        .select_vos<GPTAssistantAPIFunctionParamVO>();
                    res.push({
                        type: "function",
                        function: func.to_GPT_FunctionDefinition(params)
                    });
                })());
            }

            await all_promises(promises);
        }

        return res;
    }

    private static assistant_has_diff(
        assistant_vo: GPTAssistantAPIAssistantVO,
        assistant_vo_to_openai_tools: AssistantTool[],
        assistant_vo_to_openai_tool_resources: AssistantCreateParams.ToolResources,
        assistant_gpt: Assistant): boolean {

        if ((!assistant_vo) && (!assistant_gpt)) {
            return false;
        }

        if ((!assistant_vo) || (!assistant_gpt)) {
            return true;
        }

        return (assistant_vo.gpt_assistant_id != assistant_gpt.id) ||
            (assistant_vo.created_at != assistant_gpt.created_at) ||
            (assistant_vo.description != assistant_gpt.description) ||
            (assistant_vo.instructions != assistant_gpt.instructions) ||
            (JSON.stringify(assistant_vo.metadata) != JSON.stringify(assistant_gpt.metadata)) ||
            (assistant_vo.model != assistant_gpt.model) ||
            (assistant_vo.nom != assistant_gpt.name) ||
            (JSON.stringify(assistant_vo.response_format) != JSON.stringify(assistant_gpt.response_format)) ||
            (assistant_vo.temperature != assistant_gpt.temperature) ||
            (JSON.stringify(assistant_vo_to_openai_tool_resources) != JSON.stringify(assistant_gpt.tool_resources)) ||
            (JSON.stringify(assistant_vo_to_openai_tools) != JSON.stringify(assistant_gpt.tools)) ||
            (assistant_vo.top_p != assistant_gpt.top_p);
    }
}