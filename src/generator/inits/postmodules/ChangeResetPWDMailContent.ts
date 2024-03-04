/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';
import { field_names } from '../../../shared/tools/ObjectHandler';

export default class ChangeResetPWDMailContent implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): ChangeResetPWDMailContent {
        if (!ChangeResetPWDMailContent.instance) {
            ChangeResetPWDMailContent.instance = new ChangeResetPWDMailContent();
        }
        return ChangeResetPWDMailContent.instance;
    }

    private static instance: ChangeResetPWDMailContent = null;

    get uid(): string {
        return 'ChangeResetPWDMailContent';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {

        try {
            const code_trad: TranslatableTextVO = await query(TranslatableTextVO.API_TYPE_ID).filter_by_text_eq(field_names<TranslatableTextVO>().code_text, 'mails.pwd.recovery.html').select_one();
            const lang: LangVO = await query(LangVO.API_TYPE_ID).filter_by_text_eq(field_names<LangVO>().code_lang, 'fr-fr').select_one();
            const trad: TranslationVO = await query(TranslationVO.API_TYPE_ID)
                .filter_by_num_eq(field_names<TranslationVO>().lang_id, lang.id)
                .filter_by_num_eq(field_names<TranslationVO>().text_id, code_trad.id)
                .select_one();

            trad.translated = 'Cliquez sur le lien ci-dessous pour modifier votre mot de passe.';
            await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(trad);
        } catch (error) {
            ConsoleHandler.log('Ignore this error if new project: ' + error);
        }
    }
}