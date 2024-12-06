import IBGThread from "./interfaces/IBGThread";

export default class BGThreadServerDataManager {

    public static ForkedProcessType: string = "BGT";

    /**
     * Local thread cache -----
     */
    public static valid_bgthreads_names: { [name: string]: boolean } = {};
    public static registered_BGThreads: { [name: string]: IBGThread } = {};
}