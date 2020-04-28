import IBGThread from './interfaces/IBGThread';

export default class BGThreadServerController {

    public static ForkedProcessType: string = "BGT";

    public static getInstance() {
        if (!BGThreadServerController.instance) {
            BGThreadServerController.instance = new BGThreadServerController();
        }
        return BGThreadServerController.instance;
    }

    private static instance: BGThreadServerController = null;

    public registered_BGThreads: { [name: string]: IBGThread } = {};

    public register_bgthreads: boolean = false;
    public run_bgthreads: boolean = false;
    public valid_bgthreads_names: { [name: string]: boolean } = {};
    public server_ready: boolean = false;

    private constructor() { }
}