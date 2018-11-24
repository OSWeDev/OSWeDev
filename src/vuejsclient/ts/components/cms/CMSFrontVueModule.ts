import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleCMS from '../../../../shared/modules/CMS/ModuleCMS';
import PageAliasVO from '../../../../shared/modules/CMS/vos/PageAliasVO';
import PageVO from '../../../../shared/modules/CMS/vos/PageVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import CMSPageComponent from './CMSPageComponent';

export default class CMSFrontVueModule extends VueModuleBase {

    public static getInstance(): CMSFrontVueModule {
        if (!CMSFrontVueModule.instance) {
            CMSFrontVueModule.instance = new CMSFrontVueModule();
        }

        return CMSFrontVueModule.instance;
    }

    private static instance: CMSFrontVueModule = null;

    private constructor() {

        super(ModuleCMS.getInstance().name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleCMS.POLICY_FO_ACCESS)) {
            return;
        }

        let pages_by_ids: { [id: number]: PageVO } = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDAO.getInstance().getVos<PageVO>(PageVO.API_TYPE_ID));
        let pages_aliases: PageAliasVO[] = await ModuleDAO.getInstance().getVos<PageAliasVO>(PageAliasVO.API_TYPE_ID);

        let cms_routes_by_aliases: { [route: string]: PageVO } = {};

        for (let i in pages_by_ids) {
            let page: PageVO = pages_by_ids[i];

            let cleaned_route: string = ModuleCMS.getInstance().clean_route(page.main_route);

            if (!cms_routes_by_aliases[cleaned_route]) {
                cms_routes_by_aliases[cleaned_route] = page;
            }
        }

        for (let i in pages_aliases) {
            let page_aliase: PageAliasVO = pages_aliases[i];

            let cleaned_route: string = ModuleCMS.getInstance().clean_route(page_aliase.alias_route);

            if ((!cms_routes_by_aliases[cleaned_route]) || (cms_routes_by_aliases[cleaned_route].id != page_aliase.page_id)) {
                cms_routes_by_aliases[cleaned_route] = pages_by_ids[page_aliase.page_id];
            }
        }

        for (let cms_route in cms_routes_by_aliases) {
            let page: PageVO = cms_routes_by_aliases[cms_route];

            this.routes.push({
                path: page.main_route,
                component: CMSPageComponent,
                props: () => ({
                    page_id: page.id,
                    preloaded_page: page
                })
            });
        }
    }
}