
export default class DaoStoreTypeWatcherDefinition {

    public API_TYPE_ID: string;
    public UID: string;
    public handler: () => Promise<void>;
}