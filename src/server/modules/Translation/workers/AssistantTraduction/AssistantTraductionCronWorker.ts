import { query } from "../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import Dates from "../../../../../shared/modules/FormatDatesNombres/Dates/Dates";
import GPTAssistantAPIThreadMessageContentTextVO from "../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentTextVO";
import GPTAssistantAPIThreadMessageContentVO from "../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageContentVO";
import GPTAssistantAPIThreadMessageVO from "../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO";
import GPTAssistantAPIThreadVO from "../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO";
import OseliaRunTemplateVO from "../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO";
import OseliaRunVO from "../../../../../shared/modules/Oselia/vos/OseliaRunVO";
import PerfReportController from "../../../../../shared/modules/PerfReport/PerfReportController";
import DemandeAssistantTraductionVO from "../../../../../shared/modules/Translation/vos/DemandeAssistantTraductionVO";
import LangVO from "../../../../../shared/modules/Translation/vos/LangVO";
import TranslatableTextVO from "../../../../../shared/modules/Translation/vos/TranslatableTextVO";
import TranslationVO from "../../../../../shared/modules/Translation/vos/TranslationVO";
import VOsTypesManager from "../../../../../shared/modules/VO/manager/VOsTypesManager";
import ConsoleHandler from "../../../../../shared/tools/ConsoleHandler";
import { field_names } from "../../../../../shared/tools/ObjectHandler";
import PromisePipeline from "../../../../../shared/tools/PromisePipeline/PromisePipeline";
import { all_promises } from "../../../../../shared/tools/PromiseTools";
import ConfigurationService from "../../../../env/ConfigurationService";
import ModuleBGThreadServer from "../../../BGThread/ModuleBGThreadServer";
import ICronWorker from "../../../Cron/interfaces/ICronWorker";
import ModuleDAOServer from "../../../DAO/ModuleDAOServer";
import OseliaRunTemplateServerController from "../../../Oselia/OseliaRunTemplateServerController";
import ParamsServerController from "../../../Params/ParamsServerController";
import TeamsAPIServerController from "../../../TeamsAPI/TeamsAPIServerController";

export interface IParamOseliaAssistantTraduction {
    code_text: string;
    code_lang: string;
    missing_elt_id: string;
    default_lang_code: string;
    lang_id: string;
}

export default class AssistantTraductionCronWorker implements ICronWorker {

    public static PERF_MODULE_NAME: string = 'assistant_traduction';

    public static OSELIA_RUN_TEMPLATE_NAME: string = 'Assistant Traduction';

    public static PARAM_NAME_GROUPID_TEAMS_ACTION_REQUISE: string = 'AssistantTraductionCronWorker.PARAM_NAME_GROUPID_TEAMS_ACTION_REQUISE';
    public static PARAM_NAME_CHANNELID_TEAMS_ACTION_REQUISE: string = 'AssistantTraductionCronWorker.PARAM_NAME_CHANNELID_TEAMS_ACTION_REQUISE';

    public static PARAM_NAME_GROUPID_TEAMS_INFO: string = 'AssistantTraductionCronWorker.PARAM_NAME_GROUPID_TEAMS_INFO';
    public static PARAM_NAME_CHANNELID_TEAMS_INFO: string = 'AssistantTraductionCronWorker.PARAM_NAME_CHANNELID_TEAMS_INFO';

    public static MIN_CONFIDENT_LEVEL_PARAM_NAME: string = 'AssistantTraductionCronWorker.MIN_CONFIDENT_LEVEL';

    public static WEBHOOK_TEAMS_PARAM_NAME: string = 'AssistantTraductionCronWorker.WEBHOOK_TEAMS';
    public static ENABLED_PARAM_NAME: string = 'AssistantTraductionCronWorker.ENABLED';
    public static AUTO_DISABLE_PARAM_NAME: string = 'AssistantTraductionCronWorker.AUTO_DISABLE';
    public static NB_PER_RUN_PARAM_NAME: string = 'AssistantTraductionCronWorker.NB_PER_RUN';

    public static OSELIA_assistant_traduction_ASSISTANT_NAME: string = 'AssistantTraductionCronWorker.oselia_assistant_traduction_assistant_name';

    public static OSELIA_assistant_traduction_PROMPT_NAME: string = 'AssistantTraductionCronWorker.oselia_assistant_traduction_prompt_name';

    private static instance: AssistantTraductionCronWorker = null;
    private static oselia_run_template: OseliaRunTemplateVO = null;

    private constructor() {
    }

    get worker_uid(): string {
        return "AssistantTraductionCronWorker";
    }

    public static getInstance() {
        if (!AssistantTraductionCronWorker.instance) {
            AssistantTraductionCronWorker.instance = new AssistantTraductionCronWorker();
        }
        return AssistantTraductionCronWorker.instance;
    }

    public async work() {

        try {

            if (!AssistantTraductionCronWorker.oselia_run_template) {
                AssistantTraductionCronWorker.oselia_run_template = await query(OseliaRunTemplateVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<OseliaRunTemplateVO>().template_name, AssistantTraductionCronWorker.OSELIA_RUN_TEMPLATE_NAME)
                    .exec_as_server()
                    .select_vo<OseliaRunTemplateVO>();
            }

            if (!AssistantTraductionCronWorker.oselia_run_template) {
                throw new Error('AssistantTraductionCronWorker:Impossible de trouver le template OseliaRun pour l\'assistant Traduction: ' + AssistantTraductionCronWorker.OSELIA_RUN_TEMPLATE_NAME);
            }

            const ts_in_ms = Dates.now_ms();
            const langs: LangVO[] = await query(LangVO.API_TYPE_ID)
                .exec_as_server()
                .select_vos<LangVO>();
            let might_have_more: boolean = false;
            const default_lang: LangVO = await query(LangVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<LangVO>().code_lang, ConfigurationService.node_configuration.default_locale)
                .exec_as_server()
                .select_vo<LangVO>();

            for (const i in langs) {
                const lang = langs[i];

                might_have_more = might_have_more || await this.solve_missing_translations_elts(lang, default_lang);
            }

            PerfReportController.add_cooldown(
                AssistantTraductionCronWorker.PERF_MODULE_NAME,
                AssistantTraductionCronWorker.OSELIA_RUN_TEMPLATE_NAME,
                AssistantTraductionCronWorker.OSELIA_RUN_TEMPLATE_NAME,
                null,
                ts_in_ms,
                Dates.now_ms(),
                'WORKER',
            );

            if (might_have_more) {
                return ModuleBGThreadServer.TIMEOUT_COEF_RUN;
            }
        } catch (error) {
            ConsoleHandler.error(error);
        }

        return ModuleBGThreadServer.TIMEOUT_COEF_SLEEP;
    }

    /**
     * Fonction qui permet à l'assistant de récupérer des exemples de traduction, via un pattern, et dans la limite de 100 exemples
     * @param pattern
     * @param thread_vo
     */
    public async get_translation_samples(thread_vo: GPTAssistantAPIThreadVO, pattern: string): Promise<string> {

        try {

            if (ConfigurationService.node_configuration.debug_assistant_traduction) {
                ConsoleHandler.log('AssistantTraductionCronWorker:get_translation_samples:Récupération des exemples de traduction pour le pattern: ' + pattern + ' et le thread: ' + thread_vo.id);
            }

            if (!pattern) {
                ConsoleHandler.error('AssistantTraductionCronWorker:get_translation_samples:Aucun pattern n\'a été fourni');
                return 'Erreur : Aucun pattern n\'a été fourni. Il est obligatoire de fournir ce paramètre.';
            }

            const regexp = new RegExp(pattern);

            if (!regexp) {
                ConsoleHandler.error('AssistantTraductionCronWorker:get_translation_samples:Le pattern fourni n\'est pas un pattern d\'expression régulière valide');
                return 'Erreur : Le pattern fourni n\'est pas un pattern d\'expression régulière valide. Il est obligatoire de fournir un pattern valide.';
            }

            // On récupère les infos directement des metadatas du thread
            const metadatas: IParamOseliaAssistantTraduction = thread_vo.metadata as IParamOseliaAssistantTraduction;

            if (!metadatas) {
                ConsoleHandler.error('AssistantTraductionCronWorker:get_translation_samples:Impossible de trouver les metadatas de l\'assistant Traduction');
                return 'Erreur : impossible de trouver les metadatas de l\'assistant Traduction. Une intervention d\'un technicien est nécessaire pour pouvoir continuer le traitement.';
            }

            // On rajoute au besoin la cloture du pattern
            if (pattern[0] != '^') {
                pattern = '^' + pattern;
            }

            if (pattern[pattern.length - 1] != '$') {
                pattern = pattern + '$';
            }

            /**
             * On va renvoyer toutes les traductions, dont les codes correspondent au pattern, et on indiquera les codes langues dans la réponse pour chaque traduction
             */
            const samples: TranslationVO[] = await query(TranslationVO.API_TYPE_ID)
                .filter_by_reg_exp(field_names<TranslatableTextVO>().code_text, pattern, TranslatableTextVO.API_TYPE_ID)
                .filter_is_not_null(field_names<TranslationVO>().translated)
                .exec_as_server()
                .set_limit(100)
                .select_vos<TranslationVO>();

            if ((!samples) || (!samples.length)) {
                ConsoleHandler.log('AssistantTraductionCronWorker:get_translation_samples:Aucun exemple de traduction ne correspond à ce pattern : ' + pattern);
                return 'Aucun exemple de traduction ne correspond à ce pattern.';
            }

            const langs: LangVO[] = await query(LangVO.API_TYPE_ID)
                .exec_as_server()
                .set_max_age_ms(1000 * 60 * 60) // 1h aucune pression pour recharger les langues...
                .select_vos<LangVO>();
            const lang_by_id: { [lang_id: number]: LangVO } = VOsTypesManager.vosArray_to_vosByIds(langs);

            const translatable_texts: TranslatableTextVO[] = await query(TranslatableTextVO.API_TYPE_ID)
                .filter_by_ids(samples.map((sample) => sample.text_id))
                .exec_as_server()
                .select_vos<TranslatableTextVO>();

            if ((!translatable_texts) || (!translatable_texts.length)) {
                ConsoleHandler.error('AssistantTraductionCronWorker:Erreur lors de la récupération des textes traduisibles pour le pattern: ' + pattern);
                return 'Erreur : Impossible de récupérer les textes traduisibles pour le pattern: ' + pattern + '. Une intervention d\'un technicien est nécessaire pour pouvoir continuer le traitement.';
            }

            const translatable_text_by_id: { [text_id: number]: TranslatableTextVO } = VOsTypesManager.vosArray_to_vosByIds(translatable_texts);

            const samples_by_code_text_and_code_lang: { [code_text: string]: { [code_lang: string]: string } } = {};
            for (const i in samples) {
                const sample = samples[i];
                const translatable_text = translatable_text_by_id[sample.text_id];

                if (!translatable_text) {
                    ConsoleHandler.error('AssistantTraductionCronWorker:get_translation_samples:Impossible de trouver le texte traduisible pour le sample: ' + sample.id);
                    continue;
                }

                const lang = lang_by_id[sample.lang_id];

                if (!lang) {
                    ConsoleHandler.error('AssistantTraductionCronWorker:get_translation_samples:Impossible de trouver la langue pour le sample: ' + sample.id);
                    continue;
                }

                if (!samples_by_code_text_and_code_lang[translatable_text.code_text]) {
                    samples_by_code_text_and_code_lang[translatable_text.code_text] = {};
                }

                samples_by_code_text_and_code_lang[translatable_text.code_text][lang.code_lang] = sample.translated;
            }

            let res: string = 'Exemples (max 100) de traduction correspondant au pattern /' + pattern + '/ :\n';
            res += JSON.stringify(samples_by_code_text_and_code_lang);

            if (ConfigurationService.node_configuration.debug_assistant_traduction) {
                ConsoleHandler.log('AssistantTraductionCronWorker:get_translation_samples:Récupération des exemples de traduction pour le pattern: ' + pattern + ' et le thread: ' + thread_vo.id + ' - ' + JSON.stringify(samples_by_code_text_and_code_lang, null, 2));
            }

            return res;
        } catch (error) {
            ConsoleHandler.error('AssistantTraductionCronWorker:get_translation_samples:Erreur lors de la récupération des exemples de traduction: ' + error);
            return error;
        }
    }

    /**
     * La mise à jour de la traduction
     * @param thread_vo
     * @param traduction
     * @param degre_certitude
     * @param explication
     * @returns
     */
    public async set_translation(thread_vo: GPTAssistantAPIThreadVO, traduction: string, degre_certitude: number, explication: string): Promise<string> {

        try {

            if (ConfigurationService.node_configuration.debug_assistant_traduction) {
                ConsoleHandler.log('AssistantTraductionCronWorker:set_translation:Mise à jour de l\'élément de traduction pour le thread: ' + thread_vo.id + ': la traduction proposée est "' + traduction + '" avec un degré de certitude de: ' + degre_certitude);
            }

            if (!traduction) {
                ConsoleHandler.error('AssistantTraductionCronWorker:set_translation:Aucun id cible n\'a été fourni');
                return 'Erreur : Aucun id cible n\'a été fourni. Il est obligatoire de fournir ce paramètre.';
            }

            // On récupère les infos directement des metadatas du thread
            const metadatas: IParamOseliaAssistantTraduction = thread_vo.metadata as IParamOseliaAssistantTraduction;

            if (!metadatas) {
                ConsoleHandler.error('AssistantTraductionCronWorker:set_translation:Impossible de trouver les metadatas de l\'assistant Traduction');
                return 'Erreur : impossible de trouver les metadatas de l\'assistant Traduction. Une intervention d\'un technicien est nécessaire pour pouvoir continuer le traitement.';
            }

            const missing_elt_id = parseInt(metadatas.missing_elt_id);
            const missing_elt_lang_id = parseInt(metadatas.lang_id);

            if (!missing_elt_id) {
                ConsoleHandler.error('AssistantTraductionCronWorker:set_translation:Impossible de trouver l\'id de l\'élément manquant');
                return 'Erreur : impossible de trouver l\'id de l\'élément manquant. Une intervention d\'un technicien est nécessaire pour pouvoir continuer le traitement.';
            }

            if (!missing_elt_lang_id) {
                ConsoleHandler.error('AssistantTraductionCronWorker:set_translation:Impossible de trouver l\'id de la langue de l\'élément manquant');
                return 'Erreur : impossible de trouver l\'id de la langue de l\'élément manquant. Une intervention d\'un technicien est nécessaire pour pouvoir continuer le traitement.';
            }

            /**
             * On récupère le degré de ceertitude plancher pour savoir si on informe l'utilisateur ou pas
             * Si on est en dessous, on informe de la nécessité de revoir la proposition mais on la met en place quand même pour pas avoir de trou dans les trads
             */
            const MIN_CONFIDENT_LEVEL: number = await ParamsServerController.getParamValueAsInt(AssistantTraductionCronWorker.MIN_CONFIDENT_LEVEL_PARAM_NAME, 100);

            const translatable_text: TranslatableTextVO = await query(TranslatableTextVO.API_TYPE_ID)
                .filter_by_id(missing_elt_id)
                .exec_as_server()
                .select_vo<TranslatableTextVO>();

            if (!translatable_text) {
                ConsoleHandler.error('AssistantTraductionCronWorker:set_translation:Impossible de trouver l\'élément cible');
                return 'Erreur : impossible de trouver l\'élément cible. l\'id cible doit obligatoirement faire partie des éléments cibles possibles. Tu ne dois pas inventer un id ni trouver un id proche. Tu dois identifier une valeur importée proche dans les exemple et une fois la sélection faite, indiquer l\'id cible actuellement associé à cette valeur qui te semble cohérente.';
            }

            let text_choix = null;
            if (degre_certitude < MIN_CONFIDENT_LEVEL) {

                text_choix = 'Le degré de certitude est <b>' + degre_certitude + ' < ' + MIN_CONFIDENT_LEVEL +
                    '</b>, il faut vérifier manuellement la traduction qui a été proposée.<br><br>' +
                    '<ul><li>Code text : <b>"' + metadatas.code_text + '" [' + missing_elt_id + ']</b></li>' +
                    '<li>Code lang : <b>"' + metadatas.code_lang + '"</b></li>' +
                    '<li>Traduction proposée : <b>"' + traduction + '"</b></li>' +
                    '<li>Explication de l\'assistant pour ce choix : </li></ul><blockquote>' + explication + '</blockquote>';
                ConsoleHandler.warn('AssistantTraductionCronWorker:set_translation:' + text_choix);
                await TeamsAPIServerController.send_teams_oselia_action_needed(
                    (ConfigurationService.node_configuration.is_main_prod_env ? '' : '[TEST] ') + 'Osélia a besoin d\'assistance pour une traduction',
                    text_choix,
                    thread_vo.id);
            } else {

                text_choix = 'L\'assistant Traduction a réalisé une configuration avec un degré de certitude élevé : <b>' + degre_certitude + '/100</b>, Aucune action n\'est nécessaire mais un contrôle peut être utile.<br><br>' +
                    '<ul><li>Code text : <b>"' + metadatas.code_text + '" [' + missing_elt_id + ']</b></li>' +
                    '<li>Code lang : <b>"' + metadatas.code_lang + '"</b></li>' +
                    '<li>Traduction proposée : <b>"' + traduction + '"</b></li>' +
                    '<li>Explication de l\'assistant pour ce choix : </li></ul><blockquote>' + explication + '</blockquote>';

                ConsoleHandler.log('AssistantTraductionCronWorker:set_translation:' + text_choix);
                await TeamsAPIServerController.send_teams_oselia_info(
                    (ConfigurationService.node_configuration.is_main_prod_env ? '' : '[TEST] ') + 'Osélia a modifié une traduction',
                    text_choix,
                    thread_vo.id);
            }

            // On ajoute un message indiquant le choix de l'assistant
            await this.push_message_to_oselia(thread_vo, text_choix);

            if (degre_certitude < MIN_CONFIDENT_LEVEL) {
                // On ne met pas à jour la traduction si le degré de certitude est trop faible
                ConsoleHandler.warn('AssistantTraductionCronWorker:set_translation:Le degré de certitude est <b>' + degre_certitude + ' < ' + MIN_CONFIDENT_LEVEL + '</b>, il faut vérifier manuellement et confirmer la traduction qui a été proposée. La création n\'est pas automatique.');
                // On "ment" à Osélia
                return 'L\'élément de traduction a bien été mis à jour. Le traitement est terminé.';
            }

            const nouvelle_traduction = new TranslationVO();
            nouvelle_traduction.text_id = missing_elt_id;
            nouvelle_traduction.lang_id = missing_elt_lang_id;
            nouvelle_traduction.translated = traduction;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(nouvelle_traduction);

            if (ConfigurationService.node_configuration.debug_assistant_traduction) {
                ConsoleHandler.log('AssistantTraductionCronWorker:set_translation:L\'élément de traduction a bien été mis à jour. Le traitement est terminé.');
            }

            return 'L\'élément de traduction a bien été mis à jour. Le traitement est terminé.';
        } catch (error) {
            ConsoleHandler.error('AssistantTraductionCronWorker:set_translation:' + error);
            return error;
        }
    }

    private async push_message_to_oselia(thread_vo: GPTAssistantAPIThreadVO, msg: string) {
        const new_thread_message = new GPTAssistantAPIThreadMessageVO();
        new_thread_message.thread_id = thread_vo.id;
        new_thread_message.date = Dates.now();
        new_thread_message.role = GPTAssistantAPIThreadMessageVO.GPTMSG_ROLE_ASSISTANT;
        new_thread_message.user_id = thread_vo.user_id;
        new_thread_message.assistant_id = thread_vo.current_default_assistant_id;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(new_thread_message);

        const mail_content = new GPTAssistantAPIThreadMessageContentVO();
        mail_content.type = GPTAssistantAPIThreadMessageContentVO.TYPE_TEXT;
        mail_content.thread_message_id = new_thread_message.id;
        mail_content.content_type_text = new GPTAssistantAPIThreadMessageContentTextVO();
        mail_content.content_type_text.value = msg;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(mail_content);
    }




    private async solve_missing_translations_elts(lang: LangVO, default_lang: LangVO): Promise<boolean> {

        let enabled: boolean = false;
        let AUTO_DISABLE: boolean = false;
        let NB_PER_RUN: number = 5;

        await all_promises([
            (async () => {
                enabled = await ParamsServerController.getParamValueAsBoolean_as_server(AssistantTraductionCronWorker.ENABLED_PARAM_NAME, false);
            })(),
            (async () => {
                AUTO_DISABLE = await ParamsServerController.getParamValueAsBoolean_as_server(AssistantTraductionCronWorker.AUTO_DISABLE_PARAM_NAME, true);
            })(),
            (async () => {
                NB_PER_RUN = await ParamsServerController.getParamValueAsInt_as_server(AssistantTraductionCronWorker.NB_PER_RUN_PARAM_NAME, 500);
            })(),
        ]);

        if (enabled && AUTO_DISABLE) {
            await ParamsServerController.setParamValueAsBoolean(AssistantTraductionCronWorker.ENABLED_PARAM_NAME, false);
        }

        const promise_pipeline: PromisePipeline = new PromisePipeline(3, 'AssistantTraductionCronWorker:solve_missing_translation_elts');
        let current_nb = 0;

        while (enabled && (current_nb < NB_PER_RUN)) {

            /**
             * On cherche tous les codes_textes qui n'ont pas de trads dans une langue
             * Et on exclu les codes_textes qui ont déjà un run Osélia associé
             */
            const q = query(TranslatableTextVO.API_TYPE_ID)
                .filter_by_id_not_in(
                    query(TranslationVO.API_TYPE_ID)
                        .field(field_names<TranslationVO>().text_id)
                        .filter_by_id(lang.id, LangVO.API_TYPE_ID)
                        .exec_as_server()
                )

                // On exclu les codes textes qui ont déjà un run Osélia associé - pour la langue demandée
                .filter_by_id_not_in(
                    query(DemandeAssistantTraductionVO.API_TYPE_ID)
                        .field(field_names<DemandeAssistantTraductionVO>().text_id)
                        .filter_by_id(lang.id, LangVO.API_TYPE_ID)
                        .exec_as_server()
                )

                .exec_as_server()
                .set_limit(1);

            const missing_elts = await q
                .select_vos<TranslatableTextVO>();

            if ((!missing_elts) || (!missing_elts.length)) {
                break;
            }

            const missing_elt = missing_elts[0];

            if (!missing_elt) {
                break;
            }

            current_nb++;

            await this.solve_missing_translation_elt(missing_elt, lang, default_lang);

            await all_promises([
                (async () => {
                    enabled = await ParamsServerController.getParamValueAsBoolean(AssistantTraductionCronWorker.ENABLED_PARAM_NAME, false);
                })(),
                (async () => {
                    NB_PER_RUN = await ParamsServerController.getParamValueAsInt(AssistantTraductionCronWorker.NB_PER_RUN_PARAM_NAME, 500, 60000);
                })(),
            ]);
        }

        await promise_pipeline.end();

        return current_nb >= NB_PER_RUN;
    }

    private async solve_missing_translation_elt(missing_elt: TranslatableTextVO, lang: LangVO, default_lang: LangVO): Promise<void> {

        if ((!missing_elt) || (!lang) || (!missing_elt.code_text)) {
            return;
        }

        if (ConfigurationService.node_configuration.debug_assistant_traduction) {
            ConsoleHandler.log('AssistantTraductionCronWorker:solve_missing_translation_elt:1:Traitement de l\'élément de traduction manquant: id:' + missing_elt.id + ' - code texte:' + missing_elt.code_text + ' - lang:' + lang.code_lang);
        }

        const oselia_run: OseliaRunVO = await OseliaRunTemplateServerController.create_run_from_template(
            AssistantTraductionCronWorker.oselia_run_template,
            {
                code_text: missing_elt.code_text,
                code_lang: lang.code_lang,
                missing_elt_id: missing_elt.id.toString(),
                default_lang_code: default_lang.code_lang,
                lang_id: lang.id.toString(),
            },
            {
                code_text: missing_elt.code_text,
                code_lang: lang.code_lang,
                missing_elt_id: missing_elt.id.toString(),
                default_lang_code: default_lang.code_lang,
                lang_id: lang.id.toString(),
            },
        );

        // On crée la demande de traduction pour lier le run au code texte sur cette langue
        const demande_assistant_traduction = new DemandeAssistantTraductionVO();
        demande_assistant_traduction.lang_id = lang.id;
        demande_assistant_traduction.text_id = missing_elt.id;
        demande_assistant_traduction.oselia_run_id = oselia_run.id;
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(demande_assistant_traduction);

        PerfReportController.add_event(
            AssistantTraductionCronWorker.PERF_MODULE_NAME,
            AssistantTraductionCronWorker.OSELIA_RUN_TEMPLATE_NAME,
            AssistantTraductionCronWorker.OSELIA_RUN_TEMPLATE_NAME,
            null,
            Dates.now_ms(),
            'Run osélia instancié [' + oselia_run.id + '] pour l\'assistant Traduction [' + missing_elt.id + '] ' + lang.code_lang + ' - ' + missing_elt.code_text,
        );
    }
}