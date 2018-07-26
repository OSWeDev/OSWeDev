import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import ModuleTable from '../../../shared/modules/ModuleTable';
import ModuleTableField from '../../../shared/modules/ModuleTableField';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ModuleDAOServer from '../DAO/ModuleDAOServer';

export default class ModuleTableDefaultTranslationsHandler {

    public static getInstance(): ModuleTableDefaultTranslationsHandler {
        if (!ModuleTableDefaultTranslationsHandler.instance) {
            ModuleTableDefaultTranslationsHandler.instance = new ModuleTableDefaultTranslationsHandler();
        }
        return ModuleTableDefaultTranslationsHandler.instance;
    }
    private static instance: ModuleTableDefaultTranslationsHandler = null;
    private constructor() { }

    public async registerDefaultTableTranslations(moduleTable: ModuleTable<any>) {

        if (!moduleTable) {
            return;
        }

        for (let i in moduleTable.fields) {
            await this.registerDefaultFieldTranslations(moduleTable.fields[i]);
        }
    }

    private async registerDefaultFieldTranslations(moduleTableField: ModuleTableField<any>) {

        if ((!moduleTableField) || (!moduleTableField.field_label) || (!moduleTableField.field_label.code_text)) {
            return;
        }

        // On cherche le translatable : si il existe pas on le crée
        let translatable: TranslatableTextVO = await ModuleDAOServer.getInstance().selectOne<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID, "where code_text=$1", [moduleTableField.field_label.code_text]);

        if (!translatable) {
            translatable = new TranslatableTextVO();
            translatable.code_text = moduleTableField.field_label.code_text;
            await ModuleDAO.getInstance().insertOrUpdateVO(translatable);
            console.error("Ajout de translatable : " + JSON.stringify(translatable));
            translatable = await ModuleDAOServer.getInstance().selectOne<TranslatableTextVO>(TranslatableTextVO.API_TYPE_ID, "where code_text=$1", [moduleTableField.field_label.code_text]);
        }

        if (!translatable) {
            console.error("Impossible de créer le translatable : " + moduleTableField.field_label.code_text);
            return;
        }

        // On cherche les translated : si il en manque par rapport aux langs dispos sur le DefaultTranslations, on crée les manquantes
        let langs: LangVO[] = await ModuleDAO.getInstance().getVos<LangVO>(LangVO.API_TYPE_ID);

        for (let i in langs) {
            let lang: LangVO = langs[i];

            let default_translation: string = moduleTableField.field_label.default_translations[lang.code_lang];

            if (!default_translation) {
                // On en crée artificiellement une à partir de la langue par défaut
                if (!moduleTableField.field_label.default_translations[ModuleTableField.DEFAULT_LANG_DEFAULT_TRANSLATION]) {
                    console.error("Impossible de trouver la traduction dans la langue par défaut:" + JSON.stringify(moduleTableField.field_label));
                    continue;
                }

                default_translation = moduleTableField.field_label.default_translations[ModuleTableField.DEFAULT_LANG_DEFAULT_TRANSLATION];
            }

            let translation: TranslationVO = await ModuleDAOServer.getInstance().selectOne<TranslationVO>(TranslationVO.API_TYPE_ID, "where lang_id=$1 and text_id=$2", [lang.id, translatable.id]);

            if (!translation) {
                translation = new TranslationVO();
                translation.lang_id = lang.id;
                translation.text_id = translatable.id;
                translation.translated = default_translation;
                await ModuleDAO.getInstance().insertOrUpdateVO(translation);
                translation = await ModuleDAOServer.getInstance().selectOne<TranslationVO>(TranslationVO.API_TYPE_ID, "where lang_id=$1 and text_id=$2", [lang.id, translatable.id]);
            }

            if (!translation) {
                console.error("Impossible de créer le translation : " + lang.id + ":" + translatable.id + ":" + default_translation);
                return;
            }
        }
    }
}