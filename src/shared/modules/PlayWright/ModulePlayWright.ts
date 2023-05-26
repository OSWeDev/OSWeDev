import CacheInvalidationRulesVO from '../AjaxCache/vos/CacheInvalidationRulesVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import String2ParamVO, { String2ParamVOStatic } from '../API/vos/apis/String2ParamVO';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';

export default class ModulePlayWright extends Module {

    public static MODULE_NAME: string = 'Document';

    public static APINAME_setup_and_login: string = "playwright_setup_and_login";
    // public static APINAME_global_setup: string = "playwright_global_setup";
    // public static APINAME_global_teardown: string = "playwright_global_teardown";
    public static APINAME_before_all: string = "playwright_before_all";
    public static APINAME_before_each: string = "playwright_before_each";
    public static APINAME_after_all: string = "playwright_after_all";
    public static APINAME_after_each: string = "playwright_after_each";

    public static getInstance(): ModulePlayWright {
        if (!ModulePlayWright.instance) {
            ModulePlayWright.instance = new ModulePlayWright();
        }
        return ModulePlayWright.instance;
    }

    private static instance: ModulePlayWright = null;

    // l'access_code étant le START_MAINTENANCE_ACCEPTATION_CODE
    public setup_and_login: (access_code: string) => Promise<void> = APIControllerWrapper.sah(ModulePlayWright.APINAME_setup_and_login);
    // public globalSetup: (access_code: string) => Promise<void> = APIControllerWrapper.sah(ModulePlayWright.APINAME_globalSetup);
    // public globalTeardown: (access_code: string) => Promise<void> = APIControllerWrapper.sah(ModulePlayWright.APINAME_globalTeardown);
    public before_all: (access_code: string) => Promise<void> = APIControllerWrapper.sah(ModulePlayWright.APINAME_before_all);
    public before_each: (access_code: string, test_title: string) => Promise<void> = APIControllerWrapper.sah(ModulePlayWright.APINAME_before_each);
    public after_all: (access_code: string) => Promise<void> = APIControllerWrapper.sah(ModulePlayWright.APINAME_after_all);
    public after_each: (access_code: string, test_title: string) => Promise<void> = APIControllerWrapper.sah(ModulePlayWright.APINAME_after_each);

    private constructor() {

        super("document", ModulePlayWright.MODULE_NAME);
        this.forceActivationOnInstallation();
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
            null, // On gère les droits dans l'api en interdisant l'exécution en environnement de PROD principal et on checke la clé en paramètre
            ModulePlayWright.APINAME_setup_and_login,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            StringParamVOStatic
        ));

        // APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
        //     null, // On gère les droits dans l'api en interdisant l'exécution en environnement de PROD principal et on checke la clé en paramètre
        //     ModulePlayWright.APINAME_globalSetup,
        //     CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
        //     StringParamVOStatic
        // ));
        // APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
        //     null, // On gère les droits dans l'api en interdisant l'exécution en environnement de PROD principal et on checke la clé en paramètre
        //     ModulePlayWright.APINAME_globalTeardown,
        //     CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
        //     StringParamVOStatic
        // ));

        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
            null, // On gère les droits dans l'api en interdisant l'exécution en environnement de PROD principal et on checke la clé en paramètre
            ModulePlayWright.APINAME_before_all,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            StringParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, void>(
            null, // On gère les droits dans l'api en interdisant l'exécution en environnement de PROD principal et on checke la clé en paramètre
            ModulePlayWright.APINAME_after_all,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            StringParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<String2ParamVO, void>(
            null, // On gère les droits dans l'api en interdisant l'exécution en environnement de PROD principal et on checke la clé en paramètre
            ModulePlayWright.APINAME_before_each,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            String2ParamVOStatic
        ));
        APIControllerWrapper.registerApi(new PostAPIDefinition<String2ParamVO, void>(
            null, // On gère les droits dans l'api en interdisant l'exécution en environnement de PROD principal et on checke la clé en paramètre
            ModulePlayWright.APINAME_after_each,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            String2ParamVOStatic
        ));
    }
}