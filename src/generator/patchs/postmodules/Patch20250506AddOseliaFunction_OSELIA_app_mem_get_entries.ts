/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250506AddOseliaFunction_OSELIA_app_mem_get_entries implements IGeneratorWorker {

    private static instance: Patch20250506AddOseliaFunction_OSELIA_app_mem_get_entries = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250506AddOseliaFunction_OSELIA_app_mem_get_entries';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250506AddOseliaFunction_OSELIA_app_mem_get_entries {
        if (!Patch20250506AddOseliaFunction_OSELIA_app_mem_get_entries.instance) {
            Patch20250506AddOseliaFunction_OSELIA_app_mem_get_entries.instance = new Patch20250506AddOseliaFunction_OSELIA_app_mem_get_entries();
        }
        return Patch20250506AddOseliaFunction_OSELIA_app_mem_get_entries.instance;
    }


    public async work(db: IDatabase<any>) {

        let app_mem_get_entries_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().app_mem_get_entries)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!app_mem_get_entries_function) {
            app_mem_get_entries_function = new GPTAssistantAPIFunctionVO();

            app_mem_get_entries_function.archived = false;
            app_mem_get_entries_function.module_function = reflect<ModuleOseliaServer>().app_mem_get_entries;
            app_mem_get_entries_function.module_name = ModuleOseliaServer.getInstance().name;
            app_mem_get_entries_function.prepend_thread_vo = true;
            app_mem_get_entries_function.gpt_function_name = reflect<ModuleOseliaServer>().app_mem_get_entries;
            app_mem_get_entries_function.json_stringify_output = false;
            app_mem_get_entries_function.gpt_function_description = "Pour comprendre dans quel contexte l'assistant/agent est exécuté, pour connaître la typologie de la solution Web, du client, des produits, ... les langage métier, ... cette fonction permet de charger les entrées de la mémoire globale à l'application correpondantes à une regexp passée en paramètre. Sans regexp, on renvoie toutes les entrées de la mémoire applicative. Idéalement tenter de filtrer les clés pertinentes en amont avec la fonction get_keys.";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(app_mem_get_entries_function);
        }

        let argument_pattern = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'pattern')
            .filter_by_id(app_mem_get_entries_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_pattern) {
            argument_pattern = new GPTAssistantAPIFunctionParamVO();
            argument_pattern.archived = false;
            argument_pattern.function_id = app_mem_get_entries_function.id;
            argument_pattern.gpt_funcparam_description = "La regexp à utiliser, ou rien pour tout charger. ^ et $ sont rajoutés automatiquement pour matcher la clé entière.";
            argument_pattern.gpt_funcparam_name = "pattern";
            argument_pattern.required = false;
            argument_pattern.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_pattern.not_in_function_params = false;
            argument_pattern.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_pattern);
        }
    }
}