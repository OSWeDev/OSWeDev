import ModuleAccessPolicy from '../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleAjaxCache from '../shared/modules/AjaxCache/ModuleAjaxCache';
import CacheInvalidationRulesVO from '../shared/modules/AjaxCache/vos/CacheInvalidationRulesVO';
import ModuleTranslation from '../shared/modules/Translation/ModuleTranslation';
import RoleVO from '../shared/modules/AccessPolicy/vos/RoleVO';

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
    public data_base_api_url;
    public data_default_locale;
    public data_is_dev: boolean;
    public ALL_LOCALES: any;
    public SERVER_HEADERS;
    public my_roles: RoleVO[] = [];

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

        promises.push(ModuleAjaxCache.getInstance().get('/api/clientappcontrollerinit', CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED).then((d) => {
            datas = JSON.parse(d as string);
        }));

        // On précharge les rôles de l'utilisateur connecté
        promises.push((async () => {
            self.my_roles = await ModuleAccessPolicy.getInstance().getMyRoles();
        })());

        promises.push((async () => {
            self.ALL_LOCALES = await ModuleTranslation.getInstance().getALL_LOCALES();
        })());

        promises.push((async () => {
            self.has_access_to_onpage_translation = await ModuleAccessPolicy.getInstance().checkAccess(ModuleTranslation.ACCESS_GROUP_NAME, ModuleTranslation.ACCESS_ON_PAGE_TRANSLATION_MODULE);
        })());

        promises.push(ModuleAjaxCache.getInstance().get('/api/reflect_headers?v=' + Date.now(), CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED).then((d) => {
            self.SERVER_HEADERS = JSON.parse(d as string);
        }));

        await Promise.all(promises);

        this.data_user = datas.data_user;
        ModuleAccessPolicy.getInstance().connected_user = this.data_user;
        this.data_ui_debug = datas.data_ui_debug;
        this.data_base_api_url = datas.data_base_api_url;
        this.data_default_locale = datas.data_default_locale;
        this.data_is_dev = datas.data_is_dev;
    }



    /**
     * !!!!!! WARNING !!!!!!
     * USE only in synchronous forced context like the initialization step of angular
     * In any other case, use the server side methods
     */
    public hasRole(role_name: string): boolean {
        for (let i in this.my_roles) {
            let my_role: RoleVO = this.my_roles[i];

            if (my_role.translatable_name == role_name) {
                return true;
            }
        }
        return false;
    }
}