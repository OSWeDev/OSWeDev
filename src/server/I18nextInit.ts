/* istanbul ignore file: no usefull tests to build => more interested in understanding why this is still needed ? */

import i18next from 'i18next';
import i18nextMiddleware, { LanguageDetector } from 'i18next-express-middleware';
import ConfigurationService from './env/ConfigurationService';
import EnvParam from './env/EnvParam';

export default class I18nextInit {

    public static getInstance(ALL_LOCALES) {
        if (!I18nextInit.instance) {
            I18nextInit.instance = new I18nextInit(ALL_LOCALES);
        }
        return I18nextInit.instance;
    }

    private static instance: I18nextInit = null;

    public i18next = null;
    public i18nextMiddleware = null;

    private constructor(ALL_LOCALES) {

        const envParam: EnvParam = ConfigurationService.node_configuration;

        // JNE MODIF FLK : traductions
        // Uniquement pour l'index ..... il faut le passer en module du client
        // Nécessite un namespace apparemment
        for (const i in ALL_LOCALES) {
            const locale = ALL_LOCALES[i];

            ALL_LOCALES[i] = {
                translation: locale
            };
        }
        i18next
            .use(LanguageDetector)
            .init({
                fallbackLng: envParam.default_locale,
                preload: 'all',
                resources: ALL_LOCALES,
                nsSeparator: '¤'
            });

        this.i18next = i18next;
        this.i18nextMiddleware = i18nextMiddleware;
    }
}