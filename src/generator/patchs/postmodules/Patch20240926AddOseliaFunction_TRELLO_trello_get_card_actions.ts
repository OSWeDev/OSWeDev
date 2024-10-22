/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240926AddOseliaFunction_TRELLO_trello_get_card_actions implements IGeneratorWorker {

    private static instance: Patch20240926AddOseliaFunction_TRELLO_trello_get_card_actions = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240926AddOseliaFunction_TRELLO_trello_get_card_actions';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240926AddOseliaFunction_TRELLO_trello_get_card_actions {
        if (!Patch20240926AddOseliaFunction_TRELLO_trello_get_card_actions.instance) {
            Patch20240926AddOseliaFunction_TRELLO_trello_get_card_actions.instance = new Patch20240926AddOseliaFunction_TRELLO_trello_get_card_actions();
        }
        return Patch20240926AddOseliaFunction_TRELLO_trello_get_card_actions.instance;
    }

    /**
     * NB : Configuration de l'API externe sur le projet
     * TRELLO = Authentification de type KEY_BEARER, remplir le champ clé API (avec le TOKEN_TRELLO obtenu sur le site de Trello) et c'est tout pour l'authentification
     * METHODE : GET
     * URL : https://api.trello.com/1/cards/<id>/actions?key=API_KEY_TRELLO&token=TOKEN_TRELLO
     *      (remplacer TOKEN_TRELLO et API_KEY_TRELLO par les valeurs obtenues sur le site de Trello)
     * Accept : application/json
     * Content-Type : application/json
     * Nom : trello_get_card_actions
     */
    public async work(db: IDatabase<any>) {

        let function_TRELLO_trello_get_card_actions = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, 'trello_get_card_actions')
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!function_TRELLO_trello_get_card_actions) {
            function_TRELLO_trello_get_card_actions = new GPTAssistantAPIFunctionVO();

            function_TRELLO_trello_get_card_actions.archived = false;
            function_TRELLO_trello_get_card_actions.module_function = null;
            function_TRELLO_trello_get_card_actions.module_name = null;
            function_TRELLO_trello_get_card_actions.prepend_thread_vo = false;
            function_TRELLO_trello_get_card_actions.gpt_function_name = 'trello_get_card_actions';
            function_TRELLO_trello_get_card_actions.json_stringify_output = true;
            function_TRELLO_trello_get_card_actions.gpt_function_description = "Get all of the actions of a Card";
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(function_TRELLO_trello_get_card_actions);
        }

        let argument_id = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'id')
            .filter_by_id(function_TRELLO_trello_get_card_actions.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_id) {
            argument_id = new GPTAssistantAPIFunctionParamVO();
            argument_id.archived = false;
            argument_id.function_id = function_TRELLO_trello_get_card_actions.id;
            argument_id.gpt_funcparam_description = "The ID of the Card";
            argument_id.gpt_funcparam_name = "id";
            argument_id.required = true;
            argument_id.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_id.not_in_function_params = true;
            argument_id.weight = 0;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_id);
        }

        let argument_filter = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'filter')
            .filter_by_id(function_TRELLO_trello_get_card_actions.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_filter) {
            argument_filter = new GPTAssistantAPIFunctionParamVO();
            argument_filter.archived = false;
            argument_filter.function_id = function_TRELLO_trello_get_card_actions.id;
            argument_filter.gpt_funcparam_description = "A comma-separated list of action types";
            argument_filter.gpt_funcparam_name = "filter";
            argument_filter.required = false;
            argument_filter.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_filter.not_in_function_params = false;
            argument_filter.weight = 1;
        }
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_filter);

        let argument_page = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'page')
            .filter_by_id(function_TRELLO_trello_get_card_actions.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_page) {
            argument_page = new GPTAssistantAPIFunctionParamVO();
            argument_page.archived = false;
            argument_page.function_id = function_TRELLO_trello_get_card_actions.id;
            argument_page.gpt_funcparam_description = "The page of results for actions. Each page of results has 50 actions";
            argument_page.gpt_funcparam_name = "page";
            argument_page.required = false;
            argument_page.type = GPTAssistantAPIFunctionParamVO.TYPE_INTEGER;
            argument_page.not_in_function_params = false;
            argument_page.weight = 2;
            argument_page.default_json_value = JSON.stringify(0);
        }
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_page);
    }
}