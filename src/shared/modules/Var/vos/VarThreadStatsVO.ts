import IDistantVOBase from '../../IDistantVOBase';
import VarBatchPerfVO from './VarBatchPerfVO';

export default class VarThreadStatsVO implements IDistantVOBase {
    public static API_TYPE_ID: string = "var_thread_stats";

    public _type: string = VarThreadStatsVO.API_TYPE_ID;
    public id: number;

    /**
     * Est-ce que le système est en cours de calcul
     */
    public computebgthread_is_computing: boolean;

    /**
     * Si un batch est en cours : l'ID du batch
     */
    public current_batch_id: number;

    /**
     * Si un batch est en cours : le nombre de noeuds (actuel) de l'arbre
     */
    public current_batch_vardag_nb_nodes: number;

    /**
     * Si un batch est en cours : les perfs (actuelles) du batch
     */
    public current_batch_perf: VarBatchPerfVO;

    /**
     * La taille du cache des vars
     */
    public vars_datas_buffer_size: number;

    /**
     * La date de mise en cache la plus ancienne
     */
    public vars_datas_buffer_oldest_data: number;

    /**
     * La date de mise en cache la plus récente
     */
    public vars_datas_buffer_earliest_data: number;

    /**
     * Le temps moyen d'attente actuel dans les vars du cache
     */
    public vars_datas_buffer_mean_data_age_ms: number;
}