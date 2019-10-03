import ModuleAccessPolicy from '../shared/modules/AccessPolicy/ModuleAccessPolicy';
import RoleVO from '../shared/modules/AccessPolicy/vos/RoleVO';
import ModuleAjaxCache from '../shared/modules/AjaxCache/ModuleAjaxCache';
import CacheInvalidationRulesVO from '../shared/modules/AjaxCache/vos/CacheInvalidationRulesVO';
import ModuleDAO from '../shared/modules/DAO/ModuleDAO';
import ModuleTranslation from '../shared/modules/Translation/ModuleTranslation';

export default abstract class VueAppController {

    /**
     * Ne crée pas d'instance mais permet de récupérer l'instance active
     */
    public static getInstance() {
        return VueAppController.instance_;
    }

    private static instance_: VueAppController;

    public data_ui_debug;
    public data_user;
    public data_user_roles: RoleVO[] = null;
    // public data_base_api_url;
    public data_default_locale;
    public data_is_dev: boolean;
    public ALL_LOCALES: any;
    public SERVER_HEADERS;
    public base_url: string;

    public csrf_token: string = null;

    /**
     * Module un peu spécifique qui peut avoir un impact sur les perfs donc on gère son accès le plus vite possible
     */
    public has_access_to_onpage_translation: boolean = false;

    protected constructor() {
        VueAppController.instance_ = this;
    }

    public async initialize() {
        let promises = [];
        let self = this;
        let datas;

        promises.push((async () => {
            self.base_url = await ModuleDAO.getInstance().getBaseUrl();
        })());

        promises.push((async () => {
            datas = JSON.parse(await ModuleAjaxCache.getInstance().get('/api/clientappcontrollerinit', CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED) as string);
        })());

        promises.push((async () => {
            self.data_user_roles = await ModuleAccessPolicy.getInstance().getMyRoles();
        })());

        promises.push((async () => {
            self.ALL_LOCALES = await ModuleTranslation.getInstance().getALL_LOCALES();
        })());

        promises.push((async () => {
            self.has_access_to_onpage_translation = await ModuleAccessPolicy.getInstance().checkAccess(ModuleTranslation.POLICY_ON_PAGE_TRANSLATION_MODULE_ACCESS);
        })());

        promises.push((async () => {
            self.SERVER_HEADERS = JSON.parse(await ModuleAjaxCache.getInstance().get('/api/reflect_headers?v=' + Date.now(), CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED) as string);
        })());

        await Promise.all(promises);

        this.data_user = (!!datas.data_user) ? datas.data_user : null;
        ModuleAccessPolicy.getInstance().connected_user = this.data_user;
        this.data_ui_debug = datas.data_ui_debug;
        // this.data_base_api_url = datas.data_base_api_url;
        this.data_default_locale = datas.data_default_locale;
        this.data_is_dev = datas.data_is_dev;
    }
}