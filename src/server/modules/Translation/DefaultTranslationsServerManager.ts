import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ModuleDAOServer from '../DAO/ModuleDAOServer';

export default class DefaultTranslationsServerManager {

    public static getInstance(): DefaultTranslationsServerManager {
        if (!DefaultTranslationsServerManager.instance) {
            DefaultTranslationsServerManager.instance = new DefaultTranslationsServerManager();
        }
        return DefaultTranslationsServerManager.instance;
    }
    private static instance: DefaultTranslationsServerManager = null;
    private constructor() { }

    public async saveDefaultTranslations() {

        for (let i in DefaultTranslationManager.getInstance().registered_default_translations) {
            await this.saveDefaultTranslation(DefaultTranslationManager.getInstance().registered_default_translations[i]);
        }
    }

    private async saveDefaultTranslation(default_translation: DefaultTranslation) {

        if ((!default_translation) || (!default_translation.code_text)) {
            return;
        }

        // On cherche le translatable : si il existe pas on le crée
        let translatable: TranslatableTextVO = await ModuleDAOServer.getInstance().selectOne<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID, "where code_text=$1", [default_translation.code_text]);

        if (!translatable) {
            translatable = new TranslatableTextVO();
            translatable.code_text = default_translation.code_text;
            await ModuleDAO.getInstance().insertOrUpdateVO(translatable);
            console.error("Ajout de translatable : " + JSON.stringify(translatable));
            translatable = await ModuleDAOServer.getInstance().selectOne<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID, "where code_text=$1", [default_translation.code_text]);
        }

        if (!translatable) {
            console.error("Impossible de créer le translatable : " + default_translation.code_text);
            return;
        }

        // On cherche les translated : si il en manque par rapport aux langs dispos sur le DefaultTranslations, on crée les manquantes
        let langs: LangVO[] = await ModuleDAO.getInstance().getVos<LangVO>(LangVO.API_TYPE_ID);

        for (let i in langs) {
            let lang: LangVO = langs[i];

            let translation_str: string = default_translation.default_translations[lang.code_lang];

            if (!translation_str) {
                // On en crée artificiellement une à partir de la langue par défaut
                if (!default_translation.default_translations[DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION]) {
                    console.error("Impossible de trouver la traduction dans la langue par défaut:" + JSON.stringify(default_translation));
                    continue;
                }

                translation_str = default_translation.default_translations[DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION];
            }

            let translation: TranslationVO = await ModuleDAOServer.getInstance().selectOne<TranslationVO>(TranslationVO.API_TYPE_ID, "where lang_id=$1 and text_id=$2", [lang.id, translatable.id]);

            if (!translation) {
                translation = new TranslationVO();
                translation.lang_id = lang.id;
                translation.text_id = translatable.id;
                translation.translated = translation_str;
                await ModuleDAO.getInstance().insertOrUpdateVO(translation);
                translation = await ModuleDAOServer.getInstance().selectOne<TranslationVO>(TranslationVO.API_TYPE_ID, "where lang_id=$1 and text_id=$2", [lang.id, translatable.id]);
            }

            if (!translation) {
                console.error("Impossible de créer le translation : " + lang.id + ":" + translatable.id + ":" + translation_str);
                return;
            }
        }
    }
}