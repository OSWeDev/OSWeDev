import { query } from '../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../shared/modules/DAO/ModuleDAO';
import DefaultTranslationManager from '../../../shared/modules/Translation/DefaultTranslationManager';
import DefaultTranslation from '../../../shared/modules/Translation/vos/DefaultTranslation';
import LangVO from '../../../shared/modules/Translation/vos/LangVO';
import TranslatableTextVO from '../../../shared/modules/Translation/vos/TranslatableTextVO';
import TranslationVO from '../../../shared/modules/Translation/vos/TranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import { all_promises } from '../../../shared/tools/PromiseTools';
import ConfigurationService from '../../env/ConfigurationService';
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

    public async saveDefaultTranslations(force: boolean = false) {

        // Il faut utiliser la var d'en NODE_INSTALL = true pour lancer ce process (très long potentiellement)
        if (!ConfigurationService.getInstance().nodeInstall) {
            return;
        }

        let promises = [];
        let max = Math.max(1, Math.floor(ConfigurationService.getInstance().node_configuration.MAX_POOL / 2));
        let registered_default_translations = this.clean_registered_default_translations();

        let langs: LangVO[] = null;
        promises.push((async () => {
            langs = await query(LangVO.API_TYPE_ID).select_vos<LangVO>();
        })());

        let translatables: TranslatableTextVO[] = null;
        let translatable_by_code_text: { [code_text: string]: TranslatableTextVO } = {};
        promises.push((async () => {
            translatables = await query(TranslatableTextVO.API_TYPE_ID).select_vos<TranslatableTextVO>();
            for (let i in translatables) {
                let translatable = translatables[i];
                translatable_by_code_text[translatable.code_text] = translatable;
            }
        })());

        let translations: TranslationVO[] = null;
        let translation_by_lang_id_and_text_id: { [lang_id: number]: { [text_id: number]: TranslationVO } } = {};
        promises.push((async () => {
            translations = await query(TranslationVO.API_TYPE_ID).select_vos<TranslationVO>();

            for (let i in translations) {
                let translation = translations[i];

                if (!translation_by_lang_id_and_text_id[translation.lang_id]) {
                    translation_by_lang_id_and_text_id[translation.lang_id] = {};
                }
                translation_by_lang_id_and_text_id[translation.lang_id][translation.text_id] = translation;
            }
        })());

        await all_promises(promises);

        promises = [];
        for (let i in registered_default_translations) {

            if (promises.length >= max) {
                await Promise.all(promises);
                promises = [];
            }

            promises.push(this.saveDefaultTranslation(registered_default_translations[i], langs, translatable_by_code_text, translation_by_lang_id_and_text_id));

            // await this.saveDefaultTranslation(registered_default_translations[i]);
        }

        if (promises && promises.length) {
            await Promise.all(promises);
        }

        await this.cleanTranslationCodes(translatables);
    }

    /**
     * Makes sure to remove any invalid translation_code from the database
     */
    private async cleanTranslationCodes(codes: TranslatableTextVO[]) {
        let codes_to_deletes: TranslatableTextVO[] = [];
        ConsoleHandler.getInstance().log('cleanTranslationCodes:IN:');

        for (let i in codes) {
            let code_a: TranslatableTextVO = codes[i];

            for (let j in codes) {
                if (parseInt(j.toString()) <= parseInt(i.toString())) {
                    continue;
                }

                let code_b: TranslatableTextVO = codes[j];

                if (code_b.code_text.startsWith(code_a.code_text) && (code_b.code_text.lastIndexOf('.') != code_a.code_text.lastIndexOf('.'))) {

                    ConsoleHandler.getInstance().error('TranslatableText : REMOVE :' + code_a.code_text);
                    codes_to_deletes.push(code_a);
                    break;
                }
            }
        }

        if (codes_to_deletes.length > 0) {
            await ModuleDAO.getInstance().deleteVOs(codes_to_deletes);
        }
        ConsoleHandler.getInstance().log('cleanTranslationCodes:OUT:');
    }

    private async saveDefaultTranslation(
        default_translation: DefaultTranslation,
        langs: LangVO[],
        translatable_by_code_text: { [code_text: string]: TranslatableTextVO },
        translation_by_lang_id_and_text_id: { [lang_id: number]: { [text_id: number]: TranslationVO } }) {

        if ((!default_translation) || (!default_translation.code_text)) {
            return;
        }

        // On cherche le translatable : si il existe pas on le crée
        let translatable: TranslatableTextVO = translatable_by_code_text[default_translation.code_text];

        if (!translatable) {
            translatable = new TranslatableTextVO();
            translatable.code_text = default_translation.code_text;
            await ModuleDAO.getInstance().insertOrUpdateVO(translatable);
            ConsoleHandler.getInstance().error("Ajout de translatable : " + JSON.stringify(translatable));
            translatable = await query(TranslatableTextVO.API_TYPE_ID).filter_by_text_eq('code_text', default_translation.code_text).select_vo<TranslatableTextVO>();
        }

        if (!translatable) {
            ConsoleHandler.getInstance().error("Impossible de créer le translatable : " + default_translation.code_text);
            return;
        }
        translatable_by_code_text[default_translation.code_text] = translatable;

        // On cherche les translated : si il en manque par rapport aux langs dispos sur le DefaultTranslations, on crée les manquantes
        for (let i in langs) {
            let lang: LangVO = langs[i];

            let translation_str: string = default_translation.default_translations[lang.code_lang];

            if (translation_str == null) {
                // Si pas de trad, on passe au suivant pour ne pas créer de trad par defaut sur les autres langues

                // if ((default_translation.default_translations[DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION] == null) || (typeof default_translation.default_translations[DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION] == 'undefined')) {
                //     ConsoleHandler.getInstance().error("Impossible de trouver la traduction dans la langue par défaut:" + JSON.stringify(default_translation));
                //     continue;
                // }

                // translation_str = default_translation.default_translations[DefaultTranslation.DEFAULT_LANG_DEFAULT_TRANSLATION];
                continue;
            }

            let translation: TranslationVO = translation_by_lang_id_and_text_id[lang.id] ? translation_by_lang_id_and_text_id[lang.id][translatable.id] : null;

            if (!translation) {
                translation = new TranslationVO();
                translation.lang_id = lang.id;
                translation.text_id = translatable.id;
                translation.translated = translation_str;
                await ModuleDAO.getInstance().insertOrUpdateVO(translation);
                translation = await query(TranslationVO.API_TYPE_ID).filter_by_id(lang.id, LangVO.API_TYPE_ID).filter_by_id(translatable.id, TranslatableTextVO.API_TYPE_ID).select_vo<TranslationVO>();
            }

            if (!translation) {
                ConsoleHandler.getInstance().error("Impossible de créer le translation : " + lang.id + ":" + translatable.id + ":" + translation_str);
                return;
            }

            translation_by_lang_id_and_text_id[lang.id][translatable.id] = translation;
        }
    }

    private clean_registered_default_translations(): { [code_text: string]: DefaultTranslation } {
        let res: { [code_text: string]: DefaultTranslation } = {};

        for (let i in DefaultTranslationManager.getInstance().registered_default_translations) {
            let registered_default_translation = DefaultTranslationManager.getInstance().registered_default_translations[i];

            res[registered_default_translation.code_text] = registered_default_translation;
        }
        return res;
    }
}