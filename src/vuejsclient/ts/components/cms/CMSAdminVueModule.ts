import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleCMS from '../../../../shared/modules/CMS/ModuleCMS';
import HTML_ComponentVO from '../../../../shared/modules/CMS/template_components_vo/HTML_ComponentVO';
import HTML_HTML_ComponentVO from '../../../../shared/modules/CMS/template_components_vo/HTML_HTML_ComponentVO';
import HTML_HTML_HTML_ComponentVO from '../../../../shared/modules/CMS/template_components_vo/HTML_HTML_HTML_ComponentVO';
import Img_HTML_ComponentVO from '../../../../shared/modules/CMS/template_components_vo/Img_HTML_ComponentVO';
import ContentTypeVO from '../../../../shared/modules/CMS/vos/ContentTypeVO';
import PageAliasVO from '../../../../shared/modules/CMS/vos/PageAliasVO';
import PageComponentVO from '../../../../shared/modules/CMS/vos/PageComponentVO';
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

        CRUDComponentManager.getInstance().registerCRUD(
            PageComponentVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("PageComponentVO", MenuElementBase.PRIORITY_MEDIUM, "fa-th-large"),
                cmsMenuBranch,
                contentsComponentsBranch),
            this.routes);

        let pageComponentsBranch: MenuBranch = new MenuBranch("CMSAdminVueModule_PageComponents", MenuElementBase.PRIORITY_ULTRALOW, "fa-cogs", []);

        CRUDComponentManager.getInstance().registerCRUD(
            HTML_ComponentVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("HTML_ComponentVO", MenuElementBase.PRIORITY_LOW, "fa-cogs"),
                cmsMenuBranch,
                pageComponentsBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            HTML_HTML_ComponentVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("HTML_HTML_ComponentVO", MenuElementBase.PRIORITY_LOW, "fa-cogs"),
                cmsMenuBranch,
                pageComponentsBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            HTML_HTML_HTML_ComponentVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("HTML_HTML_HTML_ComponentVO", MenuElementBase.PRIORITY_LOW, "fa-cogs"),
                cmsMenuBranch,
                pageComponentsBranch),
            this.routes);

        CRUDComponentManager.getInstance().registerCRUD(
            Img_HTML_ComponentVO.API_TYPE_ID,
            null,
            new MenuPointer(
                new MenuLeaf("Img_HTML_ComponentVO", MenuElementBase.PRIORITY_LOW, "fa-cogs"),
                cmsMenuBranch,
                pageComponentsBranch),
            this.routes);

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