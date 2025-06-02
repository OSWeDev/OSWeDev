import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import OseliaRunTemplateVO from "../../../shared/modules/Oselia/vos/OseliaRunTemplateVO";
import { field_names } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250512AddOseliaRunTemplate_AskAssistant implements IGeneratorWorker {

    private static instance: Patch20250512AddOseliaRunTemplate_AskAssistant = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250512AddOseliaRunTemplate_AskAssistant';
    }

    public static getInstance(): Patch20250512AddOseliaRunTemplate_AskAssistant {
        if (!Patch20250512AddOseliaRunTemplate_AskAssistant.instance) {
            Patch20250512AddOseliaRunTemplate_AskAssistant.instance = new Patch20250512AddOseliaRunTemplate_AskAssistant();
        }
        return Patch20250512AddOseliaRunTemplate_AskAssistant.instance;
    }

    public async work(db: IDatabase<unknown>) {
        // On ajoute au besoin le run template pour les questions à l'assistant

        let run_template: OseliaRunTemplateVO = await query(OseliaRunTemplateVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaRunTemplateVO>().name, OseliaRunTemplateVO.ASK_ASSISTANT_OSELIA_RUN_TEMPLATE)
            .exec_as_server()
            .select_vo<OseliaRunTemplateVO>();

        if (!run_template) {
            run_template = new OseliaRunTemplateVO();
            run_template.name = OseliaRunTemplateVO.ASK_ASSISTANT_OSELIA_RUN_TEMPLATE;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(run_template);
        }
    }
}