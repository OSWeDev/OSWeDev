import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import AssistantTraductionCronWorker from '../../../server/modules/Translation/workers/AssistantTraduction/AssistantTraductionCronWorker';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import OseliaPromptVO from '../../../shared/modules/Oselia/vos/OseliaPromptVO';
import OseliaRunTemplateVO from '../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../shared/modules/Oselia/vos/OseliaRunVO';
import { field_names } from '../../../shared/tools/ObjectHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250505AddOseliaRunTemplate_AssistantTraduction implements IGeneratorWorker {


    private static instance: Patch20250505AddOseliaRunTemplate_AssistantTraduction = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250505AddOseliaRunTemplate_AssistantTraduction';
    }

    public static getInstance(): Patch20250505AddOseliaRunTemplate_AssistantTraduction {
        if (!Patch20250505AddOseliaRunTemplate_AssistantTraduction.instance) {
            Patch20250505AddOseliaRunTemplate_AssistantTraduction.instance = new Patch20250505AddOseliaRunTemplate_AssistantTraduction();
        }
        return Patch20250505AddOseliaRunTemplate_AssistantTraduction.instance;
    }

    public async work(db: IDatabase<unknown>) {

        let oselia_run_template = await query(OseliaRunTemplateVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaRunTemplateVO>().template_name, AssistantTraductionCronWorker.OSELIA_RUN_TEMPLATE_NAME)
            .exec_as_server()
            .select_vo<OseliaRunTemplateVO>();

        if (oselia_run_template) {
            // Si le template existe déjà, on ne fait rien
            return;
        }

        const prompt = await query(OseliaPromptVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaPromptVO>().name, AssistantTraductionCronWorker.OSELIA_assistant_traduction_PROMPT_NAME)
            .exec_as_server()
            .select_vo<OseliaPromptVO>();

        if (!prompt) {
            throw new Error('Patch20250505AddOseliaRunTemplate_AssistantTraduction: Prompt not found: ' + AssistantTraductionCronWorker.OSELIA_assistant_traduction_PROMPT_NAME);
        }

        oselia_run_template = new OseliaRunTemplateVO();
        oselia_run_template.template_name = AssistantTraductionCronWorker.OSELIA_RUN_TEMPLATE_NAME;
        oselia_run_template.name = "Récolte d'informations pour l'assistant traduction";
        oselia_run_template.initial_prompt_id = prompt.id;
        oselia_run_template.assistant_id = prompt.default_assistant_id;
        oselia_run_template.childrens_are_multithreaded = false;
        oselia_run_template.hide_outputs = false;
        oselia_run_template.hide_prompt = false;
        oselia_run_template.oselia_thread_default_assistant_id = prompt.default_assistant_id;
        oselia_run_template.run_type = OseliaRunVO.RUN_TYPE_ASSISTANT;
        oselia_run_template.state = OseliaRunVO.STATE_TODO;
        oselia_run_template.thread_title = "Assistant Traduction [%%VAR%%missing_elt_id%%] %%VAR%%code_lang%% - %%VAR%%code_text%%";
        oselia_run_template.use_splitter = false;
        oselia_run_template.use_validator = false;

        await ModuleDAOServer.instance.insertOrUpdateVO_as_server(oselia_run_template);
    }
}