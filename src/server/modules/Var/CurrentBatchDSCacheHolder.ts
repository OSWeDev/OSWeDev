
export default class CurrentBatchDSCacheHolder {

    /**
     * Le cache des datasources lié au batch actuel
     */
    public static current_batch_ds_cache: { [ds_name: string]: { [ds_data_index: string]: any } } = {};
}