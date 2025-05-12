import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import GPTAssistantAPIThreadVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO";
import OseliaAppMemVO from "../../../shared/modules/Oselia/vos/OseliaAppMemVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import { field_names } from "../../../shared/tools/ObjectHandler";
import ModuleDAOServer from "../DAO/ModuleDAOServer";

/**
 * La mémoire Osélia globale de l'application a pour but de permettre à l'assistant de comprendre la solution pour laquelle il travaille
 * en particulier le langage métier, la typologie de clients et de produits, les spécificités de l'entreprise, etc.
 */
export default class OseliaAppMemServerController {

    /**
     * Fonction qui permet à l'assistant de récupérer les clés de la mémoire, qui sont sensées être des mots clés décrivant le sujet/but de cette entrée.
     * Par défaut il récupère toutes les entrées
     * @param pattern
     * @param thread_vo
     */
    public static async get_keys(thread_vo: GPTAssistantAPIThreadVO, pattern: string): Promise<string> {

        try {

            if (!pattern) {
                // On renvoie toutes les clés de la mémoire
                const all_entries: OseliaAppMemVO[] = await query(OseliaAppMemVO.API_TYPE_ID)
                    .select_vos<OseliaAppMemVO>();
                if ((!all_entries) || (!all_entries.length)) {
                    return 'Aucune entrée trouvée dans la mémoire de l\'application.';
                }

                const all_keys: string[] = all_entries.map((entry) => entry.key);
                return 'Clés de la mémoire de l\'application : "' + all_keys.join('", "') + '". Il n\'y a pas de filtre sur les clés, toutes les entrées sont retournées.';
            }

            const regexp = new RegExp(pattern);

            if (!regexp) {
                ConsoleHandler.error('OseliaAppMemServerController:get_keys:Le pattern fourni n\'est pas un pattern d\'expression régulière valide');
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
            const entries: OseliaAppMemVO[] = await query(OseliaAppMemVO.API_TYPE_ID)
                .filter_by_reg_exp(field_names<OseliaAppMemVO>().key, pattern)
                .select_vos<OseliaAppMemVO>();
            if ((!entries) || (!entries.length)) {
                return 'Aucune entrée trouvée correspondant au pattern dans la mémoire de l\'application.';
            }

            const keys: string[] = entries.map((entry) => entry.key);
            return 'Clés de la mémoire de l\'application correspondant au pattern : "' + keys.join('", "') + '".';
        } catch (error) {
            ConsoleHandler.error('OseliaAppMemServerController:get_keys:Erreur lors de la récupération des clés de mémoire applicative: ' + error);
            return error;
        }
    }

    /**
     * Fonction qui permet à l'assistant de récupérer les clés/valeurs de la mémoire
     * Par défaut il récupère toutes les entrées
     * @param pattern
     * @param thread_vo
     */
    public static async get_entries(thread_vo: GPTAssistantAPIThreadVO, pattern: string): Promise<string> {

        try {

            if (!pattern) {
                // On renvoie toutes les clés de la mémoire
                const all_entries: OseliaAppMemVO[] = await query(OseliaAppMemVO.API_TYPE_ID)
                    .select_vos<OseliaAppMemVO>();
                if ((!all_entries) || (!all_entries.length)) {
                    return 'Aucune entrée trouvée dans la mémoire de l\'application.';
                }

                return 'Mémoire de l\'application:\n' +
                    JSON.stringify(all_entries, null, 2) +
                    '\nIl n\'y a pas de filtre sur les clés, toutes les entrées sont retournées.';
            }

            const regexp = new RegExp(pattern);

            if (!regexp) {
                ConsoleHandler.error('OseliaAppMemServerController:get_entries:Le pattern fourni n\'est pas un pattern d\'expression régulière valide');
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
            const entries: OseliaAppMemVO[] = await query(OseliaAppMemVO.API_TYPE_ID)
                .filter_by_reg_exp(field_names<OseliaAppMemVO>().key, pattern)
                .select_vos<OseliaAppMemVO>();
            if ((!entries) || (!entries.length)) {
                return 'Aucune entrée trouvée correspondant au pattern dans la mémoire de l\'application.';
            }

            return 'Mémoire de l\'application correspondant au pattern:\n' +
                JSON.stringify(entries, null, 2);
        } catch (error) {
            ConsoleHandler.error('OseliaAppMemServerController:get_entries:Erreur lors de la récupération des clés de mémoire applicative: ' + error);
            return error;
        }
    }

    /**
     * La mise à jour de la mémoire
     * @param thread_vo
     * @param key
     * @param value
     * @returns
     */
    public static async set_mem(thread_vo: GPTAssistantAPIThreadVO, key: string, value: string): Promise<string> {

        try {

            if (!key) {
                ConsoleHandler.error('OseliaAppMemServerController:set_mem:Paramètre key manquant');
                return 'Erreur : Paramètre key manquant. Il est obligatoire de fournir ce paramètre.';
            }

            if (!value) {
                ConsoleHandler.error('OseliaAppMemServerController:set_mem:Paramètre value manquant');
                return 'Erreur : Paramètre value manquant. Il est obligatoire de fournir ce paramètre.';
            }

            /**
             * On fait la modif dans tous les cas
             *
             * TODO On devrait checker le rôle de l'utilisateur qui fait la demande
             */

            // On va mettre à jour la mémoire
            // On cherche la clé en base si elle existe déjà
            const existing_entry: OseliaAppMemVO = await query(OseliaAppMemVO.API_TYPE_ID)
                .filter_by_text_eq(field_names<OseliaAppMemVO>().key, key)
                .exec_as_server()
                .select_vo<OseliaAppMemVO>();

            if (existing_entry) {
                // On met à jour la valeur
                existing_entry.value = value;
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(existing_entry);
                return 'L\'élément de mémoire a bien été mis à jour. Le traitement est terminé.';
            }

            // On crée une nouvelle entrée
            const new_entry: OseliaAppMemVO = new OseliaAppMemVO();
            new_entry.key = key;
            new_entry.value = value;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(new_entry);
            return 'L\'élément de mémoire a bien été créé. Le traitement est terminé.';
        } catch (error) {
            ConsoleHandler.error('OseliaAppMemServerController:set_mem:' + error);
            return error;
        }
    }
}