/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20241016AddOseliaFunction_OSELIA_set_cache_value implements IGeneratorWorker {

    private static instance: Patch20241016AddOseliaFunction_OSELIA_set_cache_value = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20241016AddOseliaFunction_OSELIA_set_cache_value';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20241016AddOseliaFunction_OSELIA_set_cache_value {
        if (!Patch20241016AddOseliaFunction_OSELIA_set_cache_value.instance) {
            Patch20241016AddOseliaFunction_OSELIA_set_cache_value.instance = new Patch20241016AddOseliaFunction_OSELIA_set_cache_value();
        }
        return Patch20241016AddOseliaFunction_OSELIA_set_cache_value.instance;
    }

    public async work(db: IDatabase<any>) {

        let set_cache_value_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().set_cache_value)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!set_cache_value_function) {
            set_cache_value_function = new GPTAssistantAPIFunctionVO();

            set_cache_value_function.archived = false;
            set_cache_value_function.module_function = reflect<ModuleOseliaServer>().set_cache_value;
            set_cache_value_function.module_name = ModuleOseliaServer.getInstance().name;
            set_cache_value_function.prepend_thread_vo = true;
            set_cache_value_function.gpt_function_name = 'set_cache_value';
            set_cache_value_function.json_stringify_output = false;
            set_cache_value_function.gpt_function_description = "Mettre un résultat en cache dans un contexte (thread) donné. Le thread est par défaut - 0 ou null - le thread courant. Sinon on peut indiquer l'id d'un thread parent pour agir sur son cache directement.";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(set_cache_value_function);
        }

        let argument_key = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'key')
            .filter_by_id(set_cache_value_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_key) {
            argument_key = new GPTAssistantAPIFunctionParamVO();
            argument_key.archived = false;
            argument_key.function_id = set_cache_value_function.id;
            argument_key.gpt_funcparam_description = "La clé de cache à modifier";
            argument_key.gpt_funcparam_name = "key";
            argument_key.required = true;
            argument_key.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_key.not_in_function_params = false;
            argument_key.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_key);
        }

        let argument_value = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'value')
            .filter_by_id(set_cache_value_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_value) {
            argument_value = new GPTAssistantAPIFunctionParamVO();
            argument_value.archived = false;
            argument_value.function_id = set_cache_value_function.id;
            argument_value.gpt_funcparam_description = "La valeur à mettre dans le cache";
            argument_value.gpt_funcparam_name = "value";
            argument_value.required = true;
            argument_value.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_value.not_in_function_params = false;
            argument_value.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_value);
        }

        let argument_thread_id = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'thread_id')
            .filter_by_id(set_cache_value_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_thread_id) {
            argument_thread_id = new GPTAssistantAPIFunctionParamVO();
            argument_thread_id.archived = false;
            argument_thread_id.function_id = set_cache_value_function.id;
            argument_thread_id.gpt_funcparam_description = "Si on veut mettre à jour le cache d'un autre thread que le thread actuel (uniquement un thread parent de celui-ci). Par défaut - 0 ou null -, le thread actuel est utilisé.";
            argument_thread_id.gpt_funcparam_name = "thread_id";
            argument_thread_id.required = true;
            argument_thread_id.type = GPTAssistantAPIFunctionParamVO.TYPE_INTEGER;
            argument_thread_id.not_in_function_params = false;
            argument_thread_id.weight = 2;
            argument_thread_id.default_json_value = JSON.stringify(0);
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_thread_id);
        }
    }
}