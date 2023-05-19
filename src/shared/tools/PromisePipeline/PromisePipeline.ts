import ConsoleHandler from "../ConsoleHandler";
import EnvHandler from "../EnvHandler";

export default class PromisePipeline {

    private static GLOBAL_UID: number = 0;

    private uid: number = 0;
    private cb_uid: number = 0;
    private nb_running_promises: number = 0;
    // private semaphore_check_wrapped_cbs: boolean = false;

    private all_waiting_and_running_promises_by_cb_uid: { [cb_uid: number]: Promise<any> } = {};
    // private all_running_promises_by_cb_uid: Array<Promise<any>> = [];

    private end_promise_resolve: () => void | PromiseLike<void> = null;

    public constructor(
        public max_concurrent_promises: number = 1 // Max number of concurrent promises
    ) {
        this.uid = PromisePipeline.GLOBAL_UID++;
    }

    /**
     * Objectif : Ajouter une promise au pipeline, mais uniquement quand on aura de la place dans le pipeline
     * @param cb la méthode à appeler quand on peut, et qui renverra une promise supplémentaire
     */
    public async push(cb: () => Promise<any>): Promise<void> {

        if (!(typeof cb === 'function')) {
            throw new Error(`Unexpected type of callback given : ${typeof cb}`);
        }

        if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
            ConsoleHandler.log('PromisePipeline.push():PREPUSH:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        if (this.has_free_slot()) {

            if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
                ConsoleHandler.log('PromisePipeline.check_wrapped_cbs():has_free_slot:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
            }

            this.cb_uid++;

            const cb_uid = this.cb_uid;

            // Add/Append in the waitlist for each given callback
            this.all_waiting_and_running_promises_by_cb_uid[cb_uid] = this.do_cb(cb, cb_uid);

        } else {

            if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
                ConsoleHandler.log('PromisePipeline.check_wrapped_cbs():!has_free_slot:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
            }

            // Wait for a free slot, handle the fastest finished promise
            await Promise.race(Object.values(this.all_waiting_and_running_promises_by_cb_uid));

            if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
                ConsoleHandler.log('PromisePipeline.check_wrapped_cbs():RACE END:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
            }

            this.cb_uid++;

            const cb_uid = this.cb_uid;

            // Add/Append in the waitlist for each given callback
            this.all_waiting_and_running_promises_by_cb_uid[cb_uid] = this.do_cb(cb, cb_uid);
        }

        if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
            ConsoleHandler.log('PromisePipeline.push():POSTPUSH:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }
    }

    /**
     * Objectif : attendre que toutes les promesses soient terminées
     * Soit on a déjà fini, soit on crée une promise qui sera résolue à la fin
     */
    public async end(): Promise<void> {

        if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
            ConsoleHandler.log('PromisePipeline.end():START:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        if (this.nb_running_promises === 0) {
            if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
                ConsoleHandler.log('PromisePipeline.end():END:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
            }
            return;
        }

        if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
            ConsoleHandler.log('PromisePipeline.end():WAIT:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        let self = this;

        // Promise resolever declaration that
        // will be called when all promises are finished
        let wait_for_end = new Promise<void>((resolve, reject) => {
            self.end_promise_resolve = resolve;
        });

        await wait_for_end;

        if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
            ConsoleHandler.log('PromisePipeline.end():WAIT END:' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }
    }

    private async do_cb(cb: () => Promise<any>, cb_uid: number): Promise<void> {
        this.nb_running_promises++;

        if (!(typeof cb === 'function')) {
            throw new Error(`Unexpected type of callback given : ${typeof cb}`);
        }

        if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
            ConsoleHandler.log('PromisePipeline.do_cb():BEFORECB:' + this.uid + ':cb_name:' + cb.name + ':' + cb_uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        try {
            await cb();
        } catch (error) {
            ConsoleHandler.error('PromisePipeline.do_cb():ERROR:' + error + ':cb_name:' + cb.name + ':' + cb_uid + ':' + this.uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
            ConsoleHandler.log('PromisePipeline.do_cb():AFTERCB:' + this.uid + ':cb_name:' + cb.name + ':' + cb_uid + ':' + ' [' + this.nb_running_promises + ']');
        }

        this.nb_running_promises--;

        // Remove the callback promise from the waitlist
        delete this.all_waiting_and_running_promises_by_cb_uid[cb_uid];

        if ((this.nb_running_promises === 0) && this.end_promise_resolve) {

            if (EnvHandler.DEBUG_PROMISE_PIPELINE) {
                ConsoleHandler.log('PromisePipeline.do_cb():END PROMISE:' + this.uid + ':cb_name:' + cb.name + ':' + cb_uid + ':' + ' [' + this.nb_running_promises + ']');
            }

            let end_promise = this.end_promise_resolve;
            this.end_promise_resolve = null;
            await end_promise();
        }
    }

    private has_free_slot(): boolean {
        return (this.nb_running_promises < this.max_concurrent_promises);
    }
}