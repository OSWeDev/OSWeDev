/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20241016AddOseliaFunction_OSELIA_get_cache_value implements IGeneratorWorker {

    private static instance: Patch20241016AddOseliaFunction_OSELIA_get_cache_value = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20241016AddOseliaFunction_OSELIA_get_cache_value';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20241016AddOseliaFunction_OSELIA_get_cache_value {
        if (!Patch20241016AddOseliaFunction_OSELIA_get_cache_value.instance) {
            Patch20241016AddOseliaFunction_OSELIA_get_cache_value.instance = new Patch20241016AddOseliaFunction_OSELIA_get_cache_value();
        }
        return Patch20241016AddOseliaFunction_OSELIA_get_cache_value.instance;
    }


    public async work(db: IDatabase<any>) {

        let get_cache_value_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().get_cache_value)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!get_cache_value_function) {
            get_cache_value_function = new GPTAssistantAPIFunctionVO();

            get_cache_value_function.archived = false;
            get_cache_value_function.module_function = reflect<ModuleOseliaServer>().get_cache_value;
            get_cache_value_function.module_name = ModuleOseliaServer.getInstance().name;
            get_cache_value_function.prepend_thread_vo = true;
            get_cache_value_function.gpt_function_name = 'get_cache_value';
            get_cache_value_function.json_stringify_output = false;
            get_cache_value_function.gpt_function_description = "Charger un résultat depuis le cache dans un contexte (thread) donné. Si on ne trouve pas dans le thread actuel, on cherche dans le cache du thread parent, et ainsi de suite jusqu'à trouver ou remonter à la racine.";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(get_cache_value_function);
        }

        let argument_key = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'key')
            .filter_by_id(get_cache_value_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_key) {
            argument_key = new GPTAssistantAPIFunctionParamVO();
            argument_key.archived = false;
            argument_key.function_id = get_cache_value_function.id;
            argument_key.gpt_funcparam_description = "La clé de cache à charger";
            argument_key.gpt_funcparam_name = "key";
            argument_key.required = true;
            argument_key.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_key.not_in_function_params = false;
            argument_key.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_key);
        }
    }
}