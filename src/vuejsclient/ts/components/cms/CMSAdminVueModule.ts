import ModuleCMS from '../../../../shared/modules/CMS/ModuleCMS';
import ContentTypeVO from '../../../../shared/modules/CMS/vos/ContentTypeVO';
import PageAliasVO from '../../../../shared/modules/CMS/vos/PageAliasVO';
import PageVO from '../../../../shared/modules/CMS/vos/PageVO';
import TemplateComponentVO from '../../../../shared/modules/CMS/vos/TemplateComponentVO';
import MenuElementVO from '../../../../shared/modules/Menu/vos/MenuElementVO';
import CRUDComponentManager from '../../../ts/components/crud/CRUDComponentManager';
import VueModuleBase from '../../../ts/modules/VueModuleBase';
import VueAppController from '../../../VueAppController';
import MenuController from '../menu/MenuController';

export default class CMSAdminVueModule extends VueModuleBase {

    public static getInstance(): CMSAdminVueModule {
        if (!CMSAdminVueModule.instance) {
            CMSAdminVueModule.instance = new CMSAdminVueModule();
        }

        return CMSAdminVueModule.instance;
    }

    private static instance: CMSAdminVueModule = null;

    private constructor() {

        super(ModuleCMS.getInstance().name);
        this.policies_needed = [
            ModuleCMS.POLICY_BO_ACCESS
        ];
    }

    public async initializeAsync() {

        if (!this.policies_loaded[ModuleCMS.POLICY_BO_ACCESS]) {
            return;
        }

        let menuBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleCMS.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "CMSAdminVueModule",
                    "fa-newspaper-o",
                    20,
                    null
                )
            );

        let contentsComponentsBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleCMS.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "CMSAdminVueModule_ContentsComponents",
                    "fa-newspaper-o",
                    10,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(
            PageVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleCMS.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                "PageVO",
                "fa-newspaper-o",
                10,
                null,
                null,
                contentsComponentsBranch.id
            ),
            this.routes);

        let pageComponentsBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleCMS.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "CMSAdminVueModule_PageComponents",
                    "fa-cogs",
                    50,
                    null
                )
            );

        for (let i in ModuleCMS.getInstance().registered_template_components_by_type) {
            let registered_template_component: TemplateComponentVO = ModuleCMS.getInstance().registered_template_components_by_type[i];

            await CRUDComponentManager.getInstance().registerCRUD(
                registered_template_component.type_id,
                null,
                MenuElementVO.create_new(
                    ModuleCMS.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    registered_template_component.type_id,
                    "fa-cogs",
                    registered_template_component.weight,
                    null,
                    null,
                    pageComponentsBranch.id
                ),
                this.routes);
        }

        let structureComponentsBranch: MenuElementVO =
            await MenuController.getInstance().declare_menu_element(
                MenuElementVO.create_new(
                    ModuleCMS.POLICY_BO_ACCESS,
                    VueAppController.getInstance().app_name,
                    "CMSAdminVueModule_Structure",
                    "fa-cogs",
                    40,
                    null
                )
            );

        await CRUDComponentManager.getInstance().registerCRUD(
            ContentTypeVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleCMS.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                "ContentTypeVO",
                "fa-cogs",
                10,
                null,
                null,
                menuBranch.id
            ),
            this.routes);

        await CRUDComponentManager.getInstance().registerCRUD(
            PageAliasVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleCMS.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                "PageAliasVO",
                "fa-globe",
                20,
                null,
                null,
                menuBranch.id
            ),
            this.routes);

        await CRUDComponentManager.getInstance().registerCRUD(
            TemplateComponentVO.API_TYPE_ID,
            null,
            MenuElementVO.create_new(
                ModuleCMS.POLICY_BO_ACCESS,
                VueAppController.getInstance().app_name,
                "TemplateComponentVO",
                "fa-cogs",
                30,
                null,
                null,
                structureComponentsBranch.id
            ),
            this.routes);
    }
}