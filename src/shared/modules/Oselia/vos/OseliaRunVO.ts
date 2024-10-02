import NumRange from '../../DataRender/vos/NumRange';
import IDistantVOBase from '../../IDistantVOBase';
import IVersionedVO from '../../Versioned/interfaces/IVersionedVO';

export default class OseliaRunVO implements IDistantVOBase, IVersionedVO {
    public static API_TYPE_ID: string = "oselia_run";

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


    public id: number;
    public _type: string = OseliaRunVO.API_TYPE_ID;

    /**
     * Nom de l'étape - pour affichage dans l'interface
     */
    public name: string;

    /**
     * L'assistant qui devra prendre en charge ce run
     */
    public assistant_id: number;

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
     */
    public hide_prompt: boolean;

    /**
     * Cacher les messages de l'étape
     */
    public hide_outputs: boolean;

    /**
     * Soit on a un context_text, soit on a un prompt_id et les paramètres associés
     */
    public content_text: string;

    /**
     * Soit on a un context_text, soit on a un prompt_id et les paramètres associés
     */
    public prompt_id: number;
    public prompt_parameters: { [param_name: string]: string };

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
     */
    public use_splitter: boolean;

    /**
     * Est-ce qu'on utilise le validateur pour ce run ?
     *  TODO : gérer des validation auto et manuelles
     */
    public use_validator: boolean;


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