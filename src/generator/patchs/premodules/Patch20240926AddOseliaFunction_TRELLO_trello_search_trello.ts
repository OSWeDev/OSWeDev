/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240926AddOseliaFunction_TRELLO_trello_search_trello implements IGeneratorWorker {

    private static instance: Patch20240926AddOseliaFunction_TRELLO_trello_search_trello = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240926AddOseliaFunction_TRELLO_trello_search_trello';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240926AddOseliaFunction_TRELLO_trello_search_trello {
        if (!Patch20240926AddOseliaFunction_TRELLO_trello_search_trello.instance) {
            Patch20240926AddOseliaFunction_TRELLO_trello_search_trello.instance = new Patch20240926AddOseliaFunction_TRELLO_trello_search_trello();
        }
        return Patch20240926AddOseliaFunction_TRELLO_trello_search_trello.instance;
    }

    /**
     * NB : Configuration de l'API externe sur le projet
     * TRELLO = Authentification de type KEY_BEARER, remplir le champ clé API (avec le TOKEN_TRELLO obtenu sur le site de Trello) et c'est tout pour l'authentification
     * METHODE : GET
     * URL : https://api.trello.com/1/search?query=<query>&key=API_KEY_TRELLO&token=TOKEN_TRELLO
     *      (remplacer TOKEN_TRELLO et API_KEY_TRELLO par les valeurs obtenues sur le site de Trello)
     * Accept : application/json
     * Content-Type : application/json
     * Nom : trello_search_trello
     */
    public async work(db: IDatabase<any>) {

        let function_TRELLO_trello_search_trello = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, 'trello_search_trello')
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!function_TRELLO_trello_search_trello) {
            function_TRELLO_trello_search_trello = new GPTAssistantAPIFunctionVO();

            function_TRELLO_trello_search_trello.archived = false;
            function_TRELLO_trello_search_trello.module_function = null;
            function_TRELLO_trello_search_trello.module_name = null;
            function_TRELLO_trello_search_trello.prepend_thread_vo = false;
            function_TRELLO_trello_search_trello.gpt_function_name = 'trello_search_trello';
            function_TRELLO_trello_search_trello.json_stringify_output = true;
            function_TRELLO_trello_search_trello.gpt_function_description = "Find what you're looking for in Trello";
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(function_TRELLO_trello_search_trello);
        }

        let argument_query = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'query')
            .filter_by_id(function_TRELLO_trello_search_trello.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_query) {
            argument_query = new GPTAssistantAPIFunctionParamVO();
            argument_query.archived = false;
            argument_query.function_id = function_TRELLO_trello_search_trello.id;
            argument_query.gpt_funcparam_description = "The search query with a length of 1 to 16384 characters";
            argument_query.gpt_funcparam_name = "query";
            argument_query.required = true;
            argument_query.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_query.not_in_function_params = true;
            argument_query.weight = 0;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_query);
        }

        let argument_idBoards = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'idBoards')
            .filter_by_id(function_TRELLO_trello_search_trello.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_idBoards) {
            argument_idBoards = new GPTAssistantAPIFunctionParamVO();
            argument_idBoards.archived = false;
            argument_idBoards.function_id = function_TRELLO_trello_search_trello.id;
            argument_idBoards.gpt_funcparam_description = "'mine' or a comma-separated list of Board IDs";
            argument_idBoards.gpt_funcparam_name = "idBoards";
            argument_idBoards.required = false;
            argument_idBoards.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_idBoards.not_in_function_params = false;
            argument_idBoards.weight = 1;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_idBoards);
        }

        let argument_idOrganizations = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'idOrganizations')
            .filter_by_id(function_TRELLO_trello_search_trello.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_idOrganizations) {
            argument_idOrganizations = new GPTAssistantAPIFunctionParamVO();
            argument_idOrganizations.archived = false;
            argument_idOrganizations.function_id = function_TRELLO_trello_search_trello.id;
            argument_idOrganizations.gpt_funcparam_description = "A comma-separated list of Organization IDs";
            argument_idOrganizations.gpt_funcparam_name = "idOrganizations";
            argument_idOrganizations.required = false;
            argument_idOrganizations.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_idOrganizations.not_in_function_params = false;
            argument_idOrganizations.weight = 2;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_idOrganizations);
        }

        let argument_idCards = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'idCards')
            .filter_by_id(function_TRELLO_trello_search_trello.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_idCards) {
            argument_idCards = new GPTAssistantAPIFunctionParamVO();
            argument_idCards.archived = false;
            argument_idCards.function_id = function_TRELLO_trello_search_trello.id;
            argument_idCards.gpt_funcparam_description = "A comma-separated list of Card IDs";
            argument_idCards.gpt_funcparam_name = "idCards";
            argument_idCards.required = false;
            argument_idCards.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
        }
        argument_idCards.not_in_function_params = false;
        argument_idCards.weight = 3;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_idCards);
    }
}