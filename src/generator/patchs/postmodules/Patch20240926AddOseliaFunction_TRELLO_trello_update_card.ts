/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240926AddOseliaFunction_TRELLO_trello_update_card implements IGeneratorWorker {

    private static instance: Patch20240926AddOseliaFunction_TRELLO_trello_update_card = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240926AddOseliaFunction_TRELLO_trello_update_card';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240926AddOseliaFunction_TRELLO_trello_update_card {
        if (!Patch20240926AddOseliaFunction_TRELLO_trello_update_card.instance) {
            Patch20240926AddOseliaFunction_TRELLO_trello_update_card.instance = new Patch20240926AddOseliaFunction_TRELLO_trello_update_card();
        }
        return Patch20240926AddOseliaFunction_TRELLO_trello_update_card.instance;
    }

    /**
     * NB : Configuration de l'API externe sur le projet
     * TRELLO = Authentification de type KEY_BEARER, remplir le champ clé API (avec le TOKEN_TRELLO obtenu sur le site de Trello) et c'est tout pour l'authentification
     * METHODE : PUT
     * URL : https://api.trello.com/1/cards/<id>?key=API_KEY_TRELLO&token=TOKEN_TRELLO
     *      (remplacer TOKEN_TRELLO et API_KEY_TRELLO par les valeurs obtenues sur le site de Trello)
     * Accept : application/json
     * Content-Type : application/json
     * Nom : trello_update_card
     */
    public async work(db: IDatabase<any>) {

        let function_TRELLO_trello_update_card = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, 'trello_update_card')
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!function_TRELLO_trello_update_card) {
            function_TRELLO_trello_update_card = new GPTAssistantAPIFunctionVO();

            function_TRELLO_trello_update_card.archived = false;
            function_TRELLO_trello_update_card.module_function = null;
            function_TRELLO_trello_update_card.module_name = null;
            function_TRELLO_trello_update_card.prepend_thread_vo = false;
            function_TRELLO_trello_update_card.gpt_function_name = 'trello_update_card';
            function_TRELLO_trello_update_card.json_stringify_output = true;
            function_TRELLO_trello_update_card.gpt_function_description = "Update a Card";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(function_TRELLO_trello_update_card);
        }

        let argument_id = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'id')
            .filter_by_id(function_TRELLO_trello_update_card.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_id) {
            argument_id = new GPTAssistantAPIFunctionParamVO();
            argument_id.archived = false;
            argument_id.function_id = function_TRELLO_trello_update_card.id;
            argument_id.gpt_funcparam_description = "The ID of the Card";
            argument_id.gpt_funcparam_name = "id";
            argument_id.required = true;
            argument_id.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_id.not_in_function_params = true;
            argument_id.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_id);
        }

        let argument_name = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'name')
            .filter_by_id(function_TRELLO_trello_update_card.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_name) {
            argument_name = new GPTAssistantAPIFunctionParamVO();
            argument_name.archived = false;
            argument_name.function_id = function_TRELLO_trello_update_card.id;
            argument_name.gpt_funcparam_description = "The name for the card";
            argument_name.gpt_funcparam_name = "name";
            argument_name.required = false;
            argument_name.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_name.not_in_function_params = false;
            argument_name.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_name);
        }

        let argument_desc = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'desc')
            .filter_by_id(function_TRELLO_trello_update_card.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_desc) {
            argument_desc = new GPTAssistantAPIFunctionParamVO();
            argument_desc.archived = false;
            argument_desc.function_id = function_TRELLO_trello_update_card.id;
            argument_desc.gpt_funcparam_description = "The description for the card";
            argument_desc.gpt_funcparam_name = "desc";
            argument_desc.required = false;
            argument_desc.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_desc.not_in_function_params = false;
            argument_desc.weight = 2;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_desc);
        }

        let argument_pos = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'pos')
            .filter_by_id(function_TRELLO_trello_update_card.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_pos) {
            argument_pos = new GPTAssistantAPIFunctionParamVO();
            argument_pos.archived = false;
            argument_pos.function_id = function_TRELLO_trello_update_card.id;
            argument_pos.gpt_funcparam_description = "The position of the new card. top, bottom, or a positive float";
            argument_pos.gpt_funcparam_name = "pos";
            argument_pos.required = false;
            argument_pos.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_pos.not_in_function_params = false;
            argument_pos.weight = 3;
            argument_pos.default_json_value = '"top"';
        }
        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_pos);

        let argument_due = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'due')
            .filter_by_id(function_TRELLO_trello_update_card.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_due) {
            argument_due = new GPTAssistantAPIFunctionParamVO();
            argument_due.archived = false;
            argument_due.function_id = function_TRELLO_trello_update_card.id;
            argument_due.gpt_funcparam_description = "A due date for the card";
            argument_due.gpt_funcparam_name = "due";
            argument_due.required = false;
            argument_due.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_due.not_in_function_params = false;
            argument_due.weight = 4;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_due);
        }

        let argument_idList = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'idList')
            .filter_by_id(function_TRELLO_trello_update_card.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_idList) {
            argument_idList = new GPTAssistantAPIFunctionParamVO();
            argument_idList.archived = false;
            argument_idList.function_id = function_TRELLO_trello_update_card.id;
            argument_idList.gpt_funcparam_description = "The ID of the list the card should be created in";
            argument_idList.gpt_funcparam_name = "idList";
            argument_idList.required = false;
            argument_idList.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_idList.not_in_function_params = false;
            argument_idList.weight = 5;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_idList);
        }

        let argument_idMembers = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'idMembers')
            .filter_by_id(function_TRELLO_trello_update_card.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_idMembers) {
            argument_idMembers = new GPTAssistantAPIFunctionParamVO();
            argument_idMembers.archived = false;
            argument_idMembers.function_id = function_TRELLO_trello_update_card.id;
            argument_idMembers.gpt_funcparam_description = "Comma-separated list of member IDs to add to the card";
            argument_idMembers.gpt_funcparam_name = "idMembers";
            argument_idMembers.required = false;
            argument_idMembers.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_idMembers.not_in_function_params = false;
            argument_idMembers.weight = 6;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_idMembers);
        }

        let argument_idLabels = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'idLabels')
            .filter_by_id(function_TRELLO_trello_update_card.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_idLabels) {
            argument_idLabels = new GPTAssistantAPIFunctionParamVO();
            argument_idLabels.archived = false;
            argument_idLabels.function_id = function_TRELLO_trello_update_card.id;
            argument_idLabels.gpt_funcparam_description = "Comma-separated list of label IDs to add to the card";
            argument_idLabels.gpt_funcparam_name = "idLabels";
            argument_idLabels.required = false;
            argument_idLabels.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_idLabels.not_in_function_params = false;
            argument_idLabels.weight = 7;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_idLabels);
        }

        let argument_closed = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'closed')
            .filter_by_id(function_TRELLO_trello_update_card.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_closed) {
            argument_closed = new GPTAssistantAPIFunctionParamVO();
            argument_closed.archived = false;
            argument_closed.function_id = function_TRELLO_trello_update_card.id;
            argument_closed.gpt_funcparam_description = "Whether the card should be archived (closed: true)";
            argument_closed.gpt_funcparam_name = "closed";
            argument_closed.required = false;
            argument_closed.type = GPTAssistantAPIFunctionParamVO.TYPE_BOOLEAN;
            argument_closed.not_in_function_params = false;
            argument_closed.weight = 8;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_closed);
        }


        let argument_address = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'address')
            .filter_by_id(function_TRELLO_trello_update_card.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_address) {
            argument_address = new GPTAssistantAPIFunctionParamVO();
            argument_address.archived = false;
            argument_address.function_id = function_TRELLO_trello_update_card.id;
            argument_address.gpt_funcparam_description = "For use with/by the Map View";
            argument_address.gpt_funcparam_name = "address";
            argument_address.required = false;
            argument_address.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_address.not_in_function_params = false;
            argument_address.weight = 12;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_address);
        }

        let argument_coordinates = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'coordinates')
            .filter_by_id(function_TRELLO_trello_update_card.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_coordinates) {
            argument_coordinates = new GPTAssistantAPIFunctionParamVO();
            argument_coordinates.archived = false;
            argument_coordinates.function_id = function_TRELLO_trello_update_card.id;
            argument_coordinates.gpt_funcparam_description = "For use with/by the Map View. Should take the form latitude,longitude";
            argument_coordinates.gpt_funcparam_name = "coordinates";
            argument_coordinates.required = false;
            argument_coordinates.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_coordinates.not_in_function_params = false;
            argument_coordinates.weight = 13;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_coordinates);
        }

        let argument_locationName = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'locationName')
            .filter_by_id(function_TRELLO_trello_update_card.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_locationName) {
            argument_locationName = new GPTAssistantAPIFunctionParamVO();
            argument_locationName.archived = false;
            argument_locationName.function_id = function_TRELLO_trello_update_card.id;
            argument_locationName.gpt_funcparam_description = "For use with/by the Map View";
            argument_locationName.gpt_funcparam_name = "locationName";
            argument_locationName.required = false;
            argument_locationName.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_locationName.not_in_function_params = false;
            argument_locationName.weight = 14;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_locationName);
        }
    }
}