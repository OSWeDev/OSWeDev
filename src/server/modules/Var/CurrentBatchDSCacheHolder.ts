import VarDAGNode from "./vos/VarDAGNode";

export default class CurrentBatchDSCacheHolder {

    /**
     * Le cache des datasources lié au batch actuel
     */
    public static current_batch_ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } } = {};
    public static semaphore_batch_ds_cache: { [ds_name: string]: { [ds_data_index: string]: boolean } } = {};

    public static nodes_waiting_for_semaphore: { [ds_name: string]: { [date_index: string]: { [var_data_index: string]: VarDAGNode } } } = {};
    public static promises_waiting_for_semaphore: { [ds_name: string]: { [date_index: string]: { [var_data_index: string]: any } } } = {};

    /**
     * Le cache des promises en attente d'event pour les résolution de segments de données
     */
    public static semaphore_event_listener_promise: { [ds_name: string]: { [ds_data_index: string]: Promise<unknown> } } = {};
}