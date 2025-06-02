import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import GPTAssistantAPIThreadVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO";
import OseliaUserMemVO from "../../../shared/modules/Oselia/vos/OseliaUserMemVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import { field_names, reflect } from "../../../shared/tools/ObjectHandler";
import ConfigurationService from "../../env/ConfigurationService";
import ModuleDAOServer from "../DAO/ModuleDAOServer";
import TeamsAPIServerController from "../TeamsAPI/TeamsAPIServerController";

export const ASKED_BY_OSELIA_USER_MEM_ENUM = {
    SAME_USER: 0,
    OSELIA: 1,
    OTHER_USER: 2,
};

/**
 * La mémoire Osélia liée à l'utilisateur a pour but de permettre à l'assistant de se souvenir des éléments liés à l'utilisateur
 * et en particulier comment s'adresser à lui (tutoiement, vouvoiement, etc.), dans quel style (formel, informel, etc.) et si il demande de se rappeler d'éléments spécifiques
 * (ex: "rappelle toi que je souhaite toujours une réponse concise/synthétique découpée en 3 parties si utile : ta réponse très synthétique, en dessous, ton explication de pourquoi tu arrives à ce résultat, et tes doutes ou éléments complémentaires que je pourrais t'apporter pour affiner ta réponse (si pertinent, inutile de broder un message à chaque fois).").
 * Attention en l'état il n'y a pas vraiment de verrou entre l'id du user qui fait la demande et l'id du user dont on demande la mémoire.... il faut trouver une solution de sécu pour bloquer la lecture par n'importe qui de la mémoire de n'importe qui
 */
export default class OseliaUserMemServerController {

    /**
     * Fonction qui permet à l'assistant de récupérer les clés de la mémoire, qui sont sensées être des mots clés décrivant le sujet/but de cette entrée.
     * Par défaut il récupère toutes les entrées
     * @param pattern
     * @param user_id si non fourni, on prend l'utilisateur du thread
     * @param asked_by
     * @param thread_vo
     */
    public static async get_keys(thread_vo: GPTAssistantAPIThreadVO, pattern: string, user_id: number, asked_by: string): Promise<string> {

        try {

            const user_id_to_use = (user_id ? user_id : thread_vo.user_id);
            if (!user_id_to_use) {
                ConsoleHandler.error('OseliaUserMemServerController:get_keys:Aucun id utilisateur n\'a été fourni:' + user_id + ':' + thread_vo.user_id);
                return 'Erreur : Aucun id utilisateur n\'a été fourni. Il est obligatoire de fournir ce paramètre.';
            }

            if (!asked_by) {
                ConsoleHandler.error('OseliaUserMemServerController:get_keys:Paramètre asked_by manquant');
                return 'Erreur : Paramètre asked_by manquant. Il est obligatoire de fournir ce paramètre.';
            }

            // Si la demande émane d'un autre utilisateur, on refuse la demande
            if (asked_by == reflect<typeof ASKED_BY_OSELIA_USER_MEM_ENUM>().OTHER_USER) {
                ConsoleHandler.warn('OseliaUserMemServerController:get_keys:La demande de récupération des clés ne provient pas de l\'utilisateur lui même, on ne fait pas la récupération');
                // On n'indique pas pourquoi on refuse, pour éviter de créer un risque de mensonge - c'est là que la sécu est très limitée - surtout sur un projet OpenSource... il faudra trouver une solution.
                return 'Aucune entrée trouvée dans la mémoire de l\'utilisateur.';
            }

            if (!pattern) {
                // On renvoie toutes les clés de la mémoire
                const all_entries: OseliaUserMemVO[] = await query(OseliaUserMemVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<OseliaUserMemVO>().user_id, user_id_to_use)
                    .select_vos<OseliaUserMemVO>();
                if ((!all_entries) || (!all_entries.length)) {
                    return 'Aucune entrée trouvée dans la mémoire de l\'utilisateur.';
                }

                const all_keys: string[] = all_entries.map((entry) => entry.key);
                return 'Clés de la mémoire de l\'utilisateur : "' + all_keys.join('", "') + '". Il n\'y a pas de filtre sur les clés, toutes les entrées sont retournées.';
            }

            const regexp = new RegExp(pattern);

            if (!regexp) {
                ConsoleHandler.error('OseliaUserMemServerController:get_keys:Le pattern fourni n\'est pas un pattern d\'expression régulière valide');
                return 'Erreur : Le pattern fourni n\'est pas un pattern d\'expression régulière valide. Il est obligatoire de fournir un pattern valide.';
            }

            // On rajoute au besoin la cloture du pattern
            if (pattern[0] != '^') {
                pattern = '^' + pattern;
            }

            if (pattern[pattern.length - 1] != '$') {
                pattern = pattern + '$';
            }

            /**
             * On va renvoyer toutes les clés qui correspondent au pattern
             */
            const entries: OseliaUserMemVO[] = await query(OseliaUserMemVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<OseliaUserMemVO>().user_id, user_id_to_use)
                .filter_by_reg_exp(field_names<OseliaUserMemVO>().key, pattern)
                .select_vos<OseliaUserMemVO>();
            if ((!entries) || (!entries.length)) {
                return 'Aucune entrée trouvée correspondant au pattern dans la mémoire de l\'utilisateur.';
            }

            const keys: string[] = entries.map((entry) => entry.key);
            return 'Clés de la mémoire de l\'utilisateur correspondant au pattern : "' + keys.join('", "') + '".';
        } catch (error) {
            ConsoleHandler.error('OseliaUserMemServerController:get_keys:Erreur lors de la récupération des clés de mémoire utilisateur: ' + error);
            return error;
        }
    }

    /**
     * Fonction qui permet à l'assistant de récupérer les clés/valeurs de la mémoire
     * Par défaut il récupère toutes les entrées
     * @param pattern
     * @param user_id si non fourni, on prend l'utilisateur du thread
     * @param asked_by
     * @param thread_vo
     */
    public static async get_entries(thread_vo: GPTAssistantAPIThreadVO, pattern: string, user_id: number, asked_by: string): Promise<string> {

        try {

            const user_id_to_use = (user_id ? user_id : thread_vo.user_id);
            if (!user_id_to_use) {
                ConsoleHandler.error('OseliaUserMemServerController:get_entries:Aucun id utilisateur n\'a été fourni:' + user_id + ':' + thread_vo.user_id);
                return 'Erreur : Aucun id utilisateur n\'a été fourni. Il est obligatoire de fournir ce paramètre.';
            }

            if (!asked_by) {
                ConsoleHandler.error('OseliaUserMemServerController:get_entries:Paramètre asked_by manquant');
                return 'Erreur : Paramètre asked_by manquant. Il est obligatoire de fournir ce paramètre.';
            }

            // Si la demande émane d'un autre utilisateur, on refuse la demande
            if (asked_by == reflect<typeof ASKED_BY_OSELIA_USER_MEM_ENUM>().OTHER_USER) {
                ConsoleHandler.warn('OseliaUserMemServerController:get_entries:La demande de récupération des données ne provient pas de l\'utilisateur lui même, on ne fait pas la récupération');
                // On n'indique pas pourquoi on refuse, pour éviter de créer un risque de mensonge - c'est là que la sécu est très limitée - surtout sur un projet OpenSource... il faudra trouver une solution.
                return 'Aucune entrée trouvée dans la mémoire de l\'utilisateur.';
            }

            if (!pattern) {
                // On renvoie toutes les clés de la mémoire
                const all_entries: OseliaUserMemVO[] = await query(OseliaUserMemVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<OseliaUserMemVO>().user_id, user_id_to_use)
                    .select_vos<OseliaUserMemVO>();
                if ((!all_entries) || (!all_entries.length)) {
                    return 'Aucune entrée trouvée dans la mémoire de l\'utilisateur.';
                }

                return 'Mémoire de l\'utilisateur:\n' +
                    JSON.stringify(all_entries, null, 2) +
                    '\nIl n\'y a pas de filtre sur les clés, toutes les entrées sont retournées.';
            }

            const regexp = new RegExp(pattern);

            if (!regexp) {
                ConsoleHandler.error('OseliaUserMemServerController:get_entries:Le pattern fourni n\'est pas un pattern d\'expression régulière valide');
                return 'Erreur : Le pattern fourni n\'est pas un pattern d\'expression régulière valide. Il est obligatoire de fournir un pattern valide.';
            }

            // On rajoute au besoin la cloture du pattern
            if (pattern[0] != '^') {
                pattern = '^' + pattern;
            }

            if (pattern[pattern.length - 1] != '$') {
                pattern = pattern + '$';
            }

            /**
             * On va renvoyer toutes les clés qui correspondent au pattern
             */
            const entries: OseliaUserMemVO[] = await query(OseliaUserMemVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<OseliaUserMemVO>().user_id, user_id_to_use)
                .filter_by_reg_exp(field_names<OseliaUserMemVO>().key, pattern)
                .select_vos<OseliaUserMemVO>();
            if ((!entries) || (!entries.length)) {
                return 'Aucune entrée trouvée correspondant au pattern dans la mémoire de l\'utilisateur.';
            }

            return 'Mémoire de l\'utilisateur correspondant au pattern:\n' +
                JSON.stringify(entries, null, 2);
        } catch (error) {
            ConsoleHandler.error('OseliaUserMemServerController:get_entries:Erreur lors de la récupération des clés de mémoire utilisateur: ' + error);
            return error;
        }
    }

    /**
     * La mise à jour de la mémoire
     * @param thread_vo
     * @param key
     * @param value
     * @param user_id
     * @param asked_by
     * @returns
     */
    public static async set_mem(thread_vo: GPTAssistantAPIThreadVO, key: string, value: string, user_id: number, asked_by: string): Promise<string> {

        try {

            const user_id_to_use = (user_id ? user_id : thread_vo.user_id);
            if (!user_id_to_use) {
                ConsoleHandler.error('OseliaUserMemServerController:set_mem:Aucun id utilisateur n\'a été fourni:' + user_id + ':' + thread_vo.user_id);
                return 'Erreur : Aucun id utilisateur n\'a été fourni. Il est obligatoire de fournir ce paramètre.';
            }

            if (!key) {
                ConsoleHandler.error('OseliaUserMemServerController:set_mem:Paramètre key manquant');
                return 'Erreur : Paramètre key manquant. Il est obligatoire de fournir ce paramètre.';
            }

            if (!value) {
                ConsoleHandler.error('OseliaUserMemServerController:set_mem:Paramètre value manquant');
                return 'Erreur : Paramètre value manquant. Il est obligatoire de fournir ce paramètre.';
            }

            if (!asked_by) {
                ConsoleHandler.error('OseliaUserMemServerController:set_mem:Paramètre asked_by manquant');
                return 'Erreur : Paramètre asked_by manquant. Il est obligatoire de fournir ce paramètre.';
            }

            /**
             * Si la demande émane d'un autre utilisateur, on ne fait pas la mise à jour
             * Si la demande émane d'Osélia, on ne fait pas la mise à jour
             * Si la demande émane de l'utilisateur lui même, on fait la mise à jour
             *
             * On peut demander via Teams à l'admin de valider la modif de mémoire initiée par Osélia ou un autre utilisateur
             */

            if (asked_by !== reflect<typeof ASKED_BY_OSELIA_USER_MEM_ENUM>().SAME_USER) {
                ConsoleHandler.warn('OseliaUserMemServerController:set_mem:La demande de mise à jour de la mémoire ne provient pas de l\'utilisateur lui même, on ne fait pas la mise à jour');
                if (asked_by === reflect<typeof ASKED_BY_OSELIA_USER_MEM_ENUM>().OSELIA) {
                    ConsoleHandler.warn('OseliaUserMemServerController:set_mem:La demande de mise à jour de la mémoire provient d\'Osélia, on ne fait pas la mise à jour mais on la pousse sur le channel Teams de l\'admin pour validation');

                    const text_choix = 'Une demande de mise à jour de la mémoire utilisateur provient d\'Osélia, il faut vérifier manuellement ce qui a été proposé.<br><br>' +
                        '<ul><li>User_id cible : <b>"' + user_id + '"</b></li>' +
                        '<li>Clé : <b>"' + key + '"</b></li>' +
                        '<li>Contenu : <b>"' + value + '"</b></li></ul>';
                    ConsoleHandler.warn('OseliaUserMemServerController:set_mem:' + text_choix);

                    await TeamsAPIServerController.send_teams_oselia_action_needed(
                        (ConfigurationService.node_configuration.is_main_prod_env ? '' : '[TEST] ') + 'Osélia a besoin d\'assistance pour une mise à jour de mémoire utilisateur',
                        text_choix,
                        thread_vo.id);
                }

                // On ne fait pas la mise à jour de la mémoire, mais on indique à Osélia que la mémoire a été mise à jour
                return 'L\'élément de mémoire a bien été mis à jour. Le traitement est terminé.';
            }

            // On va mettre à jour la mémoire de l'utilisateur
            // On cherche la clé en base si elle existe déjà
            const existing_entry: OseliaUserMemVO = await query(OseliaUserMemVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<OseliaUserMemVO>().user_id, user_id_to_use)
                .filter_by_text_eq(field_names<OseliaUserMemVO>().key, key)
                .exec_as_server()
                .select_vo<OseliaUserMemVO>();

            if (existing_entry) {
                // On met à jour la valeur
                existing_entry.value = value;
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(existing_entry);
                return 'L\'élément de mémoire a bien été mis à jour. Le traitement est terminé.';
            }

            // On crée une nouvelle entrée
            const new_entry: OseliaUserMemVO = new OseliaUserMemVO();
            new_entry.user_id = user_id_to_use;
            new_entry.key = key;
            new_entry.value = value;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(new_entry);
            return 'L\'élément de mémoire a bien été créé. Le traitement est terminé.';
        } catch (error) {
            ConsoleHandler.error('OseliaUserMemServerController:set_mem:' + error);
            return error;
        }
    }
}