/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleTranslationServer from '../../../server/modules/Translation/ModuleTranslationServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250512AddOseliaFunction_OSELIA_get_langs implements IGeneratorWorker {

    private static instance: Patch20250512AddOseliaFunction_OSELIA_get_langs = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250512AddOseliaFunction_OSELIA_get_langs';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250512AddOseliaFunction_OSELIA_get_langs {
        if (!Patch20250512AddOseliaFunction_OSELIA_get_langs.instance) {
            Patch20250512AddOseliaFunction_OSELIA_get_langs.instance = new Patch20250512AddOseliaFunction_OSELIA_get_langs();
        }
        return Patch20250512AddOseliaFunction_OSELIA_get_langs.instance;
    }


    public async work(db: IDatabase<any>) {

        let get_langs = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleTranslationServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleTranslationServer>().getLangs)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!get_langs) {
            get_langs = new GPTAssistantAPIFunctionVO();

            get_langs.archived = false;
            get_langs.module_function = reflect<ModuleTranslationServer>().getLangs;
            get_langs.module_name = ModuleTranslationServer.getInstance().name;
            get_langs.prepend_thread_vo = false;
            get_langs.gpt_function_name = reflect<ModuleTranslationServer>().getLangs;
            get_langs.json_stringify_output = true;
            get_langs.gpt_function_description = "Pour récupérer la liste des langues disponibles dans l'application. Renvoie un tableau de LangVO qui ont les champs id, code_lang, code_flag, code_phone.";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(get_langs);
        }
    }
}