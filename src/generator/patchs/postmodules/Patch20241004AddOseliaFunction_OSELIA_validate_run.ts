/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleOseliaServer from '../../../server/modules/Oselia/ModuleOseliaServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20241004AddOseliaFunction_OSELIA_validate_run implements IGeneratorWorker {

    private static instance: Patch20241004AddOseliaFunction_OSELIA_validate_run = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20241004AddOseliaFunction_OSELIA_validate_run';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20241004AddOseliaFunction_OSELIA_validate_run {
        if (!Patch20241004AddOseliaFunction_OSELIA_validate_run.instance) {
            Patch20241004AddOseliaFunction_OSELIA_validate_run.instance = new Patch20241004AddOseliaFunction_OSELIA_validate_run();
        }
        return Patch20241004AddOseliaFunction_OSELIA_validate_run.instance;
    }

    public async work(db: IDatabase<any>) {

        let validate_run_function = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_name, ModuleOseliaServer.getInstance().name)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().module_function, reflect<ModuleOseliaServer>().validate_oselia_run)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();
        if (!validate_run_function) {
            validate_run_function = new GPTAssistantAPIFunctionVO();

            validate_run_function.archived = false;
            validate_run_function.module_function = reflect<ModuleOseliaServer>().validate_oselia_run;
            validate_run_function.module_name = ModuleOseliaServer.getInstance().name;
            validate_run_function.prepend_thread_vo = true;
            validate_run_function.gpt_function_name = 'validate_oselia_run';
            validate_run_function.json_stringify_output = false;
            validate_run_function.gpt_function_description = "Valider l\'étape actuelle d\'un run Osélia";
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(validate_run_function);
        }
    }
}