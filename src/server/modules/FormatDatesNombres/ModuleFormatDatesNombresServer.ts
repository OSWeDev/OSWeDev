import ModuleFormatDatesNombres from "../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres";
import DefaultTranslationManager from "../../../shared/modules/Translation/DefaultTranslationManager";
import DefaultTranslation from "../../../shared/modules/Translation/vos/DefaultTranslation";
import ModuleServerBase from "../ModuleServerBase";

export default class ModuleFormatDatesNombresServer extends ModuleServerBase {

    public static getInstance(): ModuleFormatDatesNombresServer {
        if (!ModuleFormatDatesNombresServer.instance) {
            ModuleFormatDatesNombresServer.instance = new ModuleFormatDatesNombresServer();
        }
        return ModuleFormatDatesNombresServer.instance;
    }

    private static instance: ModuleFormatDatesNombresServer = null;

    private constructor() {
        super(ModuleFormatDatesNombres.getInstance().name);
    }

    // istanbul ignore next: cannot test configure
    public async configure() {

        DefaultTranslationManager.registerDefaultTranslation(new DefaultTranslation(
            {
                'fr-fr': 'DD/MM/YYYY',
                'de-de': 'D.M.YYYY',
                'es-es': 'DD/MM/YYYY',
                'en-us': 'MM/DD/YYYY',
                'en-uk': 'DD/MM/YYYY'
            },
            ModuleFormatDatesNombres.TRANSLATION_date_format_fullyear_month_day));
    }
}