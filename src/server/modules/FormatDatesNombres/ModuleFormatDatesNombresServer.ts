import ModuleFormatDatesNombres from "../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres";
import DefaultTranslationManager from "../../../shared/modules/Translation/DefaultTranslationManager";
import DefaultTranslationVO from "../../../shared/modules/Translation/vos/DefaultTranslationVO";
import ModuleServerBase from "../ModuleServerBase";

export default class ModuleFormatDatesNombresServer extends ModuleServerBase {

    private static instance: ModuleFormatDatesNombresServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleFormatDatesNombres.getInstance().name);
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleFormatDatesNombresServer {
        if (!ModuleFormatDatesNombresServer.instance) {
            ModuleFormatDatesNombresServer.instance = new ModuleFormatDatesNombresServer();
        }
        return ModuleFormatDatesNombresServer.instance;
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            {
                'fr-fr': 'DD/MM/YYYY',
                'de-de': 'D.M.YYYY',
                'es-es': 'DD/MM/YYYY',
                'en-us': 'MM/DD/YYYY',
                'en-uk': 'DD/MM/YYYY'
            },
            ModuleFormatDatesNombres.TRANSLATION_date_format_fullyear_month_day));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            {
                'fr-fr': 'DD/MM/YYYY HH:--',
                'de-de': 'D.M.YYYY HH:--',
                'es-es': 'DD/MM/YYYY HH:--',
                'en-us': 'MM/DD/YYYY HH:--',
                'en-uk': 'DD/MM/YYYY HH:--'
            },
            ModuleFormatDatesNombres.TRANSLATION_date_format_hour));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            {
                'fr-fr': 'DD/MM/YYYY HH:mm',
                'de-de': 'D.M.YYYY HH:mm',
                'es-es': 'DD/MM/YYYY HH:mm',
                'en-us': 'MM/DD/YYYY HH:mm',
                'en-uk': 'DD/MM/YYYY HH:mm'
            },
            ModuleFormatDatesNombres.TRANSLATION_date_format_minute));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            {
                'fr-fr': 'DD/MM/YYYY HH:mm:ss',
                'de-de': 'D.M.YYYY HH:mm:ss',
                'es-es': 'DD/MM/YYYY HH:mm:ss',
                'en-us': 'MM/DD/YYYY HH:mm:ss',
                'en-uk': 'DD/MM/YYYY HH:mm:ss'
            },
            ModuleFormatDatesNombres.TRANSLATION_date_format_second));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            {
                'fr-fr': 'MM/YYYY',
                'de-de': 'M.YYYY',
                'es-es': 'MM/YYYY',
                'en-us': 'MM/YYYY',
                'en-uk': 'MM/YYYY'
            },
            ModuleFormatDatesNombres.TRANSLATION_date_format_year_month));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            {
                'fr-fr': 'DD/MM/YYYY',
                'de-de': 'D.M.YYYY',
                'es-es': 'DD/MM/YYYY',
                'en-us': 'MM/DD/YYYY',
                'en-uk': 'DD/MM/YYYY'
            },
            ModuleFormatDatesNombres.TRANSLATION_date_format_year_month_day));

        DefaultTranslationManager.registerDefaultTranslation(DefaultTranslationVO.create_new(
            {
                'fr-fr': 'DD/MM/YYYY HH:mm:ss.',
                'de-de': 'D.M.YYYY HH:mm:ss.',
                'es-es': 'DD/MM/YYYY HH:mm:ss.',
                'en-us': 'MM/DD/YYYY HH:mm:ss.',
                'en-uk': 'DD/MM/YYYY HH:mm:ss.'
            },
            ModuleFormatDatesNombres.TRANSLATION_date_format_milliseconds));
    }
}