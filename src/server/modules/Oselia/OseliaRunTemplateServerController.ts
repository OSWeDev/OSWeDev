import { Thread } from 'openai/resources/beta/threads/threads';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FileVO from '../../../shared/modules/File/vos/FileVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import GPTAssistantAPIAssistantVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import OseliaPromptVO from '../../../shared/modules/Oselia/vos/OseliaPromptVO';
import OseliaRunVO from '../../../shared/modules/Oselia/vos/OseliaRunVO';
import ModuleParams from '../../../shared/modules/Params/ModuleParams';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import GPTAssistantAPIServerController from '../GPT/GPTAssistantAPIServerController';
import OseliaServerController from './OseliaServerController';
import TeamsAPIServerController from '../TeamsAPI/TeamsAPIServerController';
import ContextFilterVO, { filter } from '../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import { field_names, reflect } from '../../../shared/tools/ObjectHandler';
import GPTAssistantAPIFunctionVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import ModuleOseliaServer from './ModuleOseliaServer';
import ConfigurationService from '../../env/ConfigurationService';
import OseliaRunTemplateVO from '../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';

export default class OseliaRunTemplateServerController {

    public static async create_run_from_template(
        template: OseliaRunTemplateVO,
        thread_vo_id: number,
        user_id: number,
        initial_prompt_parameters: { [param_name: string]: string },
    ) {

        if (!thread_vo_id) {
            todo
        }

        const oselia_run = new OseliaRunVO();
        oselia_run.assistant_id = template.assistant_id;
        oselia_run.childrens_are_multithreaded = template.childrens_are_multithreaded;
        oselia_run.hide_outputs = template.hide_outputs;
        oselia_run.hide_prompt = template.hide_prompt;
        oselia_run.initial_prompt_id = template.initial_prompt_id;
        oselia_run.initial_prompt_parameters = initial_prompt_parameters;
        oselia_run.name = template.name;
        oselia_run.start_date = Dates.now();
        oselia_run.state = template.state;

        /**
         * Si le state de départ est pas TODO, on doit figer les dates de début et de fin des taches déjà réalisées
         */
        switch (template.state) {
    public static STATE_SPLIT_ENDED: number = 2;
    public static STATE_WAITING_SPLITS_END: number = 3;
    public static STATE_WAIT_SPLITS_END_ENDED: number = 4;
    public static STATE_DONE: number = 9;
    TODO
            case OseliaRunVO.STATE_TODO:
        break;
            case OseliaRunVO.STATE_SPLITTING: number = 1;
    case OseliaRunVO.STATE_RUN_ENDED: number = 6;
    case OseliaRunVO.STATE_VALIDATING: number = 7;
    case OseliaRunVO.STATE_VALIDATION_ENDED: number = 8;
    case OseliaRunVO.STATE_RUNNING: number = 5;
    case OseliaRunVO.STATE_ERROR: number = 10;
    case OseliaRunVO.STATE_CANCELLED: number = 11;
    case OseliaRunVO.STATE_EXPIRED: number = 12;
    case OseliaRunVO.STATE_NEEDS_RERUN: number = 13;
    case OseliaRunVO.STATE_RERUN_ASKED: number = 14;
    default:
        throw new Error('create_run_from_template:state:Not Implemented:' + template.state);
        }

oselia_run.thread_id = thread_vo_id;
oselia_run.thread_title = 'Trello ' + Dates.format(Dates.now(), 'DD/MM/YYYY') + ' - synthèse ' + board_id;
oselia_run.use_splitter = true;
oselia_run.use_validator = false; // Toutes les sous étapes sont validées, ça semble pas efficace de demander une validation du parent quand ya un split
oselia_run.user_id = user_id;
oselia_run.weight = 0;
oselia_run.referrer_id = referrer.id;
await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(oselia_run);
    }
}