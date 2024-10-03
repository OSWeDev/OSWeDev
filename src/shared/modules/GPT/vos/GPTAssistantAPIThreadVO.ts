
import IDistantVOBase from '../../IDistantVOBase';
import GPTAssistantAPIToolResourcesVO from './GPTAssistantAPIToolResourcesVO';

export default class GPTAssistantAPIThreadVO implements IDistantVOBase {

    public static OSELIA_THREAD_TITLE_BUILDER_ASSISTANT_NAME: string = 'Oselia - Thread Title Builder';
    public static OSELIA_THREAD_HELPER_ASSISTANT_NAME: string = "Helper";
    public static API_TYPE_ID: string = "gpt_assistant_thread";

    public id: number;
    public _type: string = GPTAssistantAPIThreadVO.API_TYPE_ID;

    public user_id: number;

    public gpt_thread_id: string;
    public current_default_assistant_id: number;

    /**
     * Un run est en cours sur ce thread
     */
    public oselia_is_running: boolean;

    /**
     * L'assistant qui est en train de répondre
     */
    public current_oselia_assistant_id: number;

    /**
     * Le prompt auquel l'assistant est en train de répondre
     */
    public current_oselia_prompt_id: number;

    // The Unix timestamp (in seconds) for when the thread was created.
    public created_at: number;

    /**
     * A set of resources that are made available to the assistant's tools in this thread.
     * The resources are specific to the type of tool.
     * For example, the code_interpreter tool requires a list of file IDs, while the file_search tool requires a list of vector store IDs.
     */
    public tool_resources: GPTAssistantAPIToolResourcesVO;

    /**
     * Set of 16 key-value pairs that can be attached to an object.
     * This can be useful for storing additional information about the object in a structured format.
     * Keys can be a maximum of 64 characters long and values can be a maxium of 512 characters long.
     */
    public metadata: unknown;

    public archived: boolean;

    /**
     * Titre de la discussion, construit à partir des 100 premiers mots de la discussion
     *  et dès les premiers mots ajoutés, on commence à le construire, et on affine au fur et à mesure des mots ajoutés jusqu'au 100ème mot.
     */
    public thread_title: string;

    /**
     * Semaphore de reconstruction du titre de la discussion déclenché quand on ajoute un message à une discussion dont le titre n'est pas thread_title_auto_build_locked
     * et que le nombre de messages de la discussion est supérieur ou égal à 2.
     */
    public needs_thread_title_build: boolean;

    /**
     * Init à false lors de la création d'un nouveau thread, sauf à fournir un titre lors de la création, on le fait passer à true quand dans le trigger de build du titre
     * on a déjà au mois 100 mots dans la discussion. à ce stade on considère que le titre construit est fiable.
     */
    public thread_title_auto_build_locked: boolean;

    /**
     * Tant qu'on a aucun contenu dans une discussion, on ne l'affiche pas dans les listes de discussions et on la supprimera automatiquement
     * si elle reste vide pendant plus de Xh.
     */
    public has_content: boolean;

    /**
     * Permet de savoir si un run est potientiellement prêt à être traité sur ce thread
     *  en gros c'est à false par défaut, on passe à true sur toute modif/création/suppression de run
     *  et le bgthread repasse à false si après vérif on est toujours bloqué par un process en cours
     *  ça permet juste de pas bloquer le bgthread sur des threads qui sont stucks pour x,y raisons (par exemple on coupe le serveur au milieu du traitement, si on reprend pas sur erreur, c'est stuck)
     */
    public has_no_run_ready_to_handle: boolean;

    /**
     * Lien vers le run en cours côté GPT, ou le dernier run en date
     */
    public last_gpt_run_id: number;

    public oswedev_created_at: number;
}