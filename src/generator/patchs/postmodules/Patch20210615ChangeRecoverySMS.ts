/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20210615ChangeRecoverySMS implements IGeneratorWorker {

    public static getInstance(): Patch20210615ChangeRecoverySMS {
        if (!Patch20210615ChangeRecoverySMS.instance) {
            Patch20210615ChangeRecoverySMS.instance = new Patch20210615ChangeRecoverySMS();
        }
        return Patch20210615ChangeRecoverySMS.instance;
    }

    private static instance: Patch20210615ChangeRecoverySMS = null;

    get uid(): string {
        return 'Patch20210615ChangeRecoverySMS';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        let lang = await ModuleTranslation.getInstance().getLang('fr');
        let text = await ModuleTranslation.getInstance().getTranslatableText("mails.pwd.recovery.sms");

        if ((!lang) || (!text)) {
            return;
        }

        let translation = await ModuleTranslation.getInstance().getTranslation(lang.id, text.id);

        if (!translation) {
            return;
        }

        translation.translated = "%%ENV%%APP_TITLE%%: Pour réinitialiser votre compte: %%ENV%%BASE_URL%%login§§IFVAR_SESSION_SHARE_SID§§?sessionid=%%VAR%%SESSION_SHARE_SID%%§§§§#/reset/%%VAR%%UID%%/%%VAR%%CODE_CHALLENGE%%";
        await ModuleDAO.getInstance().insertOrUpdateVO(translation);
    }
}