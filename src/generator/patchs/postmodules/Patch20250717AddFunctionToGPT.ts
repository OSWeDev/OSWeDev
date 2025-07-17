import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import OseliaRunTemplateVO from "../../../shared/modules/Oselia/vos/OseliaRunTemplateVO";
import { field_names, reflect } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";
import GPTAssistantAPIAssistantVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO";
import ModuleOselia from "../../../shared/modules/Oselia/ModuleOselia";
import ModuleOseliaServer from "../../../server/modules/Oselia/ModuleOseliaServer";
import GPTAssistantAPIFunctionParamVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO";
import GPTAssistantAPIFunctionVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO";
import GPTAssistantAPIAssistantFunctionVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO";


export default class Patch20250717AddFunctionToGPT implements IGeneratorWorker {

    private static instance: Patch20250717AddFunctionToGPT = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250717AddFunctionToGPT';
    }

    public static getInstance(): Patch20250717AddFunctionToGPT {
        if (!Patch20250717AddFunctionToGPT.instance) {
            Patch20250717AddFunctionToGPT.instance = new Patch20250717AddFunctionToGPT();
        }
        return Patch20250717AddFunctionToGPT.instance;
    }

    public async work(db: IDatabase<unknown>) {
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

        let get_argument_key = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'key')
            .filter_by_id(get_cache_value_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!get_argument_key) {
            get_argument_key = new GPTAssistantAPIFunctionParamVO();
            get_argument_key.archived = false;
            get_argument_key.function_id = get_cache_value_function.id;
            get_argument_key.gpt_funcparam_description = "La clé de cache à charger";
            get_argument_key.gpt_funcparam_name = "key";
            get_argument_key.required = true;
            get_argument_key.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            get_argument_key.not_in_function_params = false;
            get_argument_key.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(get_argument_key);
        }

        let set_vo_field_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().update_vo_field)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!set_vo_field_function) {
            set_vo_field_function = new GPTAssistantAPIFunctionVO();

            set_vo_field_function.archived = false;
            set_vo_field_function.module_function = reflect<ModuleOseliaServer>().update_vo_field;
            set_vo_field_function.module_name = ModuleOseliaServer.getInstance().name;
            set_vo_field_function.prepend_thread_vo = true;
            set_vo_field_function.gpt_function_name = 'update_vo_field';
            set_vo_field_function.json_stringify_output = false;
            set_vo_field_function.gpt_function_description = "Met à jour un champ d'un VO";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(set_vo_field_function);
        }

        let set_vo_argument_vo = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'key')
            .filter_by_id(set_vo_field_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!set_vo_argument_vo) {
            set_vo_argument_vo = new GPTAssistantAPIFunctionParamVO();
            set_vo_argument_vo.archived = false;
            set_vo_argument_vo.function_id = set_vo_field_function.id;
            set_vo_argument_vo.gpt_funcparam_description = "Le VO à mettre à jour, en JSON";
            set_vo_argument_vo.gpt_funcparam_name = "vo";
            set_vo_argument_vo.required = true;
            set_vo_argument_vo.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            set_vo_argument_vo.not_in_function_params = false;
            set_vo_argument_vo.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(set_vo_argument_vo);
        }

        let set_vo_argument_field_name = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'key')
            .filter_by_id(set_vo_field_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!set_vo_argument_field_name) {
            set_vo_argument_field_name = new GPTAssistantAPIFunctionParamVO();
            set_vo_argument_field_name.archived = false;
            set_vo_argument_field_name.function_id = set_vo_field_function.id;
            set_vo_argument_field_name.gpt_funcparam_description = "Le nom du champ à mettre à jour dans le VO";
            set_vo_argument_field_name.gpt_funcparam_name = "field_name";
            set_vo_argument_field_name.required = true;
            set_vo_argument_field_name.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            set_vo_argument_field_name.not_in_function_params = false;
            set_vo_argument_field_name.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(set_vo_argument_field_name);
        }

        let set_vo_argument_value = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'key')
            .filter_by_id(set_vo_field_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!set_vo_argument_value) {
            set_vo_argument_value = new GPTAssistantAPIFunctionParamVO();
            set_vo_argument_value.archived = false;
            set_vo_argument_value.function_id = set_vo_field_function.id;
            set_vo_argument_value.gpt_funcparam_description = "La valeur à mettre dans le champ du VO, sous le format JSON 'value' : valeur";
            set_vo_argument_value.gpt_funcparam_name = "value";
            set_vo_argument_value.required = true;
            set_vo_argument_value.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            set_vo_argument_value.not_in_function_params = false;
            set_vo_argument_value.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(set_vo_argument_value);
        }
    }
}