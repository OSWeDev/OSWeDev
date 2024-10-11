import UserVO from '../../../shared/modules/AccessPolicy/vos/UserVO';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import GPTAssistantAPIThreadVO from '../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import OseliaReferrerVO from '../../../shared/modules/Oselia/vos/OseliaReferrerVO';
import OseliaRunTemplateVO from '../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../shared/modules/Oselia/vos/OseliaRunVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import ModuleDAOServer from '../DAO/ModuleDAOServer';
import GPTAssistantAPIServerController from '../GPT/GPTAssistantAPIServerController';
import TemplateHandlerServer from '../Mailer/TemplateHandlerServer';
import OseliaServerController from './OseliaServerController';

export default class OseliaRunTemplateServerController {

    public static async create_run_from_template(
        template: OseliaRunTemplateVO,
        initial_prompt_parameters: { [param_name: string]: string } = null,
        referrer: OseliaReferrerVO = null,
        thread_vo: GPTAssistantAPIThreadVO = null,
        user: UserVO = null,
    ): Promise<OseliaRunVO> {

        try {

            if (!referrer) {
                referrer = await OseliaServerController.get_self_referrer();
            }

            if (!user) {
                user = await query(UserVO.API_TYPE_ID).filter_by_id(referrer.user_id).exec_as_server().select_vo<UserVO>();
            }

            if (!thread_vo) {
                const thread: { thread_gpt; thread_vo: GPTAssistantAPIThreadVO } = await GPTAssistantAPIServerController.get_thread();
                thread_vo = thread.thread_vo;
            }
            await OseliaServerController.link_thread_to_referrer(thread_vo, referrer);

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
                case OseliaRunVO.STATE_TODO: // On n'a rien fait encore
                    break;
                case OseliaRunVO.STATE_WAITING_SPLITS_END:  // On a splitt et on attend la fin des enfants
                    oselia_run.split_start_date = Dates.now();
                    oselia_run.split_end_date = Dates.now();
                    oselia_run.waiting_split_end_start_date = Dates.now();
                    break;
                case OseliaRunVO.STATE_DONE: // On a fini ce noeud
                    if (oselia_run.use_splitter) {
                        oselia_run.split_start_date = Dates.now();
                        oselia_run.split_end_date = Dates.now();
                        oselia_run.waiting_split_end_start_date = Dates.now();
                        oselia_run.waiting_split_end_end_date = Dates.now();
                    } else {
                        oselia_run.run_start_date = Dates.now();
                        oselia_run.run_end_date = Dates.now();
                    }

                    if (oselia_run.use_validator) {
                        oselia_run.validation_start_date = Dates.now();
                        oselia_run.validation_end_date = Dates.now();
                    }

                    oselia_run.end_date = Dates.now();
                    break;
                case OseliaRunVO.STATE_SPLITTING:
                case OseliaRunVO.STATE_SPLIT_ENDED:
                case OseliaRunVO.STATE_WAIT_SPLITS_END_ENDED:
                case OseliaRunVO.STATE_RUN_ENDED:
                case OseliaRunVO.STATE_VALIDATING:
                case OseliaRunVO.STATE_VALIDATION_ENDED:
                case OseliaRunVO.STATE_RUNNING:
                case OseliaRunVO.STATE_ERROR:
                case OseliaRunVO.STATE_CANCELLED:
                case OseliaRunVO.STATE_EXPIRED:
                case OseliaRunVO.STATE_NEEDS_RERUN:
                case OseliaRunVO.STATE_RERUN_ASKED:
                default:
                    throw new Error('create_run_from_template:state:Not Implemented:' + template.state);
            }

            oselia_run.childrens_are_multithreaded = template.childrens_are_multithreaded;
            oselia_run.thread_id = thread_vo.id;
            oselia_run.thread_title = await TemplateHandlerServer.apply_template(template.thread_title, user.lang_id, false, initial_prompt_parameters); // Comme on veut ouvrir au public, on peut pas accéder aux envs params
            oselia_run.use_splitter = template.use_splitter;
            oselia_run.use_validator = template.use_validator;
            oselia_run.user_id = user.id;
            oselia_run.weight = template.weight;
            oselia_run.referrer_id = referrer.id;
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(oselia_run);
            return oselia_run;

        } catch (error) {
            ConsoleHandler.error('OseliaRunTemplateServerController:create_run_from_template:Error:' + error);
            throw error;
        }
    }
}