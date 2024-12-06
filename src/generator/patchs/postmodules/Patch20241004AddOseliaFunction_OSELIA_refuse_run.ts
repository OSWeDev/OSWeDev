/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';

export default class Patch20241004AddOseliaFunction_OSELIA_refuse_run implements IGeneratorWorker {

    private static instance: Patch20241004AddOseliaFunction_OSELIA_refuse_run = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20241004AddOseliaFunction_OSELIA_refuse_run';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20241004AddOseliaFunction_OSELIA_refuse_run {
        if (!Patch20241004AddOseliaFunction_OSELIA_refuse_run.instance) {
            Patch20241004AddOseliaFunction_OSELIA_refuse_run.instance = new Patch20241004AddOseliaFunction_OSELIA_refuse_run();
        }
        return Patch20241004AddOseliaFunction_OSELIA_refuse_run.instance;
    }

    public async work(db: IDatabase<any>) {

        let refuse_run_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().refuse_oselia_run)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!refuse_run_function) {
            refuse_run_function = new GPTAssistantAPIFunctionVO();

            refuse_run_function.archived = false;
            refuse_run_function.module_function = reflect<ModuleOseliaServer>().refuse_oselia_run;
            refuse_run_function.module_name = ModuleOseliaServer.getInstance().name;
            refuse_run_function.prepend_thread_vo = true;
            refuse_run_function.gpt_function_name = 'refuse_oselia_run';
            refuse_run_function.json_stringify_output = false;
            refuse_run_function.gpt_function_description = "Refuser l\'étape actuelle d\'un run Osélia et demande une correction";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(refuse_run_function);
        }

        //  * @param rerun_reason la raison du rerun - version longue
        //         * @param rerun_name le nom du rerun - la raison en très court
        //             * @param rerun_new_initial_prompt le nouveau prompt qui permettra de corriger le run

        let argument_rerun_reason = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'rerun_reason')
            .filter_by_id(refuse_run_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_rerun_reason) {
            argument_rerun_reason = new GPTAssistantAPIFunctionParamVO();
            argument_rerun_reason.archived = false;
            argument_rerun_reason.function_id = refuse_run_function.id;
            argument_rerun_reason.gpt_funcparam_description = "La raison du refus - synthétique pour l'utilisateur s'il le souhaite";
            argument_rerun_reason.gpt_funcparam_name = "rerun_reason";
            argument_rerun_reason.required = true;
            argument_rerun_reason.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_rerun_reason.not_in_function_params = false;
            argument_rerun_reason.weight = 0;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_rerun_reason);
        }

        let argument_rerun_name = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'rerun_name')
            .filter_by_id(refuse_run_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_rerun_name) {
            argument_rerun_name = new GPTAssistantAPIFunctionParamVO();
            argument_rerun_name.archived = false;
            argument_rerun_name.function_id = refuse_run_function.id;
            argument_rerun_name.gpt_funcparam_description = "Le nom utilisé pour la prochaine exécution de l'assistant - 2 ou 3 mots max - pour affichage dans l'interface";
            argument_rerun_name.gpt_funcparam_name = "rerun_name";
            argument_rerun_name.required = true;
            argument_rerun_name.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_rerun_name.not_in_function_params = false;
            argument_rerun_name.weight = 1;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_rerun_name);
        }

        let argument_rerun_new_initial_prompt = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'rerun_new_initial_prompt')
            .filter_by_id(refuse_run_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_rerun_new_initial_prompt) {
            argument_rerun_new_initial_prompt = new GPTAssistantAPIFunctionParamVO();
            argument_rerun_new_initial_prompt.archived = false;
            argument_rerun_new_initial_prompt.function_id = refuse_run_function.id;
            argument_rerun_new_initial_prompt.gpt_funcparam_description = "Le prompt qui sera donné à l'assistant pour l'inciter à corriger le problème identifié";
            argument_rerun_new_initial_prompt.gpt_funcparam_name = "rerun_new_initial_prompt";
            argument_rerun_new_initial_prompt.required = true;
            argument_rerun_new_initial_prompt.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_rerun_new_initial_prompt.not_in_function_params = false;
            argument_rerun_new_initial_prompt.weight = 2;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(argument_rerun_new_initial_prompt);
        }
    }
}