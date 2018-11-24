import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleCMS from '../../../../shared/modules/CMS/ModuleCMS';
import HtmlComponentVO from '../../../../shared/modules/CMS/page_components_types/HtmlComponentVO';
import HtmlHtmlComponentVO from '../../../../shared/modules/CMS/page_components_types/HtmlHtmlComponentVO';
import HtmlHtmlHtmlComponentVO from '../../../../shared/modules/CMS/page_components_types/HtmlHtmlHtmlComponentVO';
import ImgHtmlComponentVO from '../../../../shared/modules/CMS/page_components_types/ImgHtmlComponentVO';
import ContentTypeVO from '../../../../shared/modules/CMS/vos/ContentTypeVO';
import PageAliasVO from '../../../../shared/modules/CMS/vos/PageAliasVO';
import PageVO from '../../../../shared/modules/CMS/vos/PageVO';
import TemplateComponentVO from '../../../../shared/modules/CMS/vos/TemplateComponentVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import MenuBranch from '../../../ts/components/menu/vos/MenuBranch';
import MenuElementBase from '../../../ts/components/menu/vos/MenuElementBase';
import MenuLeaf from '../../../ts/components/menu/vos/MenuLeaf';
import MenuPointer from '../../../ts/components/menu/vos/MenuPointer';
import VueModuleBase from '../../../ts/modules/VueModuleBase';

export default class CMSAdminVueModule extends VueModuleBase {

    public static DEFAULT_CMS_MENU_BRANCH: MenuBranch = new MenuBranch(
        "CMSAdminVueModule",
        MenuElementBase.PRIORITY_HIGH,
        "fa-newspaper-o",
        []
    );

    public static getInstance(): CMSAdminVueModule {
        if (!CMSAdminVueModule.instance) {
            CMSAdminVueModule.instance = new CMSAdminVueModule();
        }

        return CMSAdminVueModule.instance;
    }

    private static instance: CMSAdminVueModule = null;

    private constructor() {

        super(ModuleCMS.getInstance().name);
    }

    public async initializeAsync() {

        if (!await ModuleAccessPolicy.getInstance().checkAccess(ModuleCMS.POLICY_BO_ACCESS)) {
            return;
        }

        let cmsMenuBranch: MenuBranch = CMSAdminVueModule.DEFAULT_CMS_MENU_BRANCH;

        let contentsComponentsBranch: MenuBranch = new MenuBranch("CMSAdminVueModule_ContentsComponents", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-newspaper-o", []);

        CRUDComponentManager.getInstance().registerCRUD(
            PageVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("PageVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-newspaper-o"),
                cmsMenuBranch,
                contentsComponentsBranch),
            this.routes);

        let pageComponentsBranch: MenuBranch = new MenuBranch("CMSAdminVueModule_PageComponents", MenuElementBase.PRIORITY_ULTRALOW, "fa-cogs", []);

        for (let i in ModuleCMS.getInstance().registered_template_components) {
            let registered_template_component: TemplateComponentVO = ModuleCMS.getInstance().registered_template_components[i];

            CRUDComponentManager.getInstance().registerCRUD(
                registered_template_component.type_id,
                null,
                new MenuPointer(
                    new MenuLeaf(registered_template_component.type_id, registered_template_component.weight, "fa-cogs"),
                    cmsMenuBranch,
                    pageComponentsBranch),
                this.routes);
        }

        let structureComponentsBranch: MenuBranch = new MenuBranch("CMSAdminVueModule_Structure", MenuElementBase.PRIORITY_LOW, "fa-cogs", []);

        CRUDComponentManager.getInstance().registerCRUD(
            ContentTypeVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("ContentTypeVO", MenuElementBase.PRIORITY_ULTRAHIGH, "fa-cogs"),
                cmsMenuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            PageAliasVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("PageAliasVO", MenuElementBase.PRIORITY_HIGH, "fa-globe"),
                cmsMenuBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            TemplateComponentVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("TemplateComponentVO", MenuElementBase.PRIORITY_MEDIUM, "fa-cogs"),
                cmsMenuBranch,
                structureComponentsBranch),
            this.routes);
    }
}