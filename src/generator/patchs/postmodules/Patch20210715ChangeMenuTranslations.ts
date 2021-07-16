/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20210715ChangeMenuTranslations implements IGeneratorWorker {

    public static getInstance(): Patch20210715ChangeMenuTranslations {
        if (!Patch20210715ChangeMenuTranslations.instance) {
            Patch20210715ChangeMenuTranslations.instance = new Patch20210715ChangeMenuTranslations();
        }
        return Patch20210715ChangeMenuTranslations.instance;
    }

    private static instance: Patch20210715ChangeMenuTranslations = null;

    get uid(): string {
        return 'Patch20210715ChangeMenuTranslations';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        let changed_and_new: TranslatableTextVO[] = [];
        let codes_texts: TranslatableTextVO[] = await ModuleDAO.getInstance().getVos<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID);
        for (let i in codes_texts) {
            let code_text = codes_texts[i];

            if (!code_text.code_text.startsWith("menu.menuelements.")) {
                continue;
            }

            if (code_text.code_text.split('.').length >= 5) {
                continue;
            }

            let code = code_text.code_text.replace("menu.menuelements.", '');
            code_text.code_text = "menu.menuelements.admin." + code;
            changed_and_new.push(code_text);
        }

        await ModuleDAO.getInstance().insertOrUpdateVOs(changed_and_new);
    }
}