import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleParams from '../../../../../shared/modules/Params/ModuleParams';
import SendInBlueMailVO from '../../../../../shared/modules/SendInBlue/vos/SendInBlueMailVO';
import ISupervisedItem from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItem';
import ISupervisedItemController from '../../../../../shared/modules/Supervision/interfaces/ISupervisedItemController';
import SupervisionController from '../../../../../shared/modules/Supervision/SupervisionController';
import SupervisedCategoryVO from '../../../../../shared/modules/Supervision/vos/SupervisedCategoryVO';
import TeamsWebhookContentAdaptiveCardVO from '../../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentAdaptiveCardVO';
import TeamsWebhookContentAttachmentsVO from '../../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentAttachmentsVO';
import TeamsWebhookContentColumnSetVO from '../../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentColumnSetVO';
import TeamsWebhookContentColumnVO from '../../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentColumnVO';
import TeamsWebhookContentTextBlockVO from '../../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentTextBlockVO';
import TeamsWebhookContentVO from '../../../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentVO';
import VOsTypesManager from '../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../../../shared/tools/PromiseTools';
import ConfigurationService from '../../../../env/ConfigurationService';
import ICronWorker from '../../../Cron/interfaces/ICronWorker';
import SendInBlueMailServerController from '../../../SendInBlue/SendInBlueMailServerController';
import TeamsAPIServerController from '../../../TeamsAPI/TeamsAPIServerController';

export default class OseliaDailyCleanEmptyThreads implements ICronWorker {

    private static instance: OseliaDailyCleanEmptyThreads = null;

    private constructor() {
    }

    // istanbul ignore next: nothing to test : worker_uid
    get worker_uid(): string {
        return "OseliaDailyCleanEmptyThreads";
    }

    // istanbul ignore next: nothing to test : getInstance
    public static getInstance() {
        if (!OseliaDailyCleanEmptyThreads.instance) {
            OseliaDailyCleanEmptyThreads.instance = new OseliaDailyCleanEmptyThreads();
        }
        return OseliaDailyCleanEmptyThreads.instance;
    }

    // istanbul ignore next: nothing to test : work
    public async work() {
        /**
         * On supprime tous les threads vides de plus de 24h
         */
        TODO
    }
}