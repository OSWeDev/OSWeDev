import { Response } from "express";

export default class APICallResWrapper {

    /**
     *
     * @param api_call_id
     * @param res
     * @param api_call_promise
     * @param do_notif_result si on a déjà envoyé l'info qu'on notifiera le résultat et qu'on doit effectivement le faire
     * @param can_notif_result si on peut notifier le résultat
     */
    public constructor(
        public api_call_id: number,
        public api_name: string,
        public res: Response,
        public api_call_promise: Promise<any>,
        public do_notif_result: boolean,
        // public can_notif_result: boolean,
        public notif_result_uid: number,
        public notif_result_tab_id: string,
    ) {
    }
}