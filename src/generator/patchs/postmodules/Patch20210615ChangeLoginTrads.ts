/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20210615ChangeLoginTrads implements IGeneratorWorker {

    public static getInstance(): Patch20210615ChangeLoginTrads {
        if (!Patch20210615ChangeLoginTrads.instance) {
            Patch20210615ChangeLoginTrads.instance = new Patch20210615ChangeLoginTrads();
        }
        return Patch20210615ChangeLoginTrads.instance;
    }

    private static instance: Patch20210615ChangeLoginTrads = null;

    get uid(): string {
        return 'Patch20210615ChangeLoginTrads';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        let lang = await ModuleTranslation.getInstance().getLang('fr-fr');
        let text = await ModuleTranslation.getInstance().getTranslatableText("login.email_placeholder.___LABEL___");

        if ((!lang) || (!text)) {
            return;
        }

        let translation = await ModuleTranslation.getInstance().getTranslation(lang.id, text.id);

        if (!translation) {
            return;
        }

        translation.translated = "Login/email/n° de téléphone";
        await ModuleDAO.getInstance().insertOrUpdateVO(translation);
    }
}