/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20241016AddOseliaFunction_OSELIA_get_assistant implements IGeneratorWorker {

    private static instance: Patch20241016AddOseliaFunction_OSELIA_get_assistant = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20241016AddOseliaFunction_OSELIA_get_assistant';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20241016AddOseliaFunction_OSELIA_get_assistant {
        if (!Patch20241016AddOseliaFunction_OSELIA_get_assistant.instance) {
            Patch20241016AddOseliaFunction_OSELIA_get_assistant.instance = new Patch20241016AddOseliaFunction_OSELIA_get_assistant();
        }
        return Patch20241016AddOseliaFunction_OSELIA_get_assistant.instance;
    }


    public async work(db: IDatabase<any>) {

        let get_assistant_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().get_assistant)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!get_assistant_function) {
            get_assistant_function = new GPTAssistantAPIFunctionVO();

            get_assistant_function.archived = false;
            get_assistant_function.module_function = reflect<ModuleOseliaServer>().get_assistant;
            get_assistant_function.module_name = ModuleOseliaServer.getInstance().name;
            get_assistant_function.prepend_thread_vo = true;
            get_assistant_function.gpt_function_name = 'get_assistant';
            get_assistant_function.json_stringify_output = false;
            get_assistant_function.gpt_function_description = "Charger un assistant depuis son nom";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(get_assistant_function);
        }

        let argument_assistant_name = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'assistant_name')
            .filter_by_id(get_assistant_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_assistant_name) {
            argument_assistant_name = new GPTAssistantAPIFunctionParamVO();
            argument_assistant_name.archived = false;
            argument_assistant_name.function_id = get_assistant_function.id;
            argument_assistant_name.gpt_funcparam_description = "Le nom de l'assistant à charger";
            argument_assistant_name.gpt_funcparam_name = "assistant_name";
            argument_assistant_name.required = true;
            argument_assistant_name.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_assistant_name.not_in_function_params = false;
            argument_assistant_name.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_assistant_name);
        }
    }
}