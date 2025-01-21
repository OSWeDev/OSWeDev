import EventsController from "../../modules/Eventify/EventsController";
import EventifyEventInstanceVO from "../../modules/Eventify/vos/EventifyEventInstanceVO";
import EventifyEventListenerInstanceVO from "../../modules/Eventify/vos/EventifyEventListenerInstanceVO";
import Dates from "../../modules/FormatDatesNombres/Dates/Dates";
import StatsController from "../../modules/Stats/StatsController";
import ConsoleHandler from "../ConsoleHandler";
import EnvHandler from "../EnvHandler";
import ThreadHandler from "../ThreadHandler";

export default class PromisePipeline {

    public static EMPTY_PIPELINE_EVENT_NAME_PREFIX: string = 'PromisePipeline.empty_pipeline.';

    public static DEBUG_PROMISE_PIPELINE_WORKER_STATS: boolean = false;

    private static promise_pipeline_semaphores_by_stat_name: { [stat_name: string]: PromisePipeline } = {};

    private static all_promise_pipelines_by_uid: { [uid: number]: PromisePipeline } = {};
    private static GLOBAL_UID: number = 0;

    private uid: number = 0;
    private cb_uid: number = 0;
    // private semaphore_check_wrapped_cbs: boolean = false;

    private nb_running_promises: number = 0;
    private all_waiting_and_running_promises_by_cb_uid: { [cb_uid: number]: Promise<any> } = {};
    // private all_running_promises_by_cb_uid: Array<Promise<any>> = [];

    /**
     * Pipeline de promesses, qui permet de limiter le nombre de promesses en parallèle, mais d'en ajouter
     *  autant qu'on veut, et de les exécuter dès qu'il y a de la place dans le pipeline
     * @param max_concurrent_promises Max number of concurrent promises. Defaults to 1
     * @param stat_name Register stats for this Pipeline, using this sub category name
     * @param stat_worker Register a worker that records pipeline current size every 10 seconds. BEWARE: This worker is not stopped when the pipeline is destroyed. Use only on permanent pipelines
     */
    public constructor(
        public max_concurrent_promises: number = 1,
        public stat_name: string = null,
        public stat_worker: boolean = false,
    ) {
        this.uid = PromisePipeline.GLOBAL_UID++;

        // Dès qu'on a une stat, on lance le worker. Si il est déjà lancé ça aura pas d'impact
        if (StatsController.ACTIVATED && this.stat_name && this.stat_worker) {
            ThreadHandler.set_interval(
                'PromisePipeline.stat_all_promise_pipelines',
                PromisePipeline.stat_all_promise_pipelines,
                10000,
                'PromisePipeline.stat_worker',
                true);
        }
    }

    get free_slot_event_name(): string {
        return 'PromisePipeline.free_slot_event_' + this.uid;
    }

    get has_running_or_waiting_promises(): boolean {
        return (this.nb_running_promises > 0) || (Object.keys(this.all_waiting_and_running_promises_by_cb_uid).length > 0);
    }

    /**
     * The stat_name is used to recover an existing pipeline of this stat_name, and the max_concurrent_promises is ignored (it will use the existing pipeline max_concurrent_promises)
     * @param stat_name
     * @param max_concurrent_promises
     * @param stat_worker
     */
    public static get_semaphore_pipeline(
        stat_name: string,
        max_concurrent_promises: number = 1,
        stat_worker: boolean = false,
    ): PromisePipeline {

        if (!PromisePipeline.promise_pipeline_semaphores_by_stat_name[stat_name]) {
            const this_pipeline = new PromisePipeline(max_concurrent_promises, stat_name, stat_worker);
            PromisePipeline.promise_pipeline_semaphores_by_stat_name[stat_name] = this_pipeline;
        }

        return PromisePipeline.promise_pipeline_semaphores_by_stat_name[stat_name];
    }

    private static stat_all_promise_pipelines() {
        let n = 0;
        for (const uid in PromisePipeline.all_promise_pipelines_by_uid) {
            const promise_pipeline = PromisePipeline.all_promise_pipelines_by_uid[uid];
            n++;

            if (!!promise_pipeline.stat_name) {
                StatsController.register_stat_QUANTITE('PromisePipeline', promise_pipeline.stat_name, 'RUNNING', promise_pipeline.nb_running_promises);
                StatsController.register_stat_QUANTITE('PromisePipeline', promise_pipeline.stat_name, 'EMPTY_SLOTS', promise_pipeline.max_concurrent_promises - promise_pipeline.nb_running_promises);
                if (PromisePipeline.DEBUG_PROMISE_PIPELINE_WORKER_STATS) {
                    ConsoleHandler.log('PromisePipeline:STATS:' + promise_pipeline.stat_name + ':' + promise_pipeline.uid + ':' + promise_pipeline.nb_running_promises);
                }

            }
        }

        StatsController.register_stat_QUANTITE('PromisePipeline', 'all_promise_pipelines', 'NB', n);
        if (PromisePipeline.DEBUG_PROMISE_PIPELINE_WORKER_STATS) {
            ConsoleHandler.log('PromisePipeline:all_promise_pipelines:NB:' + n);
        }
    }

    public async await_free_slot(): Promise<void> {
        if (this.has_free_slot()) {
            return;
        }

        if (this.stat_name) {
            StatsController.register_stat_COMPTEUR('PromisePipeline', this.stat_name, 'await_free_slot');
        }

        const time_in = Dates.now_ms();

        return new Promise(async (resolve, reject) => {

            EventsController.on_next_event(
                this.free_slot_event_name,
                (async (event: EventifyEventInstanceVO, listener: EventifyEventListenerInstanceVO): Promise<any> => {
                    if (this.stat_name) {
                        StatsController.register_stat_DUREE('PromisePipeline', this.stat_name, 'await_free_slot', Dates.now_ms() - time_in);
                    }

                    resolve();
                }).bind(this));
        });
    }

    /**
     * Objectif : Ajouter une promise au pipeline, mais uniquement quand on aura de la place dans le pipeline
     *      On renvoie la promise de la méthode cb, donc si on await le push on attend que cb soit lancée, et si on await await push on attend que cb soit terminée
     * @param cb la méthode à appeler quand on peut, et qui renverra une promise supplémentaire
     * @returns la promise de la méthode cb
     */
    public async push<T>(cb: () => Promise<T>): Promise<() => Promise<T>> {

        if (!(typeof cb === 'function')) {
            throw new Error(`Unexpected type of callback given : ${typeof cb}`);
        }

        if (EnvHandler.debug_promise_pipeline) {
            ConsoleHandler.log('PromisePipeline.push():PREPUSH:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        if (!PromisePipeline.all_promise_pipelines_by_uid[this.uid]) {
            PromisePipeline.all_promise_pipelines_by_uid[this.uid] = this;
        }

        if (this.stat_name) {
            StatsController.register_stat_COMPTEUR('PromisePipeline', this.stat_name, 'IN', 1);
        }

        let cb_uid = null;
        if (this.has_free_slot()) {

            if (EnvHandler.debug_promise_pipeline) {
                ConsoleHandler.log('PromisePipeline.check_wrapped_cbs():has_free_slot:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
            }

            this.cb_uid++;

            cb_uid = this.cb_uid;

            // Add/Append in the waitlist for each given callback
            this.all_waiting_and_running_promises_by_cb_uid[cb_uid] = this.do_cb(cb, cb_uid);

        } else {

            if (EnvHandler.debug_promise_pipeline) {
                ConsoleHandler.log('PromisePipeline.check_wrapped_cbs():!has_free_slot:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
            }

            if (this.stat_name) {
                StatsController.register_stat_COMPTEUR('PromisePipeline', this.stat_name, 'WAIT');
            }

            const time_in = Dates.now_ms();

            await EventsController.await_next_event_semaphored(this.free_slot_event_name, this.uid.toString());

            // We have a pb with race, it invokes multipleResolve, which is a perf pb : https://github.com/nodejs/node/issues/24321
            // // Wait for a free slot, handle the fastest finished promise
            // await Promise.race(Object.values(this.all_waiting_and_running_promises_by_cb_uid));

            if (this.stat_name) {
                StatsController.register_stat_DUREE('PromisePipeline', this.stat_name, 'WAIT_FOR_PUSH', Dates.now_ms() - time_in);
            }

            if (EnvHandler.debug_promise_pipeline) {
                ConsoleHandler.log('PromisePipeline.check_wrapped_cbs():RACE END:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
            }

            this.cb_uid++;

            cb_uid = this.cb_uid;

            // Add/Append in the waitlist for each given callback
            this.all_waiting_and_running_promises_by_cb_uid[cb_uid] = this.do_cb(cb, cb_uid);
        }

        if (EnvHandler.debug_promise_pipeline) {
            ConsoleHandler.log('PromisePipeline.push():POSTPUSH:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        if (cb_uid === null) {
            throw new Error('Unexpected null cb_uid');
        }

        return async () => this.all_waiting_and_running_promises_by_cb_uid[cb_uid];
    }

    public has_free_slot(): boolean {
        return (this.nb_running_promises < this.max_concurrent_promises);
    }

    /**
     * Objectif : attendre que toutes les promesses soient terminées
     * Soit on a déjà fini, soit on crée une promise qui sera résolue à la fin
     */
    public async end(): Promise<void> {

        if (EnvHandler.debug_promise_pipeline) {
            ConsoleHandler.log('PromisePipeline.end():START:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        while (this.nb_running_promises > 0) {
            if (EnvHandler.debug_promise_pipeline) {
                ConsoleHandler.log('PromisePipeline.end():WAIT:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
            }

            // Promise resolever declaration that
            // will be called when all promises are finished
            await EventsController.await_next_event(PromisePipeline.EMPTY_PIPELINE_EVENT_NAME_PREFIX + this.uid);
        }

        delete PromisePipeline.all_promise_pipelines_by_uid[this.uid];

        if (EnvHandler.debug_promise_pipeline) {
            ConsoleHandler.log('PromisePipeline.end():WAIT END:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }
    }

    private async do_cb(cb: () => Promise<any>, cb_uid: number): Promise<void> {
        this.nb_running_promises++;

        if (!(typeof cb === 'function')) {
            throw new Error(`Unexpected type of callback given : ${typeof cb}`);
        }

        if (EnvHandler.debug_promise_pipeline) {
            ConsoleHandler.log('PromisePipeline.do_cb():BEFORECB:' + this.uid + ':' + cb_uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        try {
            await cb();
        } catch (error) {
            ConsoleHandler.error('PromisePipeline.do_cb():ERROR:' + (error.stack ? error.stack : error) + ':' + cb_uid + ':' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        if (EnvHandler.debug_promise_pipeline) {
            ConsoleHandler.log('PromisePipeline.do_cb():AFTERCB:' + this.uid + ':' + cb_uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        this.nb_running_promises--;

        EventsController.emit_event(EventifyEventInstanceVO.new_event(this.free_slot_event_name));

        // Remove the callback promise from the waitlist
        delete this.all_waiting_and_running_promises_by_cb_uid[cb_uid];

        if (this.stat_name) {
            StatsController.register_stat_COMPTEUR('PromisePipeline', this.stat_name, 'OUT', 1);
        }

        if (this.nb_running_promises === 0) {

            if (EnvHandler.debug_promise_pipeline) {
                ConsoleHandler.log('PromisePipeline.do_cb():END PROMISE:' + this.uid + ':' + cb_uid + ':' + ' [' + this.nb_running_promises + ']');
            }

            EventsController.emit_event(EventifyEventInstanceVO.new_event(PromisePipeline.EMPTY_PIPELINE_EVENT_NAME_PREFIX + this.uid));
        }
    }
}