import ModuleDAO from "../../../../shared/modules/DAO/ModuleDAO";
import InsertOrDeleteQueryResult from "../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult";
import ModuleTranslation from "../../../../shared/modules/Translation/ModuleTranslation";
import TranslatableTextVO from "../../../../shared/modules/Translation/vos/TranslatableTextVO";
import TranslationVO from "../../../../shared/modules/Translation/vos/TranslationVO";

export default class TranslatableTextController {
    public static getInstance(): TranslatableTextController {
        if (!TranslatableTextController.instance) {
            TranslatableTextController.instance = new TranslatableTextController();
        }
        return TranslatableTextController.instance;
    }

    private static instance: TranslatableTextController;

    public async save_translation(code_lang: string, code_text: string, translation: string): Promise<boolean> {

        if (!translation) {
            translation = '';
        }

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult;

        const lang = await ModuleTranslation.getInstance().getLang(code_lang);
        if (!lang) {
            return false;
        }

        let text = await ModuleTranslation.getInstance().getTranslatableText(code_text);
        if (!text) {
            text = new TranslatableTextVO();
            text.code_text = code_text;
            insertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(text);
            if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
                return false;
            }
            text.id = insertOrDeleteQueryResult.id;
        }

        let bdd_translation = await ModuleTranslation.getInstance().getTranslation(lang.id, text.id);
        if (!bdd_translation) {
            bdd_translation = new TranslationVO();
            bdd_translation.lang_id = lang.id;
            bdd_translation.text_id = text.id;
        }
        bdd_translation.translated = translation;
        insertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(bdd_translation);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            return false;
        }

        return true;
    }
}