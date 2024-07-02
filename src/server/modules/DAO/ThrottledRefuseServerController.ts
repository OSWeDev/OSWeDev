import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import ThrottleHelper from "../../../shared/tools/ThrottleHelper";
import PushDataServerController from "../PushData/PushDataServerController";

export default class ThrottledRefuseServerController {
    public static throttled_refuse = ThrottleHelper.declare_throttle_with_mappable_args(ThrottledRefuseServerController.refuse, 1000, { leading: false, trailing: true });

    private static async refuse(params: { [uid: number]: { [CLIENT_TAB_ID: string]: boolean } }) {

        for (const uid_s in params) {
            const uid: number = parseInt(uid_s.toString());
            for (const CLIENT_TAB_ID in params[uid]) {
                await PushDataServerController.getInstance().notifySimpleERROR(uid, CLIENT_TAB_ID, 'dao.global_update_blocker.actif', true);
            }
        }
        ConsoleHandler.warn("global_update_blocker actif");
    }

}