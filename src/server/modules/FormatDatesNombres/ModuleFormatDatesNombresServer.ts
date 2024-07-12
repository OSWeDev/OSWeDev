import ModuleFormatDatesNombres from "../../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres";
import DefaultTranslationManager from "../../../shared/modules/Translation/DefaultTranslationManager";
import DefaultTranslationVO from "../../../shared/modules/Translation/vos/DefaultTranslationVO";
import ModuleServerBase from "../ModuleServerBase";

export default class ModuleFormatDatesNombresServer extends ModuleServerBase {

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleFormatDatesNombresServer {
        if (!ModuleFormatDatesNombresServer.instance) {
            ModuleFormatDatesNombresServer.instance = new ModuleFormatDatesNombresServer();
        }
        return ModuleFormatDatesNombresServer.instance;
    }

    private static instance: ModuleFormatDatesNombresServer = null;

    // istanbul ignore next: cannot test module constructor
    private constructor() {
        super(ModuleFormatDatesNombres.getInstance().name);
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
    }
}