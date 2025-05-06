/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250506AddOseliaFunction_OSELIA_agent_mem_set_mem implements IGeneratorWorker {

    private static instance: Patch20250506AddOseliaFunction_OSELIA_agent_mem_set_mem = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250506AddOseliaFunction_OSELIA_agent_mem_set_mem';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250506AddOseliaFunction_OSELIA_agent_mem_set_mem {
        if (!Patch20250506AddOseliaFunction_OSELIA_agent_mem_set_mem.instance) {
            Patch20250506AddOseliaFunction_OSELIA_agent_mem_set_mem.instance = new Patch20250506AddOseliaFunction_OSELIA_agent_mem_set_mem();
        }
        return Patch20250506AddOseliaFunction_OSELIA_agent_mem_set_mem.instance;
    }


    public async work(db: IDatabase<any>) {

        let agent_mem_set_mem = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().agent_mem_set_mem)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!agent_mem_set_mem) {
            agent_mem_set_mem = new GPTAssistantAPIFunctionVO();

            agent_mem_set_mem.archived = false;
            agent_mem_set_mem.module_function = reflect<ModuleOseliaServer>().agent_mem_set_mem;
            agent_mem_set_mem.module_name = ModuleOseliaServer.getInstance().name;
            agent_mem_set_mem.prepend_thread_vo = true;
            agent_mem_set_mem.gpt_function_name = reflect<ModuleOseliaServer>().agent_mem_set_mem;
            agent_mem_set_mem.json_stringify_output = false;
            agent_mem_set_mem.gpt_function_description = "Fonction de mise à jour ou d'ajout d'informations utiles à l'assistant/agent pour réaliser sa tâche. Cette mémoire a pour but de permettre à l'assistant de se souvenir des éléments liés à son propre fonctionnement, des informations utiles par exemple pour effectuer la tâche demandée. Il s'agit d'une mémoire persistante entre les différentes sessions de l'assistant. Si tu -assistant/agent- sens que la discussion en cours contient une information qui serait très utile à un futur appel au même assistant/agent et qui tu le penses permettrait de manière générale de répondre mieux à la tâche décrite par ton prompt d'assistant, alors tu dois la stocker en mémoire si cette information n'y est pas déjà.";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(agent_mem_set_mem);
        }

        let argument_key = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'key')
            .filter_by_id(agent_mem_set_mem.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_key) {
            argument_key = new GPTAssistantAPIFunctionParamVO();
            argument_key.archived = false;
            argument_key.function_id = agent_mem_set_mem.id;
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
            .filter_by_id(agent_mem_set_mem.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_value) {
            argument_value = new GPTAssistantAPIFunctionParamVO();
            argument_value.archived = false;
            argument_value.function_id = agent_mem_set_mem.id;
            argument_value.gpt_funcparam_description = "La valeur/le contenu de l'entrée de mémoire. Le contenu doit être utile, vrai, pertinent et si possible positif.";
            argument_value.gpt_funcparam_name = "value";
            argument_value.required = true;
            argument_value.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_value.not_in_function_params = false;
            argument_value.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_value);
        }
    }
}