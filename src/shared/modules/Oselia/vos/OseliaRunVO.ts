import NumRange from '../../DataRender/vos/NumRange';
import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class OseliaRunVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_run";

    public static RUN_TYPE_LABELS: string[] = [
        "OseliaRunVO.RUN_TYPE_ASSISTANT",
        "OseliaRunVO.RUN_TYPE_FOREACH_IN_SEPARATED_THREADS",
    ];
    public static RUN_TYPE_ASSISTANT: number = 0;
    public static RUN_TYPE_FOREACH_IN_SEPARATED_THREADS: number = 1;

    public static STATE_LABELS: string[] = [
        "OseliaRunVO.STATE_TODO",
        "OseliaRunVO.STATE_SPLITTING",
        "OseliaRunVO.STATE_SPLIT_ENDED",
        "OseliaRunVO.STATE_WAITING_SPLITS_END",
        "OseliaRunVO.STATE_WAIT_SPLITS_END_ENDED",
        "OseliaRunVO.STATE_RUNNING",
        "OseliaRunVO.STATE_RUN_ENDED",
        "OseliaRunVO.STATE_VALIDATING",
        "OseliaRunVO.STATE_VALIDATION_ENDED",
        "OseliaRunVO.STATE_DONE",
        "OseliaRunVO.STATE_ERROR",
        "OseliaRunVO.STATE_CANCELLED",
        "OseliaRunVO.STATE_EXPIRED",
        "OseliaRunVO.STATE_NEEDS_RERUN",
        "OseliaRunVO.STATE_RERUN_ASKED"
    ];
    public static STATE_TODO: number = 0;
    public static STATE_SPLITTING: number = 1;
    public static STATE_SPLIT_ENDED: number = 2;
    public static STATE_WAITING_SPLITS_END: number = 3;
    public static STATE_WAIT_SPLITS_END_ENDED: number = 4;
    public static STATE_RUNNING: number = 5;
    public static STATE_RUN_ENDED: number = 6;
    public static STATE_VALIDATING: number = 7;
    public static STATE_VALIDATION_ENDED: number = 8;
    public static STATE_DONE: number = 9;
    public static STATE_ERROR: number = 10;
    public static STATE_CANCELLED: number = 11;
    public static STATE_EXPIRED: number = 12;
    public static STATE_NEEDS_RERUN: number = 13;
    public static STATE_RERUN_ASKED: number = 14;


    public id: number;
    public _type: string = OseliaRunVO.API_TYPE_ID;

    /**
     * Nom du template
     */
    public template_name: string;

    /**
     * Nom de l'étape - pour affichage dans l'interface
     */
    public name: string;

    /**
     * Le template associé à ce run
     */
    public template_id: number;

    /**
     * Le lien vers le RUN GPT qui découle de ce run Osélia pour la partie SPLIT
     */
    public split_gpt_run_id: number;

    /**
     * Le lien vers le RUN GPT qui découle de ce run Osélia pour la partie RUN
     */
    public run_gpt_run_id: number;

    /**
     * Le lien vers le RUN GPT qui découle de ce run Osélia pour la partie VALIDATION
     */
    public validation_gpt_run_id: number;

    /**
     * L'assistant qui devra prendre en charge ce run
     */
    public assistant_id: number;

    /**
     * L'assistant par défaut pour les discussions Oselia sur ce thread si on crée un nouveau thread
     */
    public oselia_thread_default_assistant_id: number;

    /**
     * Referrer
     */
    public referrer_id: number;

    /**
     * Le thread associé à ce run. Si null, on le crée, et on peut le créer avec un titre
     */
    public thread_id: number;

    /**
     * Le titre du thread dans le cas d'une création d'un thread
     */
    public thread_title: string;

    /**
     * Cacher le prompt de l'étape
     *  Attention sur un split ou un validate on masque toujours le prompt
     */
    public hide_prompt: boolean;

    /**
     * Cacher les messages de l'étape
     */
    public hide_outputs: boolean;

    /**
     * Soit on a un context_text, soit on a un prompt_id et les paramètres associés
     */
    public initial_content_text: string;

    /**
     * Soit on a un context_text, soit on a un prompt_id et les paramètres associés
     */
    public initial_prompt_id: number;
    public initial_prompt_parameters: { [param_name: string]: string };

    /**
     * Une fois l'init faite avec soit un prompt soit un text, on stocke le prompt défini ici
     */
    public initialised_run_prompt: string;

    /**
     * Quand on a le prompt initialisé, si on est sur un split, on stocke le prompt du split + le prompt initialisé
     *  pour obtenir le prompt final qui est réellement envoyé à l'assistant pour le split
     *      dans le cas du run, donc si il n'y a pas de split, on a juste le initialised_prompt qui correspond au prompt final
     * Ca permet de pouvoir suivre l'évolution des prompts de split par exemple et de suivre l'impact des modifs. On historise les prompts
     */
    public initialised_splitter_prompt: string;

    /**
     * Quand on a le prompt initialisé, si on est sur une validation, on stocke le prompt du validateur + le prompt initialisé
     *  pour obtenir le prompt final qui est réellement envoyé à l'assistant pour la validation
     * Ca permet de pouvoir suivre l'évolution des prompts de split par exemple et de suivre l'impact des modifs. On historise les prompts
     */
    public initialised_validator_prompt: string;

    /**
     * Utilisateur qui initie la demande, si null, c'est le système
     */
    public user_id: number;

    /**
     * Les fichiers associés à ce run
     */
    public file_id_ranges: NumRange[];


    /**
     * Est-ce qu'on découpe ce run en plusieurs runs ?
     *  Si on split, on ne run pas, c'est l'un ou l'autre
     */
    public use_splitter: boolean;

    /**
     * Est-ce qu'on utilise le validateur pour ce run ?
     *  TODO : gérer des validation auto et manuelles
     */
    public use_validator: boolean;

    /**
     * Type de run (assistant, foreach, ...)
     */
    public run_type: number;

    /**
     * Cache key pour la map/tableau utilisé par le foreach
     *  defaults to "FOR_EACH_ARRAY" si null
     */
    public for_each_array_cache_key: string;

    /**
     * Cache key pour l'index de l'élément de map tableau à utiliser pour chaque élément du foreach (nécéssite un new_thread dans cette configuration d'usage du cache)
     *  defaults to "FOR_EACH_INDEX" si null
     */
    public for_each_index_cache_key: string;

    /**
     * Cache key pour l'élément de map tableau à utiliser pour chaque élément du foreach (nécéssite un new_thread dans cette configuration d'usage du cache)
     *  defaults to "FOR_EACH_ELEMENT" si null
     */
    public for_each_element_cache_key: string;

    /**
     * Template de run pour chaque élément du foreach
     */
    public for_each_element_run_template_id: number;

    /**
     * Sur un FOR_EACH on passe aussi le parent_thread_id dans la clé PARENT_THREAD_ID (ou la clé indiquée dans ce paramètre)
     */
    public for_each_parent_thread_id_cache_key: string;

    /**
     * Date à laquelle on a débuté le run
     */
    public start_date: number;

    /**
     * Date à laquelle on a débuté le découpage du run
     */
    public split_start_date: number;

    /**
     * Date à laquelle on a terminé le découpage du run
     */
    public split_end_date: number;

    /**
     * Date de début d'attente des runs enfants
     */
    public waiting_split_end_start_date: number;

    /**
     * Date de fin d'attente des runs enfants
     */
    public waiting_split_end_end_date: number;

    /**
     * Date de début du run (entre le split potentiel et la validation)
     */
    public run_start_date: number;

    /**
     * Date de fin du run (entre le split potentiel et la validation)
     */
    public run_end_date: number;

    /**
     * Date à laquelle on a débuté la validation du run
     */
    public validation_start_date: number;

    /**
     * Date à laquelle on a terminé la validation du run
     */
    public validation_end_date: number;

    /**
     * Date à laquelle on a fermé le run
     */
    public end_date: number;

    /**
     * Statut du run
     */
    public state: number;

    /**
     * La tâche parente de ce run (typiquement le panificateur précédent a créé ce run)
     */
    public parent_run_id: number;

    /**
     * Pour ordonner les runs
     */
    public weight: number;

    /**
     * Option permettant de lancer les enfants en parallèle sans attendre la fin de l'un pour lancer l'autre
     */
    public childrens_are_multithreaded: boolean;

    /**
     * Le lien vers l'évènement qui a instancié ce run (si il y en a un)
     */
    public event_id: number;

    /**
     * Le lien vers le listener qui a instancié ce run (si il y en a un)
     */
    public listener_id: number;

    public error_msg: string;

    public rerun_reason: string;
    public rerun_new_initial_prompt: string;
    public rerun_name: string;
    public rerun_of_run_id: number;
    public rerun_ask_date: number;

    /**
     * FIXME todo on doit pouvoir planifier des runs facilement dans le temps, pour lancer dans 10 minutes par exemple une relance si on a pas eu de réponse à une question, ... et escalader en envoyant un mail ...
     */


    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}