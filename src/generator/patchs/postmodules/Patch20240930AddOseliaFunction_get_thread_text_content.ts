import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import ModuleOseliaServer from "../../../server/modules/Oselia/ModuleOseliaServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import GPTAssistantAPIFunctionParamVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO";
import GPTAssistantAPIFunctionVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO";
import { field_names, reflect } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20240930AddOseliaFunction_get_thread_text_content implements IGeneratorWorker {

    private static instance: Patch20240930AddOseliaFunction_get_thread_text_content = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20240930AddOseliaFunction_get_thread_text_content';
    }

    public static getInstance(): Patch20240930AddOseliaFunction_get_thread_text_content {
        if (!Patch20240930AddOseliaFunction_get_thread_text_content.instance) {
            Patch20240930AddOseliaFunction_get_thread_text_content.instance = new Patch20240930AddOseliaFunction_get_thread_text_content();
        }
        return Patch20240930AddOseliaFunction_get_thread_text_content.instance;
    }

    public async work(db: IDatabase<unknown>) {
        const gpt_function_name: string = ModuleOseliaServer.getInstance().name + '__' + reflect<ModuleOseliaServer>().get_thread_text_content;
        let func: GPTAssistantAPIFunctionVO = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<GPTAssistantAPIFunctionVO>().gpt_function_name, gpt_function_name)
            .exec_as_server()
            .select_vo<GPTAssistantAPIFunctionVO>();

        if (!!func) {
            return;
        }

        func = new GPTAssistantAPIFunctionVO();
        func.gpt_function_description = 'Obtenir le contenu d\'un thread/discussion avec Osélia au format texte';
        func.gpt_function_name = gpt_function_name;
        func.module_name = ModuleOseliaServer.getInstance().name;
        func.module_function = reflect<ModuleOseliaServer>().get_thread_text_content as string;
        func.prepend_thread_vo = false;
        func.use_promise_pipeline = false;
        func.json_stringify_output = false;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(func);

        await this.create_params_description_if_not_exists(func);
    }

    public async create_params_description_if_not_exists(func: GPTAssistantAPIFunctionVO) {
        // thread_vo_id: number,
        const thread_vo_id_param: GPTAssistantAPIFunctionParamVO = new GPTAssistantAPIFunctionParamVO();
        thread_vo_id_param.gpt_funcparam_name = 'thread_vo_id';
        thread_vo_id_param.gpt_funcparam_description = 'L\'identifiant unique du thread/discussion dont on veut obtenir le contenu au format texte';
        thread_vo_id_param.function_id = func.id;
        thread_vo_id_param.type = GPTAssistantAPIFunctionParamVO.TYPE_NUMBER;
        thread_vo_id_param.required = true;
        thread_vo_id_param.weight = 0;
        thread_vo_id_param.default_json_value = null;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(thread_vo_id_param);
    }
}