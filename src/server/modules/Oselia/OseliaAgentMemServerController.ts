import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import GPTAssistantAPIThreadVO from "../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO";
import OseliaAgentMemVO from "../../../shared/modules/Oselia/vos/OseliaAgentMemVO";
import OseliaRunTemplateVO from "../../../shared/modules/Oselia/vos/OseliaRunTemplateVO";
import OseliaRunVO from "../../../shared/modules/Oselia/vos/OseliaRunVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import { field_names } from "../../../shared/tools/ObjectHandler";
import ModuleDAOServer from "../DAO/ModuleDAOServer";

/**
 * La mémoire Osélia liée à l'agent a pour but de permettre à l'assistant de se souvenir des éléments liés à son propre fonctionnement,
 * des informations utiles par exemple pour effectuer la tâche demandée.
 * Il s'agit d'une mémoire persistante entre les différentes sessions de l'assistant.
 * Pour le moment, la mémoire est liée systématiquement au dernier agent du thread (celui qui a été lié à last_oselia_run_id)
 */
export default class OseliaAgentMemServerController {

    /**
     * Fonction qui permet à l'assistant de récupérer les clés de la mémoire, qui sont sensées être des mots clés décrivant le sujet/but de cette entrée.
     * Par défaut il récupère toutes les entrées
     * @param pattern
     * @param thread_vo
     */
    public static async get_keys(thread_vo: GPTAssistantAPIThreadVO, pattern: string): Promise<string> {

        try {

            if (!thread_vo.last_oselia_run_id) {
                ConsoleHandler.error('OseliaAgentMemServerController:get_keys:Aucun agent trouvé dans le thread : ' + thread_vo.id);
                return 'Erreur : Aucun agent trouvé dans le thread : ' + thread_vo.id;
            }

            const agent_id = await this.get_parent_template_agent_id(thread_vo.last_oselia_run_id);

            if (!agent_id) {
                ConsoleHandler.error('OseliaAgentMemServerController:get_keys:Aucun agent trouvé avec l\'id : ' + thread_vo.last_oselia_run_id);
                return 'Erreur : Aucun agent trouvé avec l\'id : ' + thread_vo.last_oselia_run_id;
            }

            if (!pattern) {
                // On renvoie toutes les clés de la mémoire
                const all_entries: OseliaAgentMemVO[] = await query(OseliaAgentMemVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<OseliaAgentMemVO>().agent_id, agent_id)
                    .select_vos<OseliaAgentMemVO>();
                if ((!all_entries) || (!all_entries.length)) {
                    return 'Aucune entrée trouvée dans la mémoire de l\'agent.';
                }

                const all_keys: string[] = all_entries.map((entry) => entry.key);
                return 'Clés de la mémoire de l\'agent : "' + all_keys.join('", "') + '". Il n\'y a pas de filtre sur les clés, toutes les entrées sont retournées.';
            }

            const regexp = new RegExp(pattern);

            if (!regexp) {
                ConsoleHandler.error('OseliaAgentMemServerController:get_keys:Le pattern fourni n\'est pas un pattern d\'expression régulière valide');
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
            const entries: OseliaAgentMemVO[] = await query(OseliaAgentMemVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<OseliaAgentMemVO>().agent_id, agent_id)
                .filter_by_reg_exp(field_names<OseliaAgentMemVO>().key, pattern)
                .select_vos<OseliaAgentMemVO>();
            if ((!entries) || (!entries.length)) {
                return 'Aucune entrée trouvée correspondant au pattern dans la mémoire de l\'agent.';
            }

            const keys: string[] = entries.map((entry) => entry.key);
            return 'Clés de la mémoire de l\'agent correspondant au pattern : "' + keys.join('", "') + '".';
        } catch (error) {
            ConsoleHandler.error('OseliaAgentMemServerController:get_keys:Erreur lors de la récupération des clés de mémoire agent: ' + error);
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

            if (!thread_vo.last_oselia_run_id) {
                ConsoleHandler.error('OseliaAgentMemServerController:get_entries:Aucun agent trouvé dans le thread : ' + thread_vo.id);
                return 'Erreur : Aucun agent trouvé dans le thread : ' + thread_vo.id;
            }

            const agent_id = await this.get_parent_template_agent_id(thread_vo.last_oselia_run_id);

            if (!agent_id) {
                ConsoleHandler.error('OseliaAgentMemServerController:get_entries:Aucun agent trouvé avec l\'id : ' + thread_vo.last_oselia_run_id);
                return 'Erreur : Aucun agent trouvé avec l\'id : ' + thread_vo.last_oselia_run_id;
            }

            if (!pattern) {
                // On renvoie toutes les clés de la mémoire
                const all_entries: OseliaAgentMemVO[] = await query(OseliaAgentMemVO.API_TYPE_ID)
                    .filter_by_num_eq(field_names<OseliaAgentMemVO>().agent_id, agent_id)
                    .select_vos<OseliaAgentMemVO>();
                if ((!all_entries) || (!all_entries.length)) {
                    return 'Aucune entrée trouvée dans la mémoire de l\'agent.';
                }

                return 'Mémoire de l\'agent:\n' +
                    JSON.stringify(all_entries, null, 2) +
                    '\nIl n\'y a pas de filtre sur les clés, toutes les entrées sont retournées.';
            }

            const regexp = new RegExp(pattern);

            if (!regexp) {
                ConsoleHandler.error('OseliaAgentMemServerController:get_entries:Le pattern fourni n\'est pas un pattern d\'expression régulière valide');
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
            const entries: OseliaAgentMemVO[] = await query(OseliaAgentMemVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<OseliaAgentMemVO>().agent_id, agent_id)
                .filter_by_reg_exp(field_names<OseliaAgentMemVO>().key, pattern)
                .select_vos<OseliaAgentMemVO>();
            if ((!entries) || (!entries.length)) {
                return 'Aucune entrée trouvée correspondant au pattern dans la mémoire de l\'agent.';
            }

            return 'Mémoire de l\'agent correspondant au pattern:\n' +
                JSON.stringify(entries, null, 2);
        } catch (error) {
            ConsoleHandler.error('OseliaAgentMemServerController:get_entries:Erreur lors de la récupération des clés de mémoire agent: ' + error);
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

            if (!thread_vo.last_oselia_run_id) {
                ConsoleHandler.error('OseliaAgentMemServerController:set_mem:Aucun agent trouvé dans le thread : ' + thread_vo.id);
                return 'Erreur : Aucun agent trouvé dans le thread : ' + thread_vo.id;
            }

            const agent_id = await this.get_parent_template_agent_id(thread_vo.last_oselia_run_id);

            if (!agent_id) {
                ConsoleHandler.error('OseliaAgentMemServerController:set_mem:Aucun agent trouvé avec l\'id : ' + thread_vo.last_oselia_run_id);
                return 'Erreur : Aucun agent trouvé avec l\'id : ' + thread_vo.last_oselia_run_id;
            }

            if (!key) {
                ConsoleHandler.error('OseliaAgentMemServerController:set_mem:Paramètre key manquant');
                return 'Erreur : Paramètre key manquant. Il est obligatoire de fournir ce paramètre.';
            }

            if (!value) {
                ConsoleHandler.error('OseliaAgentMemServerController:set_mem:Paramètre value manquant');
                return 'Erreur : Paramètre value manquant. Il est obligatoire de fournir ce paramètre.';
            }

            /**
             * On fait la modif dans tous les cas
             *
             * TODO On devrait checker le rôle de l'utilisateur qui fait la demande
             */

            // On va mettre à jour la mémoire
            // On cherche la clé en base si elle existe déjà
            const existing_entry: OseliaAgentMemVO = await query(OseliaAgentMemVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<OseliaAgentMemVO>().agent_id, agent_id)
                .filter_by_text_eq(field_names<OseliaAgentMemVO>().key, key)
                .exec_as_server()
                .select_vo<OseliaAgentMemVO>();

            if (existing_entry) {
                // On met à jour la valeur
                existing_entry.value = value;
                await ModuleDAOServer.instance.insertOrUpdateVO_as_server(existing_entry);
                return 'L\'élément de mémoire a bien été mis à jour. Le traitement est terminé.';
            }

            // On crée une nouvelle entrée
            const new_entry: OseliaAgentMemVO = new OseliaAgentMemVO();
            new_entry.agent_id = agent_id;
            new_entry.key = key;
            new_entry.value = value;
            await ModuleDAOServer.instance.insertOrUpdateVO_as_server(new_entry);
            return 'L\'élément de mémoire a bien été créé. Le traitement est terminé.';
        } catch (error) {
            ConsoleHandler.error('OseliaAgentMemServerController:set_mem:' + error);
            return error;
        }
    }

    private static async get_parent_template_agent_id(instance_agent_id: number): Promise<number> {
        const agent = await query(OseliaRunVO.API_TYPE_ID)
            .filter_by_id(instance_agent_id)
            .exec_as_server()
            .select_vo<OseliaRunVO>();

        if (!agent) {
            ConsoleHandler.error('OseliaAgentMemServerController:get_parent_template_agent_id:Aucun agent/run trouvé avec l\'id : ' + instance_agent_id);
            return null;
        }

        let template = await query(OseliaRunTemplateVO.API_TYPE_ID)
            .filter_by_id(agent.template_id)
            .exec_as_server()
            .select_vo<OseliaRunTemplateVO>();

        if (!template) {
            ConsoleHandler.error('OseliaAgentMemServerController:get_parent_template_agent_id:Aucun template trouvé avec l\'id : ' + agent.template_id);
            return null;
        }

        while (template && template.parent_run_id) {
            template = await query(OseliaRunTemplateVO.API_TYPE_ID)
                .filter_by_id(template.parent_run_id)
                .exec_as_server()
                .select_vo<OseliaRunTemplateVO>();
        }

        return template.id;
    }
}