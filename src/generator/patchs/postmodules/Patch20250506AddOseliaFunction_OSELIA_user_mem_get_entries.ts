/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250506AddOseliaFunction_OSELIA_user_mem_get_entries implements IGeneratorWorker {

    private static instance: Patch20250506AddOseliaFunction_OSELIA_user_mem_get_entries = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250506AddOseliaFunction_OSELIA_user_mem_get_entries';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250506AddOseliaFunction_OSELIA_user_mem_get_entries {
        if (!Patch20250506AddOseliaFunction_OSELIA_user_mem_get_entries.instance) {
            Patch20250506AddOseliaFunction_OSELIA_user_mem_get_entries.instance = new Patch20250506AddOseliaFunction_OSELIA_user_mem_get_entries();
        }
        return Patch20250506AddOseliaFunction_OSELIA_user_mem_get_entries.instance;
    }


    public async work(db: IDatabase<any>) {

        let user_mem_get_entries_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().user_mem_get_entries)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!user_mem_get_entries_function) {
            user_mem_get_entries_function = new GPTAssistantAPIFunctionVO();

            user_mem_get_entries_function.archived = false;
            user_mem_get_entries_function.module_function = reflect<ModuleOseliaServer>().user_mem_get_entries;
            user_mem_get_entries_function.module_name = ModuleOseliaServer.getInstance().name;
            user_mem_get_entries_function.prepend_thread_vo = true;
            user_mem_get_entries_function.gpt_function_name = reflect<ModuleOseliaServer>().user_mem_get_entries;
            user_mem_get_entries_function.json_stringify_output = false;
            user_mem_get_entries_function.gpt_function_description = "Avant de répondre à un utilisateur et pour avoir la réponse la plus adaptée à cet utilisateur, cette fonction permet de charger les entrées complètes (clé + contenu) de la mémoire liée à un utilisateur correpondantes à une regexp passée en paramètre. Sans regexp, on renvoie toutes les entrées de la mémoire utilisateur. Idéalement tenter de filtrer les clés pertinentes en amont avec la fonction get_keys. Cette mémoire a pour but de définir la relation avec l'utilisateur, comme le tutoiement/vouvoiement, le style de réponse, le ton, etc.";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(user_mem_get_entries_function);
        }

        let argument_pattern = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'pattern')
            .filter_by_id(user_mem_get_entries_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_pattern) {
            argument_pattern = new GPTAssistantAPIFunctionParamVO();
            argument_pattern.archived = false;
            argument_pattern.function_id = user_mem_get_entries_function.id;
            argument_pattern.gpt_funcparam_description = "La regexp à utiliser, ou rien pour tout charger. ^ et $ sont rajoutés automatiquement pour matcher la clé entière.";
            argument_pattern.gpt_funcparam_name = "pattern";
            argument_pattern.required = false;
            argument_pattern.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_pattern.not_in_function_params = false;
            argument_pattern.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_pattern);
        }

        let argument_user_id = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'user_id')
            .filter_by_id(user_mem_get_entries_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_user_id) {
            argument_user_id = new GPTAssistantAPIFunctionParamVO();
            argument_user_id.archived = false;
            argument_user_id.function_id = user_mem_get_entries_function.id;
            argument_user_id.gpt_funcparam_description = "Le user_id auquel est liée la mémoire.";
            argument_user_id.gpt_funcparam_name = "user_id";
            argument_user_id.required = true;
            argument_user_id.type = GPTAssistantAPIFunctionParamVO.TYPE_INTEGER;
            argument_user_id.not_in_function_params = false;
            argument_user_id.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_user_id);
        }

        let argument_asked_by = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'asked_by')
            .filter_by_id(user_mem_get_entries_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_asked_by) {
            argument_asked_by = new GPTAssistantAPIFunctionParamVO();
            argument_asked_by.archived = false;
            argument_asked_by.function_id = user_mem_get_entries_function.id;
            argument_asked_by.gpt_funcparam_description = "Qui demande à lire la mémoire ? SAME_USER: l'utilisateur dont on lit la mémoire, OSELIA: l'assistant/toi, OTHER_USER: un autre utilisateur.";
            argument_asked_by.gpt_funcparam_name = "asked_by";
            argument_asked_by.required = true;
            argument_asked_by.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_asked_by.string_enum = ['SAME_USER', 'OSELIA', 'OTHER_USER'];
            argument_asked_by.not_in_function_params = false;
            argument_asked_by.weight = 2;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_asked_by);
        }
    }
}