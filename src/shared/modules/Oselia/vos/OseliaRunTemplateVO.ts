import NumRange from '../../DataRender/vos/NumRange';
import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class OseliaRunTemplateVO implements IDistantVOBase, IVersionedVO {

    public static ASK_ASSISTANT_OSELIA_RUN_TEMPLATE: string = "Question posée à Osélia";
    public static NEW_DATA_FOR_SUPERVISOR_OSELIA_RUN_TEMPLATE: string = "Nouvelles infos pour le superviseur";

    public static API_TYPE_ID: string = "oselia_run_template";

    public id: number;
    public _type: string = OseliaRunTemplateVO.API_TYPE_ID;

    /**
     * Nom du template - pour affichage dans l'interface
     */
    public name: string;

    /**
     * Les runs enfants de ce run, dans le cas ou ce run est de type Agent
     */
    public children: NumRange[];


    /**
     * Point d'entrée de l'agent
     */
    public entry_point_id: number;

    /**
     * L'assistant qui devra prendre en charge ce run
     */
    public assistant_id: number;

    /**
     * L'assistant par défaut pour les discussions Oselia sur ce thread si on crée un nouveau thread
     */
    public oselia_thread_default_assistant_id: number;

    /**
     * Le titre du thread dans le cas d'une création d'un thread - template utilisant les params des mails
     *   dont on peut mettre une trad ou un paramètre (les paramètres sont ceux de initial_prompt_parameters)
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
     * Soit on a un context_text, soit on a un prompt_id et les paramètres associés
     */
    public initial_content_text: string;

    /**
     * Soit on a un context_text, soit on a un prompt_id et les paramètres associés
     */
    public initial_prompt_id: number;

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
     * Statut du run - on se le met en template pour permettre de déclarer une arbo de run, dont le splitter est déjà résolu par exemple
     */
    public state: number;

    /**
     * Est-ce qu'on utilise le validateur pour ce run ?
     *  TODO : gérer des validation auto et manuelles
     */
    public use_validator: boolean;

    /**
     * La tâche parente de ce run - permet de construire une arborescence de tâches directement en template de run
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

    public parent_id: number;
    public trashed: boolean;
    public version_num: number;
    public version_author_id: number;
    public version_timestamp: number;
    public version_edit_author_id: number;
    public version_edit_timestamp: number;
}