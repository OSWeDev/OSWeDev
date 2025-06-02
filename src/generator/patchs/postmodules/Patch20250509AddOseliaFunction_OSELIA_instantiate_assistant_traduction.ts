/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250509AddOseliaFunction_OSELIA_instantiate_assistant_traduction implements IGeneratorWorker {

    private static instance: Patch20250509AddOseliaFunction_OSELIA_instantiate_assistant_traduction = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250509AddOseliaFunction_OSELIA_instantiate_assistant_traduction';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250509AddOseliaFunction_OSELIA_instantiate_assistant_traduction {
        if (!Patch20250509AddOseliaFunction_OSELIA_instantiate_assistant_traduction.instance) {
            Patch20250509AddOseliaFunction_OSELIA_instantiate_assistant_traduction.instance = new Patch20250509AddOseliaFunction_OSELIA_instantiate_assistant_traduction();
        }
        return Patch20250509AddOseliaFunction_OSELIA_instantiate_assistant_traduction.instance;
    }

    public async work(db: IDatabase<any>) {

        let instantiate_assistant_traduction = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().instantiate_assistant_traduction)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!instantiate_assistant_traduction) {
            instantiate_assistant_traduction = new GPTAssistantAPIFunctionVO();

            instantiate_assistant_traduction.archived = false;
            instantiate_assistant_traduction.module_function = reflect<ModuleOseliaServer>().instantiate_assistant_traduction;
            instantiate_assistant_traduction.module_name = ModuleOseliaServer.getInstance().name;
            instantiate_assistant_traduction.prepend_thread_vo = true;
            instantiate_assistant_traduction.gpt_function_name = reflect<ModuleOseliaServer>().instantiate_assistant_traduction;
            instantiate_assistant_traduction.json_stringify_output = false;
            instantiate_assistant_traduction.gpt_function_description = "Fonction pour demander à un agent de traduire un texte dans une autre langue. La fonction renvoie un thread_id qui identifie la discussion dans laquelle l'agent a été instancié. Toutes les discussions du nouveau thread seront dupliquées/pipe dans ce thread, et identifiées par le thread_id. Cela te permettra de suivre l'avancement / les questions / la résolution de chaque demande de traduction.";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(instantiate_assistant_traduction);
        }

        let argument_code_text_a_traduire = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'code_text_a_traduire')
            .filter_by_id(instantiate_assistant_traduction.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_code_text_a_traduire) {
            argument_code_text_a_traduire = new GPTAssistantAPIFunctionParamVO();
            argument_code_text_a_traduire.archived = false;
            argument_code_text_a_traduire.function_id = instantiate_assistant_traduction.id;
            argument_code_text_a_traduire.gpt_funcparam_description = "Le code text que l'on souhaite traduire.";
            argument_code_text_a_traduire.gpt_funcparam_name = "code_text_a_traduire";
            argument_code_text_a_traduire.required = true;
            argument_code_text_a_traduire.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_code_text_a_traduire.not_in_function_params = false;
            argument_code_text_a_traduire.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_code_text_a_traduire);
        }

        let argument_code_lang = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'code_lang')
            .filter_by_id(instantiate_assistant_traduction.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_code_lang) {
            argument_code_lang = new GPTAssistantAPIFunctionParamVO();
            argument_code_lang.archived = false;
            argument_code_lang.function_id = instantiate_assistant_traduction.id;
            argument_code_lang.gpt_funcparam_description = "Le code de la langue dans laquelle on souhaite traduire.";
            argument_code_lang.gpt_funcparam_name = "code_lang";
            argument_code_lang.required = true;
            argument_code_lang.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_code_lang.not_in_function_params = false;
            argument_code_lang.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_code_lang);
        }

        let argument_commentaire = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'commentaire')
            .filter_by_id(instantiate_assistant_traduction.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_commentaire) {
            argument_commentaire = new GPTAssistantAPIFunctionParamVO();
            argument_commentaire.archived = false;
            argument_commentaire.function_id = instantiate_assistant_traduction.id;
            argument_commentaire.gpt_funcparam_description = "Un commentaire qui sera ajouté au prompt habituel de l'agent pour spécifier un complément d'informations spécifique à cette demande, si cela est pertinent et justifié.";
            argument_commentaire.gpt_funcparam_name = "commentaire";
            argument_commentaire.required = false;
            argument_commentaire.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_commentaire.not_in_function_params = false;
            argument_commentaire.weight = 2;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_commentaire);
        }
    }
}