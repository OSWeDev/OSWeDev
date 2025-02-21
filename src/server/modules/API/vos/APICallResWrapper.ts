import { Response } from "express";
import APINotifTypeResultVO from "../../../../shared/modules/PushData/vos/APINotifTypeResultVO";
import ConsoleHandler from "../../../../shared/tools/ConsoleHandler";
import PushDataServerController from "../../PushData/PushDataServerController";

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
        public can_notif_result: boolean,
        public notif_result_uid: number,
        public notif_result_tab_id: string,
    ) {

        // Si la requête n'est pas notifiée de base, peut l'etre, et n'est pas terminée au bout de 20 secondes, on la passe en notif
        if (!this.do_notif_result && this.can_notif_result) {
            setTimeout(() => {

                if (this.do_notif_result) {
                    return;
                }

                if (this.res.headersSent) {
                    return;
                }

                if (!(
                    (!!PushDataServerController.registeredSockets) &&
                    (!!PushDataServerController.registeredSockets[notif_result_uid]) &&
                    (!!PushDataServerController.registeredSockets[notif_result_uid][notif_result_tab_id])
                )) {
                    return;
                }

                this.do_notif_result = true;
                const notif_result = APINotifTypeResultVO.createNew(
                    this.api_call_id,
                    null
                );

                try {
                    this.res.json(notif_result);
                } catch (error) {
                    ConsoleHandler.error('Error sending notif_result :' + this.api_name, error);
                }
            }, 20000);
        }
    }
}