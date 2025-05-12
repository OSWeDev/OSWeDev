/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250506AddOseliaFunction_OSELIA_app_mem_set_mem implements IGeneratorWorker {

    private static instance: Patch20250506AddOseliaFunction_OSELIA_app_mem_set_mem = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250506AddOseliaFunction_OSELIA_app_mem_set_mem';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250506AddOseliaFunction_OSELIA_app_mem_set_mem {
        if (!Patch20250506AddOseliaFunction_OSELIA_app_mem_set_mem.instance) {
            Patch20250506AddOseliaFunction_OSELIA_app_mem_set_mem.instance = new Patch20250506AddOseliaFunction_OSELIA_app_mem_set_mem();
        }
        return Patch20250506AddOseliaFunction_OSELIA_app_mem_set_mem.instance;
    }


    public async work(db: IDatabase<any>) {

        let app_mem_set_mem = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().app_mem_set_mem)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!app_mem_set_mem) {
            app_mem_set_mem = new GPTAssistantAPIFunctionVO();

            app_mem_set_mem.archived = false;
            app_mem_set_mem.module_function = reflect<ModuleOseliaServer>().app_mem_set_mem;
            app_mem_set_mem.module_name = ModuleOseliaServer.getInstance().name;
            app_mem_set_mem.prepend_thread_vo = true;
            app_mem_set_mem.gpt_function_name = reflect<ModuleOseliaServer>().app_mem_set_mem;
            app_mem_set_mem.json_stringify_output = false;
            app_mem_set_mem.gpt_function_description = "Fonction de mise à jour ou d'ajout d'informations utiles sur l'application. Cette mémoire a pour but de permettre à l'assistant de comprendre la solution pour laquelle il travaille, en particulier le langage métier, la typologie de clients et de produits, les spécificités de l'entreprise, etc... Elle est très majoritairement à l'initiative de l'utilisateur (plutôt qu'une initiative de l'assistant).";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(app_mem_set_mem);
        }

        let argument_key = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'key')
            .filter_by_id(app_mem_set_mem.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_key) {
            argument_key = new GPTAssistantAPIFunctionParamVO();
            argument_key.archived = false;
            argument_key.function_id = app_mem_set_mem.id;
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
            .filter_by_id(app_mem_set_mem.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_value) {
            argument_value = new GPTAssistantAPIFunctionParamVO();
            argument_value.archived = false;
            argument_value.function_id = app_mem_set_mem.id;
            argument_value.gpt_funcparam_description = "La valeur/le contenu de l'entrée de mémoire.";
            argument_value.gpt_funcparam_name = "value";
            argument_value.required = true;
            argument_value.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_value.not_in_function_params = false;
            argument_value.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_value);
        }
    }
}