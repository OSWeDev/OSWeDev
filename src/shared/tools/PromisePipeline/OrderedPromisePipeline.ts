import Dates from "../../modules/FormatDatesNombres/Dates/Dates";
import StatsController from "../../modules/Stats/StatsController";
import ConsoleHandler from "../ConsoleHandler";
import EnvHandler from "../EnvHandler";

/**
 * Globalement la même idée que le PromisePipeline,
 * mais on sépare 2 partie dans le push : un cb1 qui va être appelé en mode pipeline,
 * et un cb2 qui doit lui être appelé dans un entennoir de largeur 1 et obligatoirement dans l'ordre des push.
 * On ne libère pas le slot tant que le cb2 n'est pas terminé
 * cb1 peut renvoyer un résultat qu'on stocke pour passer en param de cb2
 */
export default class OrderedPromisePipeline {

    private static GLOBAL_UID: number = 0;

    private uid: number = 0;
    private cb1_uid: number = 0;
    private nb_running_promises: number = 0;

    private unstack_cb2s_semaphore: boolean = false;
    private unstack_cb2s_needs_to_retry: boolean = false;

    private cbs1_results_by_cb1_uid: { [cb1_uid: number]: any } = {};
    private cbs2_by_cb1_uid: { [cb1_uid: number]: (cb1_result: any) => Promise<any> } = {};

    // private semaphore_check_wrapped_cb1s: boolean = false;

    private all_waiting_and_running_promises_by_cb1_uid: { [cb1_uid: number]: Promise<any> } = {};
    // private all_running_promises_by_cb1_uid: Array<Promise<any>> = [];

    private end_promise_resolve: (reason?: string) => void | PromiseLike<string> = null;

    private waiting_for_race_resolver: (reason?: string) => void | PromiseLike<string> = null;

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
        public stat_worker: boolean = true
    ) {
        this.uid = OrderedPromisePipeline.GLOBAL_UID++;

        if (this.stat_name) {
            setInterval(() => {
                StatsController.register_stat_QUANTITE('OrderedPromisePipeline', this.stat_name, 'RUNNING', this.nb_running_promises);
            }, 10000);
        }
    }

    /**
     * Objectif : Ajouter une promise au pipeline, mais uniquement quand on aura de la place dans le pipeline
     * @param cb1 la méthode à appeler quand on peut, et qui renverra une promise supplémentaire
     */
    public async push(cb1: () => Promise<any>, cb2: (cb1_results: any) => Promise<any>): Promise<void> {

        if (!(typeof cb1 === 'function')) {
            throw new Error(`Unexpected type of callback given : ${typeof cb1}`);
        }

        if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
            ConsoleHandler.log('OrderedPromisePipeline.push():PREPUSH:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        if (this.stat_name) {
            StatsController.register_stat_COMPTEUR('OrderedPromisePipeline', this.stat_name, 'IN', 1);
        }

        if (this.has_free_slot()) {

            if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
                ConsoleHandler.log('OrderedPromisePipeline.check_wrapped_cb1s():has_free_slot:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
            }

            this.cb1_uid++;

            const cb1_uid = this.cb1_uid;

            this.cbs2_by_cb1_uid[cb1_uid] = cb2;

            // Add/Append in the waitlist for each given callback
            this.all_waiting_and_running_promises_by_cb1_uid[cb1_uid] = this.do_cb1(cb1, cb1_uid);
        } else {

            if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
                ConsoleHandler.log('OrderedPromisePipeline.check_wrapped_cb1s():!has_free_slot:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
            }

            if (this.stat_name) {
                StatsController.register_stat_COMPTEUR('OrderedPromisePipeline', this.stat_name, 'WAIT');
            }

            let time_in = Dates.now_ms();

            let waiting_for_race_promise = new Promise((resolve, reject) => {
                this.waiting_for_race_resolver = resolve;
            });
            await waiting_for_race_promise;

            // We have a pb with race, it invokes multipleResolve, which is a perf pb : https://github.com/nodejs/node/issues/24321
            // // Wait for a free slot, handle the fastest finished promise
            // await Promise.race(Object.values(this.all_waiting_and_running_promises_by_cb1_uid));

            if (this.stat_name) {
                StatsController.register_stat_DUREE('OrderedPromisePipeline', this.stat_name, 'WAIT_FOR_PUSH', Dates.now_ms() - time_in);
            }

            if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
                ConsoleHandler.log('OrderedPromisePipeline.check_wrapped_cb1s():RACE END:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
            }

            this.cb1_uid++;

            const cb1_uid = this.cb1_uid;
            this.cbs2_by_cb1_uid[cb1_uid] = cb2;

            // Add/Append in the waitlist for each given callback
            this.all_waiting_and_running_promises_by_cb1_uid[cb1_uid] = this.do_cb1(cb1, cb1_uid);
        }

        if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
            ConsoleHandler.log('OrderedPromisePipeline.push():POSTPUSH:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }
    }

    /**
     * Objectif : attendre que toutes les promesses soient terminées
     * Soit on a déjà fini, soit on crée une promise qui sera résolue à la fin
     */
    public async end(): Promise<void> {

        if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
            ConsoleHandler.log('OrderedPromisePipeline.end():START:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        if (this.nb_running_promises === 0) {
            if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
                ConsoleHandler.log('OrderedPromisePipeline.end():END:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
            }
            return;
        }

        if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
            ConsoleHandler.log('OrderedPromisePipeline.end():WAIT:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        let self = this;

        // Promise resolever declaration that
        // will be called when all promises are finished
        let wait_for_end = new Promise<string>((resolve, reject) => {
            self.end_promise_resolve = resolve;
        });

        await wait_for_end;

        if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
            ConsoleHandler.log('OrderedPromisePipeline.end():WAIT END:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }
    }

    private async do_cb1(cb1: () => Promise<any>, cb1_uid: number): Promise<void> {
        this.nb_running_promises++;

        if (!(typeof cb1 === 'function')) {
            throw new Error(`Unexpected type of callback given : ${typeof cb1}`);
        }

        if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
            ConsoleHandler.log('OrderedPromisePipeline.do_cb1():BEFORECB1:' + this.uid + ':cb1_name:' + cb1.name + ':' + cb1_uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        try {
            this.cbs1_results_by_cb1_uid[cb1_uid] = await cb1();
        } catch (error) {
            ConsoleHandler.error('OrderedPromisePipeline.do_cb1():ERROR:' + error + ':cb1_name:' + cb1.name + ':' + cb1_uid + ':' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
            ConsoleHandler.log('OrderedPromisePipeline.do_cb1():AFTERCB1:' + this.uid + ':cb1_name:' + cb1.name + ':' + cb1_uid + ':' + ' [' + this.nb_running_promises + ']');
        }


        // Remove the callback promise from the waitlist
        delete this.all_waiting_and_running_promises_by_cb1_uid[cb1_uid];

        // C'est là qu'on peut tenter de dépiler les cb2 dans l'ordre en fonction de ceux qui sont prêts
        await this.unstack_cb2s();

        if (this.stat_name) {
            StatsController.register_stat_COMPTEUR('OrderedPromisePipeline', this.stat_name, 'OUT', 1);
        }
    }

    private has_free_slot(): boolean {
        return (this.nb_running_promises < this.max_concurrent_promises);
    }

    private async unstack_cb2s(): Promise<void> {

        if (this.unstack_cb2s_semaphore) {
            this.unstack_cb2s_needs_to_retry = true;
            return;
        }

        this.unstack_cb2s_semaphore = true;

        do {
            this.unstack_cb2s_needs_to_retry = false;

            // normalement on iter dans l'ordre des cb1_uid
            let cb1_uids = Object.keys(this.cbs2_by_cb1_uid);
            let freed_a_slot = false;
            for (let i in cb1_uids) {
                let cb1_uid = cb1_uids[i];

                if (!!this.all_waiting_and_running_promises_by_cb1_uid[cb1_uid]) {
                    // Dès qu'on a un cb2 dont l'uid est encore en attente, on ignore les suivants
                    break;
                }

                let cb2 = this.cbs2_by_cb1_uid[cb1_uid];
                delete this.cbs2_by_cb1_uid[cb1_uid];
                await cb2(this.cbs1_results_by_cb1_uid[cb1_uid]);
                this.nb_running_promises--;
                freed_a_slot = true;
            }

            if (freed_a_slot) {
                // Since we freed on or more slots, we can check if we can run another promise
                if (this.waiting_for_race_resolver) {
                    let resolver = this.waiting_for_race_resolver;
                    delete this.waiting_for_race_resolver;
                    await resolver("OrderedPromisePipeline.do_cb1");
                }
                if ((this.nb_running_promises === 0) && this.end_promise_resolve) {

                    let end_promise = this.end_promise_resolve;
                    this.end_promise_resolve = null;
                    await end_promise("OrderedPromisePipeline.do_cb2");
                }
            }
        } while (this.unstack_cb2s_needs_to_retry);

        this.unstack_cb2s_semaphore = false;
    }
}