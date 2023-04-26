/* istanbul ignore file: no usefull tests to build => more interested in understanding why this is still needed ? */

import i18next from 'i18next';
import i18nextMiddleware from 'i18next-express-middleware';
import { LanguageDetector } from 'i18next-express-middleware';
import EnvParam from './env/EnvParam';
import ConfigurationService from './env/ConfigurationService';
import ForkedTasksController from './modules/Fork/ForkedTasksController';

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

        // ForkedTasksController.getInstance().assert_is_main_process();

        const envParam: EnvParam = ConfigurationService.node_configuration;

        // JNE MODIF FLK : traductions
        // Uniquement pour l'index ..... il faut le passer en module du client
        // Nécessite un namespace apparemment
        for (let i in ALL_LOCALES) {
            let locale = ALL_LOCALES[i];

            ALL_LOCALES[i] = {
                translation: locale
            };
        }
        i18next
            .use(LanguageDetector)
            .init({
                fallbackLng: envParam.DEFAULT_LOCALE,
                preload: 'all',
                resources: ALL_LOCALES,
                nsSeparator: '¤'
            });

        this.i18next = i18next;
        this.i18nextMiddleware = i18nextMiddleware;
    }
}