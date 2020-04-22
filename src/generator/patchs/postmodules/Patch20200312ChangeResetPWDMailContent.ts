/* istanbul ignore next: no unit tests on patchs */
import { IDatabase } from 'pg-promise';
import ModuleDAOServer from '../../../server/modules/DAO/ModuleDAOServer';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20200312ChangeResetPWDMailContent implements IGeneratorWorker {

    public static getInstance(): Patch20200312ChangeResetPWDMailContent {
        if (!Patch20200312ChangeResetPWDMailContent.instance) {
            Patch20200312ChangeResetPWDMailContent.instance = new Patch20200312ChangeResetPWDMailContent();
        }
        return Patch20200312ChangeResetPWDMailContent.instance;
    }

    private static instance: Patch20200312ChangeResetPWDMailContent = null;

    get uid(): string {
        return 'Patch20200312ChangeResetPWDMailContent';
    }

    private constructor() { }

    /**
     * On check tous les foreign keys et on compare le param cascade en bdd au param issu du code
     */
    public async work(db: IDatabase<any>) {

        try {
            let code_trad = await ModuleDAOServer.getInstance().selectOne(TranslatableTextVO.API_TYPE_ID, ' where code_text=$1;', ['mails.pwd.recovery.html']);
            let lang = await ModuleDAOServer.getInstance().selectOne(LangVO.API_TYPE_ID, " where code_lang='fr';");
            let trad: TranslationVO = await ModuleDAOServer.getInstance().selectOne(TranslationVO.API_TYPE_ID, ' where lang_id=$1 and text_id=$2;', [lang.id, code_trad.id]);

            trad.translated = 'Cliquez sur le lien ci-dessous pour modifier votre mot de passe.';
            await ModuleDAO.getInstance().insertOrUpdateVO(trad);
        } catch (error) {
        }
    }
}