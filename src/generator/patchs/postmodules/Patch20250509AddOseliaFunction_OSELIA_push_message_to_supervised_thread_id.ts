/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250509AddOseliaFunction_OSELIA_push_message_to_supervised_thread_id implements IGeneratorWorker {

    private static instance: Patch20250509AddOseliaFunction_OSELIA_push_message_to_supervised_thread_id = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250509AddOseliaFunction_OSELIA_push_message_to_supervised_thread_id';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250509AddOseliaFunction_OSELIA_push_message_to_supervised_thread_id {
        if (!Patch20250509AddOseliaFunction_OSELIA_push_message_to_supervised_thread_id.instance) {
            Patch20250509AddOseliaFunction_OSELIA_push_message_to_supervised_thread_id.instance = new Patch20250509AddOseliaFunction_OSELIA_push_message_to_supervised_thread_id();
        }
        return Patch20250509AddOseliaFunction_OSELIA_push_message_to_supervised_thread_id.instance;
    }

    public async work(db: IDatabase<any>) {

        let push_message_to_supervised_thread_id = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().push_message_to_supervised_thread_id)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!push_message_to_supervised_thread_id) {
            push_message_to_supervised_thread_id = new GPTAssistantAPIFunctionVO();

            push_message_to_supervised_thread_id.archived = false;
            push_message_to_supervised_thread_id.module_function = reflect<ModuleOseliaServer>().push_message_to_supervised_thread_id;
            push_message_to_supervised_thread_id.module_name = ModuleOseliaServer.getInstance().name;
            push_message_to_supervised_thread_id.prepend_thread_vo = true;
            push_message_to_supervised_thread_id.gpt_function_name = reflect<ModuleOseliaServer>().push_message_to_supervised_thread_id;
            push_message_to_supervised_thread_id.json_stringify_output = false;
            push_message_to_supervised_thread_id.gpt_function_description = "Permet de transmettre un message à un thread supervisé par cet assistant. Le message est directement publié dans le thread de l'agent supervisé, avec en préfix l'information qu'il vient de son superviseur.";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(push_message_to_supervised_thread_id);
        }

        let argument_thread_id = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'thread_id')
            .filter_by_id(push_message_to_supervised_thread_id.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_thread_id) {
            argument_thread_id = new GPTAssistantAPIFunctionParamVO();
            argument_thread_id.archived = false;
            argument_thread_id.function_id = push_message_to_supervised_thread_id.id;
            argument_thread_id.gpt_funcparam_description = "Le thread_id identifiant l'agent que l'on souhaite contacter.";
            argument_thread_id.gpt_funcparam_name = "thread_id";
            argument_thread_id.required = true;
            argument_thread_id.type = GPTAssistantAPIFunctionParamVO.TYPE_NUMBER;
            argument_thread_id.not_in_function_params = false;
            argument_thread_id.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_thread_id);
        }

        let argument_message = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'message')
            .filter_by_id(push_message_to_supervised_thread_id.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_message) {
            argument_message = new GPTAssistantAPIFunctionParamVO();
            argument_message.archived = false;
            argument_message.function_id = push_message_to_supervised_thread_id.id;
            argument_message.gpt_funcparam_description = "Le message à transmettre à cet agent de la part de son superviseur.";
            argument_message.gpt_funcparam_name = "message";
            argument_message.required = true;
            argument_message.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_message.not_in_function_params = false;
            argument_message.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_message);
        }
    }
}