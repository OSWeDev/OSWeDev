/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250506AddOseliaFunction_OSELIA_user_mem_set_mem implements IGeneratorWorker {

    private static instance: Patch20250506AddOseliaFunction_OSELIA_user_mem_set_mem = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250506AddOseliaFunction_OSELIA_user_mem_set_mem';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250506AddOseliaFunction_OSELIA_user_mem_set_mem {
        if (!Patch20250506AddOseliaFunction_OSELIA_user_mem_set_mem.instance) {
            Patch20250506AddOseliaFunction_OSELIA_user_mem_set_mem.instance = new Patch20250506AddOseliaFunction_OSELIA_user_mem_set_mem();
        }
        return Patch20250506AddOseliaFunction_OSELIA_user_mem_set_mem.instance;
    }


    public async work(db: IDatabase<any>) {

        let user_mem_set_mem = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().user_mem_set_mem)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!user_mem_set_mem) {
            user_mem_set_mem = new GPTAssistantAPIFunctionVO();

            user_mem_set_mem.archived = false;
            user_mem_set_mem.module_function = reflect<ModuleOseliaServer>().user_mem_set_mem;
            user_mem_set_mem.module_name = ModuleOseliaServer.getInstance().name;
            user_mem_set_mem.prepend_thread_vo = true;
            user_mem_set_mem.gpt_function_name = reflect<ModuleOseliaServer>().user_mem_set_mem;
            user_mem_set_mem.json_stringify_output = false;
            user_mem_set_mem.gpt_function_description = "Fonction de mise à jour ou d'ajout d'informations utiles sur l'utilisateur. Cette mémoire a pour but de définir la relation avec l'utilisateur, comme le tutoiement/vouvoiement, le style de réponse, le ton, etc. L'ajout se fait à la demande de l'utilisateur, ou exceptionnellement de l'assistant/agent. Les clés doivent être très synthétique et permettre lors de l'appel à get_keys de cibler très efficacement les entrées pertinentes du cache pour une recherche de l'assistant, le contenu doit être utile, vrai, pertinent et idéalement positif. Le reste n'a pas sa place en mémoire.";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(user_mem_set_mem);
        }

        let argument_key = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'key')
            .filter_by_id(user_mem_set_mem.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_key) {
            argument_key = new GPTAssistantAPIFunctionParamVO();
            argument_key.archived = false;
            argument_key.function_id = user_mem_set_mem.id;
            argument_key.gpt_funcparam_description = "La clé de l'entrée de mémoire. Soit on modifie une entrée existante, en reprenant la même clé, soit on crée une nouvelle entrée, en choisissant pour clé une série de quelques mots clés qui permettent d'identifier très simplement, rapidement, synthétiquement le sujet abordé dans le contenu, l'utilité de cette entrée.";
            argument_key.gpt_funcparam_name = "key";
            argument_key.required = true;
            argument_key.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_key.not_in_function_params = false;
            argument_key.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_key);
        }

        let argument_value = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'value')
            .filter_by_id(user_mem_set_mem.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_value) {
            argument_value = new GPTAssistantAPIFunctionParamVO();
            argument_value.archived = false;
            argument_value.function_id = user_mem_set_mem.id;
            argument_value.gpt_funcparam_description = "La valeur/le contenu de l'entrée de mémoire. Le contenu doit être utile, vrai, pertinent et si possible positif.";
            argument_value.gpt_funcparam_name = "value";
            argument_value.required = true;
            argument_value.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_value.not_in_function_params = false;
            argument_value.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_value);
        }

        let argument_user_id = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'user_id')
            .filter_by_id(user_mem_set_mem.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_user_id) {
            argument_user_id = new GPTAssistantAPIFunctionParamVO();
            argument_user_id.archived = false;
            argument_user_id.function_id = user_mem_set_mem.id;
            argument_user_id.gpt_funcparam_description = "Le user_id auquel est liée la mémoire.";
            argument_user_id.gpt_funcparam_name = "user_id";
            argument_user_id.required = true;
            argument_user_id.type = GPTAssistantAPIFunctionParamVO.TYPE_INTEGER;
            argument_user_id.not_in_function_params = false;
            argument_user_id.weight = 2;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_user_id);
        }

        let argument_asked_by = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'asked_by')
            .filter_by_id(user_mem_set_mem.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_asked_by) {
            argument_asked_by = new GPTAssistantAPIFunctionParamVO();
            argument_asked_by.archived = false;
            argument_asked_by.function_id = user_mem_set_mem.id;
            argument_asked_by.gpt_funcparam_description = "Qui demande à modifier la mémoire ? SAME_USER: l'utilisateur dont on modifie la mémoire, OSELIA: l'assistant/toi, OTHER_USER: un autre utilisateur.";
            argument_asked_by.gpt_funcparam_name = "asked_by";
            argument_asked_by.required = true;
            argument_asked_by.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_asked_by.string_enum = ['SAME_USER', 'OSELIA', 'OTHER_USER'];
            argument_asked_by.not_in_function_params = false;
            argument_asked_by.weight = 3;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_asked_by);
        }
    }
}