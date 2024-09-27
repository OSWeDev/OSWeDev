/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240926AddOseliaFunction_TRELLO_trello_create_card implements IGeneratorWorker {

    private static instance: Patch20240926AddOseliaFunction_TRELLO_trello_create_card = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240926AddOseliaFunction_TRELLO_trello_create_card';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240926AddOseliaFunction_TRELLO_trello_create_card {
        if (!Patch20240926AddOseliaFunction_TRELLO_trello_create_card.instance) {
            Patch20240926AddOseliaFunction_TRELLO_trello_create_card.instance = new Patch20240926AddOseliaFunction_TRELLO_trello_create_card();
        }
        return Patch20240926AddOseliaFunction_TRELLO_trello_create_card.instance;
    }

    /**
     * NB : Configuration de l'API externe sur le projet
     * TRELLO = Authentification de type KEY_BEARER, remplir le champ clé API (avec le TOKEN_TRELLO obtenu sur le site de Trello) et c'est tout pour l'authentification
     * METHODE : POST
     * URL : https://api.trello.com/1/cards?key=API_KEY_TRELLO&token=TOKEN_TRELLO
     *      (remplacer TOKEN_TRELLO et API_KEY_TRELLO par les valeurs obtenues sur le site de Trello)
     * Accept : application/json
     * Content-Type : application/json
     * Nom : trello_create_card
     */
    public async work(db: IDatabase<any>) {

        let function_TRELLO_trello_create_card = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, 'trello_create_card')
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!function_TRELLO_trello_create_card) {
            function_TRELLO_trello_create_card = new GPTAssistantAPIFunctionVO();

            function_TRELLO_trello_create_card.archived = false;
            function_TRELLO_trello_create_card.module_function = null;
            function_TRELLO_trello_create_card.module_name = null;
            function_TRELLO_trello_create_card.prepend_thread_vo = false;
            function_TRELLO_trello_create_card.gpt_function_name = 'trello_create_card';
            function_TRELLO_trello_create_card.json_stringify_output = true;
            function_TRELLO_trello_create_card.gpt_function_description = "Create a new card";
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(function_TRELLO_trello_create_card);


            const argument_name = new GPTAssistantAPIFunctionParamVO();
            argument_name.archived = false;
            argument_name.function_id = function_TRELLO_trello_create_card.id;
            argument_name.gpt_funcparam_description = "The name for the card";
            argument_name.gpt_funcparam_name = "name";
            argument_name.required = true;
            argument_name.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_name.not_in_function_params = false;
            argument_name.weight = 0;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_name);

            const argument_desc = new GPTAssistantAPIFunctionParamVO();
            argument_desc.archived = false;
            argument_desc.function_id = function_TRELLO_trello_create_card.id;
            argument_desc.gpt_funcparam_description = "The description for the card";
            argument_desc.gpt_funcparam_name = "desc";
            argument_desc.required = false;
            argument_desc.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_desc.not_in_function_params = false;
            argument_desc.weight = 1;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_desc);

            const argument_pos = new GPTAssistantAPIFunctionParamVO();
            argument_pos.archived = false;
            argument_pos.function_id = function_TRELLO_trello_create_card.id;
            argument_pos.gpt_funcparam_description = "The position of the new card. top, bottom, or a positive float";
            argument_pos.gpt_funcparam_name = "pos";
            argument_pos.required = false;
            argument_pos.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_pos.not_in_function_params = false;
            argument_pos.weight = 2;
            argument_pos.default_json_value = '"top"';
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_pos);

            const argument_due = new GPTAssistantAPIFunctionParamVO();
            argument_due.archived = false;
            argument_due.function_id = function_TRELLO_trello_create_card.id;
            argument_due.gpt_funcparam_description = "A due date for the card";
            argument_due.gpt_funcparam_name = "due";
            argument_due.required = false;
            argument_due.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_due.not_in_function_params = false;
            argument_due.weight = 3;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_due);

            const argument_idList = new GPTAssistantAPIFunctionParamVO();
            argument_idList.archived = false;
            argument_idList.function_id = function_TRELLO_trello_create_card.id;
            argument_idList.gpt_funcparam_description = "The ID of the list the card should be created in";
            argument_idList.gpt_funcparam_name = "idList";
            argument_idList.required = true;
            argument_idList.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_idList.not_in_function_params = false;
            argument_idList.weight = 4;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_idList);

            const argument_idMembers = new GPTAssistantAPIFunctionParamVO();
            argument_idMembers.archived = false;
            argument_idMembers.function_id = function_TRELLO_trello_create_card.id;
            argument_idMembers.gpt_funcparam_description = "Comma-separated list of member IDs to add to the card";
            argument_idMembers.gpt_funcparam_name = "idMembers";
            argument_idMembers.required = false;
            argument_idMembers.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_idMembers.not_in_function_params = false;
            argument_idMembers.weight = 5;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_idMembers);

            const argument_idLabels = new GPTAssistantAPIFunctionParamVO();
            argument_idLabels.archived = false;
            argument_idLabels.function_id = function_TRELLO_trello_create_card.id;
            argument_idLabels.gpt_funcparam_description = "Comma-separated list of label IDs to add to the card";
            argument_idLabels.gpt_funcparam_name = "idLabels";
            argument_idLabels.required = false;
            argument_idLabels.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_idLabels.not_in_function_params = false;
            argument_idLabels.weight = 6;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_idLabels);

            const argument_urlSource = new GPTAssistantAPIFunctionParamVO();
            argument_urlSource.archived = false;
            argument_urlSource.function_id = function_TRELLO_trello_create_card.id;
            argument_urlSource.gpt_funcparam_description = "A URL starting with http:// or https://";
            argument_urlSource.gpt_funcparam_name = "urlSource";
            argument_urlSource.required = false;
            argument_urlSource.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_urlSource.not_in_function_params = false;
            argument_urlSource.weight = 7;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_urlSource);

            const argument_fileSource = new GPTAssistantAPIFunctionParamVO();
            argument_fileSource.archived = false;
            argument_fileSource.function_id = function_TRELLO_trello_create_card.id;
            argument_fileSource.gpt_funcparam_description = "Format: binary";
            argument_fileSource.gpt_funcparam_name = "fileSource";
            argument_fileSource.required = false;
            argument_fileSource.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_fileSource.not_in_function_params = false;
            argument_fileSource.weight = 8;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_fileSource);

            const argument_mimeType = new GPTAssistantAPIFunctionParamVO();
            argument_mimeType.archived = false;
            argument_mimeType.function_id = function_TRELLO_trello_create_card.id;
            argument_mimeType.gpt_funcparam_description = "The mimeType of the attachment. Max length 256";
            argument_mimeType.gpt_funcparam_name = "mimeType";
            argument_mimeType.required = false;
            argument_mimeType.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_mimeType.not_in_function_params = false;
            argument_mimeType.weight = 9;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_mimeType);

            const argument_idCardSource = new GPTAssistantAPIFunctionParamVO();
            argument_idCardSource.archived = false;
            argument_idCardSource.function_id = function_TRELLO_trello_create_card.id;
            argument_idCardSource.gpt_funcparam_description = "The ID of a card to copy into the new card";
            argument_idCardSource.gpt_funcparam_name = "idCardSource";
            argument_idCardSource.required = false;
            argument_idCardSource.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_idCardSource.not_in_function_params = false;
            argument_idCardSource.weight = 10;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_idCardSource);

            const argument_keepFromSource = new GPTAssistantAPIFunctionParamVO();
            argument_keepFromSource.archived = false;
            argument_keepFromSource.function_id = function_TRELLO_trello_create_card.id;
            argument_keepFromSource.gpt_funcparam_description = "If using idCardSource you can specify which properties to copy over. all or comma-separated list of: attachments,checklists,customFields,comments,due,start,labels,members,start,stickers  Style: form Default: all Valid values: all, attachments, checklists, comments, customFields, due, start, labels, members, start, stickers";
            argument_keepFromSource.gpt_funcparam_name = "keepFromSource";
            argument_keepFromSource.required = false;
            argument_keepFromSource.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_keepFromSource.not_in_function_params = false;
            argument_keepFromSource.weight = 11;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_keepFromSource);

            const argument_address = new GPTAssistantAPIFunctionParamVO();
            argument_address.archived = false;
            argument_address.function_id = function_TRELLO_trello_create_card.id;
            argument_address.gpt_funcparam_description = "For use with/by the Map View";
            argument_address.gpt_funcparam_name = "address";
            argument_address.required = false;
            argument_address.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_address.not_in_function_params = false;
            argument_address.weight = 12;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_address);

            const argument_coordinates = new GPTAssistantAPIFunctionParamVO();
            argument_coordinates.archived = false;
            argument_coordinates.function_id = function_TRELLO_trello_create_card.id;
            argument_coordinates.gpt_funcparam_description = "For use with/by the Map View. Should take the form latitude,longitude";
            argument_coordinates.gpt_funcparam_name = "coordinates";
            argument_coordinates.required = false;
            argument_coordinates.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_coordinates.not_in_function_params = false;
            argument_coordinates.weight = 13;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_coordinates);

            const argument_locationName = new GPTAssistantAPIFunctionParamVO();
            argument_locationName.archived = false;
            argument_locationName.function_id = function_TRELLO_trello_create_card.id;
            argument_locationName.gpt_funcparam_description = "For use with/by the Map View";
            argument_locationName.gpt_funcparam_name = "locationName";
            argument_locationName.required = false;
            argument_locationName.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_locationName.not_in_function_params = false;
            argument_locationName.weight = 14;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_locationName);
        }
    }
}