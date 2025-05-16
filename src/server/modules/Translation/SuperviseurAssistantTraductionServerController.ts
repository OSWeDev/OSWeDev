import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import GPTAssistantAPIThreadVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO";
import OseliaRunTemplateVO from "../../../shared/modules/Oselia/vos/OseliaRunTemplateVO";
import OseliaRunVO from "../../../shared/modules/Oselia/vos/OseliaRunVO";
import DemandeAssistantTraductionVO from "../../../shared/modules/Translation/vos/DemandeAssistantTraductionVO";
import LangVO from "../../../shared/modules/Translation/vos/LangVO";
import TranslatableTextVO from "../../../shared/modules/Translation/vos/TranslatableTextVO";
import TranslationVO from "../../../shared/modules/Translation/vos/TranslationVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import { field_names } from "../../../shared/tools/ObjectHandler";
import { all_promises } from "../../../shared/tools/PromiseTools";
import ConfigurationService from "../../env/ConfigurationService";
import OseliaRunTemplateServerController from "../Oselia/OseliaRunTemplateServerController";
import AssistantTraductionCronWorker, { IParamOseliaAssistantTraduction } from "./workers/AssistantTraduction/AssistantTraductionCronWorker";

export default class SuperviseurAssistantTraductionServerController {

    public static PERF_MODULE_NAME: string = 'superviseur_assistant_traduction';

    public static OSELIA_RUN_TEMPLATE_NAME: string = 'Superviseur - Assistant Traduction';

    public static OSELIA_superviseur_assistant_traduction_ASSISTANT_NAME: string = 'Superviseur - Assistant Traduction';

    private static instance: SuperviseurAssistantTraductionServerController = null;

    private constructor() {
    }

    /**
     * Fonction qui permet à l'assistant de récupérer des codes de traduction à traduire (ils exitstent en codes, mais pas en trad pour cette langue), via un pattern, et dans la limite de 100 exemples
     * @param pattern
     * @param code_lang
     * @param thread_vo
     */
    public static async get_codes_that_need_translation(thread_vo: GPTAssistantAPIThreadVO, pattern: string, code_lang: string): Promise<string> {

        try {

            if (ConfigurationService.node_configuration.debug_assistant_traduction) {
                ConsoleHandler.log('SuperviseurAssistantTraductionServerController:get_codes_that_need_translation:Récupération des codes à traduire pour le pattern: "' + pattern + '", la langue : "' + code_lang + '" et le thread: ' + thread_vo.id);
            }

            // On vérifie le code langue et si ça existe pas, on renvoie les langues disponibles
            const langs = await query(LangVO.API_TYPE_ID)
                .exec_as_server()
                .select_vos<LangVO>();
            if (!langs) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:get_codes_that_need_translation:Aucune langue n\'a été trouvée dans le système');
                return 'Erreur : Aucune langue n\'a été trouvée dans le système. Une intervention technique est nécessaire.';
            }

            if (!code_lang) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:get_codes_that_need_translation:Aucune langue n\'a été fournie');

                // On renvoie les langues disponibles
                let res: string = '';
                res += langs.map((l) => l.code_lang).join('\n');
                return 'Erreur : Aucune langue n\'a été fournie. Il est obligatoire de fournir ce paramètre. Voici les langues disponibles :\n' + res;
            }

            if (!langs.find((l) => l.code_lang === code_lang)) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:get_codes_that_need_translation:La langue fournie n\'existe pas dans le système');
                // On renvoie les langues disponibles
                let res: string = '';
                res += langs.map((l) => l.code_lang).join('\n');
                return 'Erreur : La langue fournie n\'existe pas dans le système. Voici les langues disponibles :\n' + res;
            }

            let regexp: RegExp = null;

            if (pattern) {
                regexp = new RegExp(pattern);

                if (!regexp) {
                    ConsoleHandler.error('SuperviseurAssistantTraductionServerController:get_codes_that_need_translation:Le pattern fourni n\'est pas un pattern d\'expression régulière valide');
                    return 'Erreur : Le pattern fourni n\'est pas un pattern d\'expression régulière valide. Il est obligatoire de fournir un pattern valide.';
                }

                // On rajoute au besoin la cloture du pattern
                if (pattern[0] != '^') {
                    pattern = '^' + pattern;
                }

                if (pattern[pattern.length - 1] != '$') {
                    pattern = pattern + '$';
                }
            }

            /**
             * On cherche tous les codes_textes qui n'ont pas de trads dans une langue
             * Et on exclu les codes_textes qui ont déjà un run Osélia associé
             */
            const q = query(TranslatableTextVO.API_TYPE_ID)

                .filter_by_id_not_in(
                    query(TranslationVO.API_TYPE_ID)
                        .field(field_names<TranslationVO>().text_id)
                        .filter_by_text_eq(field_names<LangVO>().code_lang, code_lang, LangVO.API_TYPE_ID)
                        .exec_as_server()
                )

                // On exclu les codes textes qui ont déjà un run Osélia associé - pour la langue demandée
                .filter_by_id_not_in(
                    query(DemandeAssistantTraductionVO.API_TYPE_ID)
                        .field(field_names<DemandeAssistantTraductionVO>().text_id)
                        .filter_by_text_eq(field_names<LangVO>().code_lang, code_lang, LangVO.API_TYPE_ID)
                        .exec_as_server()
                )

                .exec_as_server()
                .set_limit(100);

            if (regexp) {
                q.filter_by_reg_exp(field_names<TranslatableTextVO>().code_text, pattern);
            }

            const missing_elts = await q
                .select_vos<TranslatableTextVO>();

            if ((!missing_elts) || (!missing_elts.length)) {
                ConsoleHandler.log('SuperviseurAssistantTraductionServerController:get_codes_that_need_translation:Aucun élément de traduction manquant trouvé');
                return 'Aucun élément de traduction manquant trouvé avec ce pattern pour cette langue.';
            }

            let res: string = 'Codes de traduction dont la traduction est manquante dans la langue "' + code_lang + '" correspondant au pattern /' + pattern + '/ (max 100 codes - 1 par ligne) :\n';
            res += missing_elts.map((ct) => ct.code_text).join('\n');

            if (ConfigurationService.node_configuration.debug_assistant_traduction) {
                ConsoleHandler.log('SuperviseurAssistantTraductionServerController:get_codes_that_need_translation:Récupération des codes à traduire pour le pattern: "' + pattern + '" la langue "' + code_lang + '" et le thread: ' + thread_vo.id + ' - ' + missing_elts.map((ct) => ct.code_text).join('\n'));
            }

            return res;
        } catch (error) {
            ConsoleHandler.error('SuperviseurAssistantTraductionServerController:get_codes_that_need_translation:Erreur lors de la récupération des codes à traduire: ' + error);
            return error;
        }
    }

    /**
     * La mise à jour de la traduction
     * @param thread_vo
     * @param code_text_a_traduire
     * @param code_lang
     * @param commentaire
     * @returns
     */
    public static async instantiate_assistant_traduction(thread_vo: GPTAssistantAPIThreadVO, code_text_a_traduire: string, code_lang: string, commentaire: string): Promise<string> {

        try {

            if (ConfigurationService.node_configuration.debug_assistant_traduction) {
                ConsoleHandler.log('SuperviseurAssistantTraductionServerController:instantiate_assistant_traduction:Instanciation d\'un assistant de traduction sur le thread: ' + thread_vo.id + ': le code text "' + code_text_a_traduire + '" la langue : "' + code_lang + '" et le commentaire : "' + commentaire + '"');
            }

            if (!code_text_a_traduire) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:instantiate_assistant_traduction:Aucune code_text_a_traduire n\'a été fournie');
                return 'Erreur : Aucune code_text_a_traduire n\'a été fournie. Il est obligatoire de fournir ce paramètre.';
            }

            if (!code_lang) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:instantiate_assistant_traduction:Aucune langue n\'a été fournie');
                return 'Erreur : Aucune langue n\'a été fournie. Il est obligatoire de fournir ce paramètre.';
            }

            let agent: OseliaRunTemplateVO = null;
            let missing_elt_id: number = null;
            let default_lang_code: string = null;
            let lang_id: number = null;
            // On met les requêtes en cache, ya pas de modifs sur les agents / langues / éléments de traduction qui soient utiles ici
            await all_promises([
                (async () => {
                    // On récupère l'agent
                    agent = await query(OseliaRunTemplateVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<OseliaRunTemplateVO>().name, AssistantTraductionCronWorker.OSELIA_RUN_TEMPLATE_NAME)
                        .exec_as_server()
                        .set_max_age_ms(120000)
                        .select_vo<OseliaRunTemplateVO>();
                })(),
                (async () => {
                    // On récupère la langue par défaut
                    const default_lang: LangVO = await query(LangVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<LangVO>().code_lang, ConfigurationService.node_configuration.default_locale)
                        .exec_as_server()
                        .set_max_age_ms(120000)
                        .select_vo<LangVO>();
                    default_lang_code = default_lang?.code_lang;
                })(),
                (async () => {
                    // On récupère la langue pour cette trad
                    const lang: LangVO = await query(LangVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<LangVO>().code_lang, code_lang)
                        .exec_as_server()
                        .set_max_age_ms(120000)
                        .select_vo<LangVO>();
                    lang_id = lang?.id;
                })(),
                (async () => {
                    // On récupère l'élément de traduction
                    const missing_elt: TranslatableTextVO = await query(TranslatableTextVO.API_TYPE_ID)
                        .filter_by_text_eq(field_names<TranslatableTextVO>().code_text, code_text_a_traduire)
                        .exec_as_server()
                        .set_max_age_ms(120000)
                        .select_vo<TranslatableTextVO>();
                    missing_elt_id = missing_elt?.id;
                })(),
            ]);

            if (!agent) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:instantiate_assistant_traduction:Aucun agent de traduction n\'a été trouvé');
                return 'Erreur : Aucun agent de traduction n\'a été trouvé. Une intervention technique est nécessaire.';
            }

            if (!lang_id) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:instantiate_assistant_traduction:Aucune langue n\'a été trouvée pour le code_lang: ' + code_lang);
                return 'Erreur : Aucune langue n\'a été trouvée pour le code_lang: ' + code_lang + '. Une intervention technique est nécessaire.';
            }

            if (!default_lang_code) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:instantiate_assistant_traduction:Aucune langue par défaut n\'a été trouvée');
                return 'Erreur : Aucune langue par défaut n\'a été trouvée. Une intervention technique est nécessaire.';
            }

            if (!missing_elt_id) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:instantiate_assistant_traduction:Aucun élément de traduction n\'a été trouvé pour le code texte: ' + code_text_a_traduire);
                return 'Erreur : Aucun élément de traduction n\'a été trouvé pour le code texte: ' + code_text_a_traduire + '. Une intervention technique est nécessaire.';
            }

            const params: IParamOseliaAssistantTraduction = {
                code_text: code_text_a_traduire,
                code_lang: code_lang,
                default_lang_code: default_lang_code,
                lang_id: lang_id.toString(),
                missing_elt_id: missing_elt_id.toString(),
            };

            const run_instancie: OseliaRunVO = await OseliaRunTemplateServerController.create_run_from_template(
                agent,
                params as any,
                params as any,
                null,
                null,
                null,
                thread_vo.last_oselia_run_id,
                thread_vo.id,
                commentaire,
            );

            if (!run_instancie) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:instantiate_assistant_traduction:Aucun run n\'a été instancié');
                return 'Erreur : Aucun run n\'a été instancié. Une intervention technique est nécessaire.';
            }

            // On veut retrouver l'id du thread qui a été créé pour communiqué sur le fait que les messages vont remonter avec cet id pour cette demande
            const thread_id: number = run_instancie.thread_id;
            if (!thread_id) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:instantiate_assistant_traduction:Aucun thread n\'a été trouvé pour le run: ' + run_instancie.id);
                return 'Erreur : Aucun thread n\'a été trouvé pour le run: ' + run_instancie.id + '. Une intervention technique est nécessaire.';
            }

            if (ConfigurationService.node_configuration.debug_assistant_traduction) {
                ConsoleHandler.log('SuperviseurAssistantTraductionServerController:instantiate_assistant_traduction:Instanciation d\'un assistant de traduction sur le thread: ' + thread_vo.id + ': le code text "' + code_text_a_traduire + '" la langue : "' + code_lang + '" et le commentaire : "' + commentaire + '" - run instancié dans le thread: ' + thread_id);
            }

            return 'La demande de traduction a été envoyée à l\'assistant de traduction dans le thread [' + thread_id + ']. La discussion du thread [' + thread_id + '] sera dupliquée directement dans cette discussion et vous pourrez ainsi suivre les réponses/questions de l\'assistant de traduction.';
        } catch (error) {
            ConsoleHandler.error('SuperviseurAssistantTraductionServerController:instantiate_assistant_traduction:' + error);
            return error;
        }
    }

    public static async push_message_to_supervised_thread_id(thread_vo: GPTAssistantAPIThreadVO, thread_id: number, message: string): Promise<string> {
        try {

            if (ConfigurationService.node_configuration.debug_assistant_traduction) {
                ConsoleHandler.log('SuperviseurAssistantTraductionServerController:push_message_to_supervised_thread_id:Envoie d\'un message à l\'assistant de traduction dans le thread: ' + thread_vo.id + ': le message : "' + message + '"');
            }

            if (!message) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:push_message_to_supervised_thread_id:Aucun message n\'a été fourni');
                return 'Erreur : Aucun message n\'a été fourni. Il est obligatoire de fournir ce paramètre.';
            }

            if (!thread_id) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:push_message_to_supervised_thread_id:Aucun thread_id n\'a été fourni');
                return 'Erreur : Aucun thread_id n\'a été fourni. Il est obligatoire de fournir ce paramètre.';
            }

            // 1 on checke que le thread_id existe et est bien supervisé par nous (thread_vo.id == vo(thread_id).pipe_outputs_to_thread_id)
            const supervised_thread_vo: GPTAssistantAPIThreadVO = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                .filter_by_id(thread_id)
                .exec_as_server()
                .select_vo<GPTAssistantAPIThreadVO>();

            if (!supervised_thread_vo) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:push_message_to_supervised_thread_id:Aucun thread n\'a été trouvé pour le thread_id: ' + thread_id);
                return 'Erreur : Aucun thread n\'a été trouvé pour le thread_id: ' + thread_id + '. Vérifier le thread_id.';
            }

            if (supervised_thread_vo.pipe_outputs_to_thread_id !== thread_vo.id) {
                ConsoleHandler.error('SuperviseurAssistantTraductionServerController:push_message_to_supervised_thread_id:Le thread_id ' + thread_id + ' n\'est pas supervisé par nous. Vérifier le thread_id.');
                return 'Erreur : Le thread_id ' + thread_id + ' n\'est pas supervisé par nous - la demande est invalide. Vérifier le thread_id.';
            }

            // 2 on envoie le message dans cette discussion, de la part d'un user robot
            await AssistantTraductionCronWorker.getInstance().push_message_to_oselia(
                supervised_thread_vo,
                "<Message du superviseur pour l'assistant> : " + message,
            );

            if (ConfigurationService.node_configuration.debug_assistant_traduction) {
                ConsoleHandler.log('SuperviseurAssistantTraductionServerController:push_message_to_supervised_thread_id:Envoie d\'un message à l\'assistant de traduction dans le thread: ' + thread_vo.id + ': le message : "' + message + '" - message envoyé dans le thread: ' + thread_id);
            }

            return 'Le message a été envoyé à l\'assistant de traduction dans le thread [' + thread_id + '].';
        } catch (error) {
            ConsoleHandler.error('SuperviseurAssistantTraductionServerController:push_message_to_supervised_thread_id:' + error);
            return error;
        }
    }
}