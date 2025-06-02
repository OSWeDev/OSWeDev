/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250509AddOseliaFunction_OSELIA_get_codes_that_need_translation implements IGeneratorWorker {

    private static instance: Patch20250509AddOseliaFunction_OSELIA_get_codes_that_need_translation = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250509AddOseliaFunction_OSELIA_get_codes_that_need_translation';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250509AddOseliaFunction_OSELIA_get_codes_that_need_translation {
        if (!Patch20250509AddOseliaFunction_OSELIA_get_codes_that_need_translation.instance) {
            Patch20250509AddOseliaFunction_OSELIA_get_codes_that_need_translation.instance = new Patch20250509AddOseliaFunction_OSELIA_get_codes_that_need_translation();
        }
        return Patch20250509AddOseliaFunction_OSELIA_get_codes_that_need_translation.instance;
    }

    public async work(db: IDatabase<any>) {

        let get_codes_that_need_translation = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().get_codes_that_need_translation)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!get_codes_that_need_translation) {
            get_codes_that_need_translation = new GPTAssistantAPIFunctionVO();

            get_codes_that_need_translation.archived = false;
            get_codes_that_need_translation.module_function = reflect<ModuleOseliaServer>().get_codes_that_need_translation;
            get_codes_that_need_translation.module_name = ModuleOseliaServer.getInstance().name;
            get_codes_that_need_translation.prepend_thread_vo = true;
            get_codes_that_need_translation.gpt_function_name = reflect<ModuleOseliaServer>().get_codes_that_need_translation;
            get_codes_that_need_translation.json_stringify_output = false;
            get_codes_that_need_translation.gpt_function_description = "Fonction de recherche de traductions manquantes pour un code de langue donné et un pattern/regexp. La fonction renvoie les codes texts des traductions à réaliser, dans la limite de 100 codes par demande.";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(get_codes_that_need_translation);
        }

        let argument_pattern = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'pattern')
            .filter_by_id(get_codes_that_need_translation.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_pattern) {
            argument_pattern = new GPTAssistantAPIFunctionParamVO();
            argument_pattern.archived = false;
            argument_pattern.function_id = get_codes_that_need_translation.id;
            argument_pattern.gpt_funcparam_description = "La regexp à utiliser, ou rien pour tout charger. ^ et $ sont rajoutés automatiquement pour matcher la clé entière.";
            argument_pattern.gpt_funcparam_name = "pattern";
            argument_pattern.required = false;
            argument_pattern.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_pattern.not_in_function_params = false;
            argument_pattern.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_pattern);
        }

        let argument_code_lang = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'code_lang')
            .filter_by_id(get_codes_that_need_translation.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_code_lang) {
            argument_code_lang = new GPTAssistantAPIFunctionParamVO();
            argument_code_lang.archived = false;
            argument_code_lang.function_id = get_codes_that_need_translation.id;
            argument_code_lang.gpt_funcparam_description = "Le code de la langue dans laquelle on recherche des traductions manquantes.";
            argument_code_lang.gpt_funcparam_name = "code_lang";
            argument_code_lang.required = true;
            argument_code_lang.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_code_lang.not_in_function_params = false;
            argument_code_lang.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_code_lang);
        }
    }
}