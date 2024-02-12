/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleTranslation from '../../../shared/modules/Translation/ModuleTranslation';
import IGeneratorWorker from '../../IGeneratorWorker';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';

export default class Patch20220217ChangeLoginTrad implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20220217ChangeLoginTrad {
        if (!Patch20220217ChangeLoginTrad.instance) {
            Patch20220217ChangeLoginTrad.instance = new Patch20220217ChangeLoginTrad();
        }
        return Patch20220217ChangeLoginTrad.instance;
    }

    private static instance: Patch20220217ChangeLoginTrad = null;

    get uid(): string {
        return 'Patch20220217ChangeLoginTrad';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        let lang = await ModuleTranslation.getInstance().getLang('fr-fr');
        let text = await ModuleTranslation.getInstance().getTranslatableText("fields.labels.ref.user.name.___LABEL___");

        if ((!lang) || (!text)) {
            return;
        }

        let translation = await ModuleTranslation.getInstance().getTranslation(lang.id, text.id);

        if (!translation) {
            return;
        }

        translation.translated = "Login";
        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(translation);
    }
}