/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionParamVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20241004AddOseliaFunction_OSELIA_append_new_child_run_step implements IGeneratorWorker {

    private static instance: Patch20241004AddOseliaFunction_OSELIA_append_new_child_run_step = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20241004AddOseliaFunction_OSELIA_append_new_child_run_step';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20241004AddOseliaFunction_OSELIA_append_new_child_run_step {
        if (!Patch20241004AddOseliaFunction_OSELIA_append_new_child_run_step.instance) {
            Patch20241004AddOseliaFunction_OSELIA_append_new_child_run_step.instance = new Patch20241004AddOseliaFunction_OSELIA_append_new_child_run_step();
        }
        return Patch20241004AddOseliaFunction_OSELIA_append_new_child_run_step.instance;
    }

    public async work(db: IDatabase<any>) {

        let append_new_child_run_step_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().append_new_child_run_step)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!append_new_child_run_step_function) {
            append_new_child_run_step_function = new GPTAssistantAPIFunctionVO();

            append_new_child_run_step_function.archived = false;
            append_new_child_run_step_function.module_function = reflect<ModuleOseliaServer>().append_new_child_run_step;
            append_new_child_run_step_function.module_name = ModuleOseliaServer.getInstance().name;
            append_new_child_run_step_function.prepend_thread_vo = true;
            append_new_child_run_step_function.gpt_function_name = 'append_new_child_run_step';
            append_new_child_run_step_function.json_stringify_output = false;
            append_new_child_run_step_function.gpt_function_description = "Ajouter une étape enfant au run Osélia en cours pour découper le travail en sous-étapes";
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(append_new_child_run_step_function);
        }

        //  * @param name le nom de la tâche
        //         * @param prompt le prompt de la tâche
        //             * @param weight le poids de la tâche - pour l'ordre d'exécution
        //                 * @param use_validator si la tâche doit être validée automatiquement - par défaut non pour le moment
        //                     * @param hide_outputs si les sorties doivent être cachées - par défaut non pour le moment
        let argument_name = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'name')
            .filter_by_id(append_new_child_run_step_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_name) {
            argument_name = new GPTAssistantAPIFunctionParamVO();
            argument_name.archived = false;
            argument_name.function_id = append_new_child_run_step_function.id;
            argument_name.gpt_funcparam_description = "Le nom de la tâche - 2 ou 3 mots max - pour affichage dans l'interface";
            argument_name.gpt_funcparam_name = "name";
            argument_name.required = true;
            argument_name.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_name.not_in_function_params = false;
            argument_name.weight = 0;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_name);
        }

        let argument_prompt = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'prompt')
            .filter_by_id(append_new_child_run_step_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_prompt) {
            argument_prompt = new GPTAssistantAPIFunctionParamVO();
            argument_prompt.archived = false;
            argument_prompt.function_id = append_new_child_run_step_function.id;
            argument_prompt.gpt_funcparam_description = "Le prompt utilisé pour l'assistant pour cette sous-tâche";
            argument_prompt.gpt_funcparam_name = "prompt";
            argument_prompt.required = true;
            argument_prompt.type = GPTAssistantAPIFunctionParamVO.TYPE_STRING;
            argument_prompt.not_in_function_params = false;
            argument_prompt.weight = 1;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_prompt);
        }

        let argument_weight = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'weight')
            .filter_by_id(append_new_child_run_step_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_weight) {
            argument_weight = new GPTAssistantAPIFunctionParamVO();
            argument_weight.archived = false;
            argument_weight.function_id = append_new_child_run_step_function.id;
            argument_weight.gpt_funcparam_description = "Le poids de cette tâche - pour l'ordre d'exécution - de 0 à x - 0 étant la première tâche à exécuter";
            argument_weight.gpt_funcparam_name = "weight";
            argument_weight.required = true;
            argument_weight.type = GPTAssistantAPIFunctionParamVO.TYPE_INTEGER;
            argument_weight.not_in_function_params = false;
            argument_weight.weight = 2;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_weight);
        }

        let argument_use_validator = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'use_validator')
            .filter_by_id(append_new_child_run_step_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_use_validator) {
            argument_use_validator = new GPTAssistantAPIFunctionParamVO();
            argument_use_validator.archived = false;
            argument_use_validator.function_id = append_new_child_run_step_function.id;
            argument_use_validator.gpt_funcparam_description = "Est-ce que la tâche doit être validée automatiquement";
            argument_use_validator.gpt_funcparam_name = "use_validator";
            argument_use_validator.required = true;
            argument_use_validator.type = GPTAssistantAPIFunctionParamVO.TYPE_BOOLEAN;
            argument_use_validator.not_in_function_params = false;
            argument_use_validator.weight = 3;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_use_validator);
        }

        let argument_hide_outputs = await query(GPTAssistantAPIFunctionParamVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionParamVO>().gpt_funcparam_name, 'hide_outputs')
            .filter_by_id(append_new_child_run_step_function.id, GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionParamVO>();
        if (!argument_hide_outputs) {
            argument_hide_outputs = new GPTAssistantAPIFunctionParamVO();
            argument_hide_outputs.archived = false;
            argument_hide_outputs.function_id = append_new_child_run_step_function.id;
            argument_hide_outputs.gpt_funcparam_description = "Est-ce que les messages de l'assistant doivent être cachés dans l'interface utilisateur pour cette tâche ? (réflexion interne)";
            argument_hide_outputs.gpt_funcparam_name = "hide_outputs";
            argument_hide_outputs.required = true;
            argument_hide_outputs.type = GPTAssistantAPIFunctionParamVO.TYPE_BOOLEAN;
            argument_hide_outputs.not_in_function_params = false;
            argument_hide_outputs.weight = 4;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(argument_hide_outputs);
        }
    }
}