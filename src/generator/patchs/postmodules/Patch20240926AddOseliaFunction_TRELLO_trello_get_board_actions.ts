/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240926AddOseliaFunction_TRELLO_trello_get_board_actions implements IGeneratorWorker {

    private static instance: Patch20240926AddOseliaFunction_TRELLO_trello_get_board_actions = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240926AddOseliaFunction_TRELLO_trello_get_board_actions';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240926AddOseliaFunction_TRELLO_trello_get_board_actions {
        if (!Patch20240926AddOseliaFunction_TRELLO_trello_get_board_actions.instance) {
            Patch20240926AddOseliaFunction_TRELLO_trello_get_board_actions.instance = new Patch20240926AddOseliaFunction_TRELLO_trello_get_board_actions();
        }
        return Patch20240926AddOseliaFunction_TRELLO_trello_get_board_actions.instance;
    }

    /**
     * NB : Configuration de l'API externe sur le projet
     * TRELLO = Authentification de type KEY_BEARER, remplir le champ clé API (avec le TOKEN_TRELLO obtenu sur le site de Trello) et c'est tout pour l'authentification
     * METHODE : GET
     * URL : https://api.trello.com/1/boards/<boardId>/actions?key=API_KEY_TRELLO&token=TOKEN_TRELLO
     *      (remplacer TOKEN_TRELLO et API_KEY_TRELLO par les valeurs obtenues sur le site de Trello)
     * Accept : application/json
     * Content-Type : application/json
     * Nom : trello_get_board_actions
     */
    public async work(db: IDatabase<any>) {

        let function_TRELLO_trello_get_board_actions = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, 'trello_get_board_actions')
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!function_TRELLO_trello_get_board_actions) {
            function_TRELLO_trello_get_board_actions = new GPTAssistantAPIFunctionVO();

            function_TRELLO_trello_get_board_actions.archived = false;
            function_TRELLO_trello_get_board_actions.module_function = null;
            function_TRELLO_trello_get_board_actions.module_name = null;
            function_TRELLO_trello_get_board_actions.prepend_thread_vo = false;
            function_TRELLO_trello_get_board_actions.gpt_function_name = 'trello_get_board_actions';
            function_TRELLO_trello_get_board_actions.json_stringify_output = true;
            function_TRELLO_trello_get_board_actions.gpt_function_description = "Get all of the actions of a Board";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(function_TRELLO_trello_get_board_actions);
        }

        let argument_boardId = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'boardId')
            .filter_by_id(function_TRELLO_trello_get_board_actions.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_boardId) {
            argument_boardId = new GPTAssistantAPIFunctionParamVO();
            argument_boardId.archived = false;
            argument_boardId.function_id = function_TRELLO_trello_get_board_actions.id;
            argument_boardId.gpt_funcparam_description = "The ID of the Board";
            argument_boardId.gpt_funcparam_name = "boardId";
            argument_boardId.required = true;
            argument_boardId.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_boardId.not_in_function_params = true;
            argument_boardId.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_boardId);
        }

        let argument_limit = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'limit')
            .filter_by_id(function_TRELLO_trello_get_board_actions.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_limit) {
            argument_limit = new GPTAssistantAPIFunctionParamVO();
            argument_limit.archived = false;
            argument_limit.function_id = function_TRELLO_trello_get_board_actions.id;
            argument_limit.gpt_funcparam_description = "The limit of the number of responses, between 0 and 1000";
            argument_limit.gpt_funcparam_name = "limit";
            argument_limit.required = false;
            argument_limit.type = GPTAssistantAPIFunctionParamVO.TYPE_INTEGER;
            argument_limit.not_in_function_params = false;
            argument_limit.weight = 1;
            argument_limit.default_json_value = JSON.stringify(50);
        }
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_limit);

        let argument_page = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'page')
            .filter_by_id(function_TRELLO_trello_get_board_actions.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_page) {
            argument_page = new GPTAssistantAPIFunctionParamVO();
            argument_page.archived = false;
            argument_page.function_id = function_TRELLO_trello_get_board_actions.id;
            argument_page.gpt_funcparam_description = "The page of results for actions";
            argument_page.gpt_funcparam_name = "page";
            argument_page.required = false;
            argument_page.type = GPTAssistantAPIFunctionParamVO.TYPE_INTEGER;
            argument_page.not_in_function_params = false;
            argument_page.weight = 2;
            argument_page.default_json_value = JSON.stringify(0);
        }
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_page);

        let argument_before = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'before')
            .filter_by_id(function_TRELLO_trello_get_board_actions.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_before) {
            argument_before = new GPTAssistantAPIFunctionParamVO();
            argument_before.archived = false;
            argument_before.function_id = function_TRELLO_trello_get_board_actions.id;
            argument_before.gpt_funcparam_description = "Actions before an Action ID";
            argument_before.gpt_funcparam_name = "before";
            argument_before.required = false;
            argument_before.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_before.not_in_function_params = false;
            argument_before.weight = 3;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_before);
        }

        let argument_since = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'since')
            .filter_by_id(function_TRELLO_trello_get_board_actions.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_since) {
            argument_since = new GPTAssistantAPIFunctionParamVO();
            argument_since.archived = false;
            argument_since.function_id = function_TRELLO_trello_get_board_actions.id;
            argument_since.gpt_funcparam_description = "Actions since an Action ID";
            argument_since.gpt_funcparam_name = "since";
            argument_since.required = false;
            argument_since.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_since.not_in_function_params = false;
            argument_since.weight = 4;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_since);
        }

        let argument_filter = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'filter')
            .filter_by_id(function_TRELLO_trello_get_board_actions.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_filter) {
            argument_filter = new GPTAssistantAPIFunctionParamVO();
            argument_filter.archived = false;
            argument_filter.function_id = function_TRELLO_trello_get_board_actions.id;
            argument_filter.gpt_funcparam_description = "A comma-separated list of action types.";
            argument_filter.gpt_funcparam_name = "filter";
            argument_filter.required = false;
            argument_filter.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_filter.not_in_function_params = false;
            argument_filter.weight = 5;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_filter);
        }
    }
}