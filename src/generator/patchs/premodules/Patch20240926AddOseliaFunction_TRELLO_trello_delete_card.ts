/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240926AddOseliaFunction_TRELLO_trello_delete_card implements IGeneratorWorker {

    private static instance: Patch20240926AddOseliaFunction_TRELLO_trello_delete_card = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240926AddOseliaFunction_TRELLO_trello_delete_card';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240926AddOseliaFunction_TRELLO_trello_delete_card {
        if (!Patch20240926AddOseliaFunction_TRELLO_trello_delete_card.instance) {
            Patch20240926AddOseliaFunction_TRELLO_trello_delete_card.instance = new Patch20240926AddOseliaFunction_TRELLO_trello_delete_card();
        }
        return Patch20240926AddOseliaFunction_TRELLO_trello_delete_card.instance;
    }

    /**
     * NB : Configuration de l'API externe sur le projet
     * TRELLO = Authentification de type KEY_BEARER, remplir le champ clé API (avec le TOKEN_TRELLO obtenu sur le site de Trello) et c'est tout pour l'authentification
     * METHODE : DELETE
     * URL : https://api.trello.com/1/cards/<id>?key=API_KEY_TRELLO&token=TOKEN_TRELLO
     *      (remplacer TOKEN_TRELLO et API_KEY_TRELLO par les valeurs obtenues sur le site de Trello)
     * Accept : application/json
     * Content-Type : application/json
     * Nom : trello_delete_card
     */
    public async work(db: IDatabase<any>) {

        let function_TRELLO_trello_delete_card = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, 'trello_delete_card')
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!function_TRELLO_trello_delete_card) {
            function_TRELLO_trello_delete_card = new GPTAssistantAPIFunctionVO();

            function_TRELLO_trello_delete_card.archived = false;
            function_TRELLO_trello_delete_card.module_function = null;
            function_TRELLO_trello_delete_card.module_name = null;
            function_TRELLO_trello_delete_card.prepend_thread_vo = false;
            function_TRELLO_trello_delete_card.gpt_function_name = 'trello_delete_card';
            function_TRELLO_trello_delete_card.json_stringify_output = true;
            function_TRELLO_trello_delete_card.gpt_function_description = "Delete a Card";
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(function_TRELLO_trello_delete_card);
        }

        let argument_id = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'id')
            .filter_by_id(function_TRELLO_trello_delete_card.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_id) {
            argument_id = new GPTAssistantAPIFunctionParamVO();
            argument_id.archived = false;
            argument_id.function_id = function_TRELLO_trello_delete_card.id;
            argument_id.gpt_funcparam_description = "The ID of the Card";
            argument_id.gpt_funcparam_name = "id";
            argument_id.required = true;
            argument_id.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_id.not_in_function_params = true;
            argument_id.weight = 0;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_id);
        }
    }
}