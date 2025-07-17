import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import OseliaRunTemplateVO from "../../../shared/modules/Oselia/vos/OseliaRunTemplateVO";
import { field_names } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";
import GPTAssistantAPIAssistantVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO";
import ModuleOselia from "../../../shared/modules/Oselia/ModuleOselia";


export default class Patch20250716AddOseliaRunTemplate_SessionRealtime implements IGeneratorWorker {

    private static instance: Patch20250716AddOseliaRunTemplate_SessionRealtime = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250716AddOseliaRunTemplate_SessionRealtime';
    }

    public static getInstance(): Patch20250716AddOseliaRunTemplate_SessionRealtime {
        if (!Patch20250716AddOseliaRunTemplate_SessionRealtime.instance) {
            Patch20250716AddOseliaRunTemplate_SessionRealtime.instance = new Patch20250716AddOseliaRunTemplate_SessionRealtime();
        }
        return Patch20250716AddOseliaRunTemplate_SessionRealtime.instance;
    }

    public async work(db: IDatabase<unknown>) {
        // On ajoute au besoin le run template pour les questions à l'assistant
        let run_template: OseliaRunTemplateVO = await query(OseliaRunTemplateVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaRunTemplateVO>().name, OseliaRunTemplateVO.NEW_SESSION_OSELIA_RUN_TEMPLATE)
            .exec_as_server()
            .select_vo<OseliaRunTemplateVO>();

        if (!run_template) {
            run_template = new OseliaRunTemplateVO();
            run_template.name = OseliaRunTemplateVO.NEW_SESSION_OSELIA_RUN_TEMPLATE;
            run_template.initial_content_text = null;
            run_template.hide_prompt = true;
            run_template.hide_outputs = true;
            run_template.use_validator = true;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(run_template);
        }
    }
}