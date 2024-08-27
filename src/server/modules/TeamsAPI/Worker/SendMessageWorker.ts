import ModuleMaintenance from "../../../../shared/modules/Maintenance/ModuleMaintenance";
import ConfigurationService from "../../../env/ConfigurationService";
import ICronWorker from "../../Cron/interfaces/ICronWorker";
import TeamsAPIServerController from "../TeamsAPIServerController";
import * as https from 'https';

export default class SendMessageWorker implements ICronWorker {

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!SendMessageWorker.instance) {
            SendMessageWorker.instance = new SendMessageWorker();
        }
        return SendMessageWorker.instance;
    }

    private static instance: SendMessageWorker = null;

    private constructor() {
    }

    // istanbul ignore next: nothing to test : worker_uid
    get worker_uid(): string {
        return "SendMessageWorker";
    }
    // istanbul ignore next: nothing to test : work
    public async work() {
        TeamsAPIServerController.send_teams_info('TITRE', 'MESSAGE');
    }
}