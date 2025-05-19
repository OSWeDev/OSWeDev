import { IDatabase } from "pg-promise";
import ModuleDAOServer from "../../../server/modules/DAO/ModuleDAOServer";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import OseliaRunTemplateVO from "../../../shared/modules/Oselia/vos/OseliaRunTemplateVO";
import { field_names } from "../../../shared/tools/ObjectHandler";
import IGeneratorWorker from "../../IGeneratorWorker";


export default class Patch20250512AddOseliaRunTemplate_NewDatasForSupervisor implements IGeneratorWorker {

    private static instance: Patch20250512AddOseliaRunTemplate_NewDatasForSupervisor = null;

    private constructor() { }

    get uid(): string {
        return 'Patch20250512AddOseliaRunTemplate_NewDatasForSupervisor';
    }

    public static getInstance(): Patch20250512AddOseliaRunTemplate_NewDatasForSupervisor {
        if (!Patch20250512AddOseliaRunTemplate_NewDatasForSupervisor.instance) {
            Patch20250512AddOseliaRunTemplate_NewDatasForSupervisor.instance = new Patch20250512AddOseliaRunTemplate_NewDatasForSupervisor();
        }
        return Patch20250512AddOseliaRunTemplate_NewDatasForSupervisor.instance;
    }

    public async work(db: IDatabase<unknown>) {
        // On ajoute au besoin le run template pour les questions à l'assistant

        let run_template: OseliaRunTemplateVO = await query(OseliaRunTemplateVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaRunTemplateVO>().name, OseliaRunTemplateVO.NEW_DATA_FOR_SUPERVISOR_OSELIA_RUN_TEMPLATE)
            .exec_as_server()
            .select_vo<OseliaRunTemplateVO>();

        if (!run_template) {
            run_template = new OseliaRunTemplateVO();
            run_template.name = OseliaRunTemplateVO.NEW_DATA_FOR_SUPERVISOR_OSELIA_RUN_TEMPLATE;
            run_template.initial_content_text = "De nouvelles infos sont arrivées de tes threads supervisés. Vois si il y a des informations pertinentes à transmettre à l'utilisateur, des actions à réaliser, ou si tu continues simplement d'attendre les prochaines infos.";
            run_template.hide_prompt = true;
            run_template.hide_outputs = true;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(run_template);
        }
    }
}