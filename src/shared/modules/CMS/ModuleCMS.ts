import AccessPolicyTools from '../../tools/AccessPolicyTools';
import { field_names } from '../../tools/ObjectHandler';
import URLHandler from '../../tools/URLHandler';
import APIControllerWrapper from '../API/APIControllerWrapper';
import NumberParamVO, { NumberParamVOStatic } from '../API/vos/apis/NumberParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import ImageVO from '../Image/vos/ImageVO';
import Module from '../Module';
import ModuleTableVO from '../DAO/vos/ModuleTableVO';
import ModuleTableFieldController from '../DAO/ModuleTableFieldController';
import ModuleTableFieldVO from '../DAO/vos/ModuleTableFieldVO';
import TranslatableTextVO from '../Translation/vos/TranslatableTextVO';
import VOsTypesManager from '../VO/manager/VOsTypesManager';
import IInstantiatedPageComponent from './interfaces/IInstantiatedPageComponent';
import HtmlComponentVO from './page_components_types/HtmlComponentVO';
import HtmlHtmlComponentVO from './page_components_types/HtmlHtmlComponentVO';
import HtmlHtmlHtmlComponentVO from './page_components_types/HtmlHtmlHtmlComponentVO';
import HtmlImgComponentVO from './page_components_types/HtmlImgComponentVO';
import ImgHtmlComponentVO from './page_components_types/ImgHtmlComponentVO';
import ContentTypeVO from './vos/ContentTypeVO';
import PageAliasVO from './vos/PageAliasVO';
import PageVO from './vos/PageVO';
import TemplateComponentVO from './vos/TemplateComponentVO';

export default class ModuleCMS extends Module {

    public static MODULE_NAME: string = "CMS";
    public static POLICY_GROUP = AccessPolicyTools.POLICY_GROUP_UID_PREFIX + ModuleCMS.MODULE_NAME;

    public static POLICY_BO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleCMS.MODULE_NAME + ".BO_ACCESS";
    public static POLICY_FO_ACCESS = AccessPolicyTools.POLICY_UID_PREFIX + ModuleCMS.MODULE_NAME + ".FO_ACCESS";

    // public static APINAME_registerTemplateComponent: string = "registerTemplateComponent";
    public static APINAME_getPageComponents: string = "getPageComponents";

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleCMS {
        if (!ModuleCMS.instance) {
            ModuleCMS.instance = new ModuleCMS();
        }
        return ModuleCMS.instance;
    }

    private static instance: ModuleCMS = null;

    /**
     * Local thread cache -----
     */
    public registered_template_components_by_type: { [type: string]: TemplateComponentVO } = {};
    /**
     * ----- Local thread cache
     */

    public getPageComponents: (page_id: number) => Promise<IInstantiatedPageComponent[]> = APIControllerWrapper.sah(ModuleCMS.APINAME_getPageComponents);

    private constructor() {

        super("cms", ModuleCMS.MODULE_NAME);
    }

    public registerApis() {
        APIControllerWrapper.registerApi(new GetAPIDefinition<NumberParamVO, boolean>(
            null,
            ModuleCMS.APINAME_getPageComponents,
            (param: NumberParamVO) => {
                // On se base sur les templates enregistrés pour définir les types dont dépend cette api
                const res: string[] = [];
                for (const i in ModuleCMS.getInstance().registered_template_components_by_type) {
                    const registered_template_component: TemplateComponentVO = ModuleCMS.getInstance().registered_template_components_by_type[i];
                    res.push(registered_template_component.type_id);
                }

                return res;
            },
            NumberParamVOStatic
        ));

        // APIControllerWrapper.registerApi(new PostAPIDefinition<TemplateComponentVO, TemplateComponentVO>(
        //     null,
        //     ModuleCMS.APINAME_registerTemplateComponent,
        //     [TemplateComponentVO.API_TYPE_ID]
        // ));
    }

    // TODO FIXME REBUILD API
    // /**
    //  * This function has to be called both in the server and client contexts, to register the component types
    //  *  so one call in the shared section while initializing modules should be ok
    //  * @param templateComponent description of the templateComponent to recover/register
    //  */
    // public async registerTemplateComponent(templateComponent: TemplateComponentVO): Promise<TemplateComponentVO> {
    //     let res: TemplateComponentVO = await APIControllerWrapper.sah(ModuleCMS.APINAME_registerTemplateComponent, templateComponent);

    //     if (!ModuleCMS.getInstance().registered_template_components_by_type[templateComponent.type_id]) {
    //         ModuleCMS.getInstance().registered_template_components_by_type[templateComponent.type_id] = templateComponent;
    //     }

    //     return res;
    // }

    /**
     * Checks the format of the route and makes sure it's ok to work with
     * @param route the route we need to check
     * @returns the route updated if necessary or null if unable to complete task
     */
    public clean_route(route: string): string {
        if ((!route) || (route == "")) {
            return null;
        }

        if (!route.startsWith('/')) {
            route = '/' + route;
        }

        if (!URLHandler.isValidRoute(route)) {
            return null;
        }

        return route;
    }

    public initialize() {
        this.initializeContentTypeVO();
        this.initializePageVO();
        this.initializePageAliasVO();
        this.initializeTemplateComponentVO();

        this.initializeHTML_ComponentVO();
        this.initializeHTML_HTML_ComponentVO();
        this.initializeHTML_HTML_HTML_ComponentVO();
        this.initializeImg_HTML_ComponentVO();
        this.initializeHTML_Img_ComponentVO();
    }

    // public async hook_module_async_client_admin_initialization(): Promise<any> {
    //     await this.configure_templates();
    //     return true;
    // }

    // public async hook_module_configure(): Promise<boolean> {
    //     await this.configure_templates();
    //     return true;
    // }

    // private async configure_templates(): Promise<boolean> {

    //     let templateComponent: TemplateComponentVO = new TemplateComponentVO();
    //     templateComponent.type_id = HtmlComponentVO.API_TYPE_ID;
    //     templateComponent.weight = 0;
    //     await this.registerTemplateComponent(templateComponent);

    //     templateComponent = new TemplateComponentVO();
    //     templateComponent.type_id = HtmlHtmlComponentVO.API_TYPE_ID;
    //     templateComponent.weight = 1;
    //     await this.registerTemplateComponent(templateComponent);

    //     templateComponent = new TemplateComponentVO();
    //     templateComponent.type_id = HtmlHtmlHtmlComponentVO.API_TYPE_ID;
    //     templateComponent.weight = 2;
    //     await this.registerTemplateComponent(templateComponent);

    //     templateComponent = new TemplateComponentVO();
    //     templateComponent.type_id = ImgHtmlComponentVO.API_TYPE_ID;
    //     templateComponent.weight = 3;
    //     await this.registerTemplateComponent(templateComponent);

    //     templateComponent = new TemplateComponentVO();
    //     templateComponent.type_id = HtmlImgComponentVO.API_TYPE_ID;
    //     templateComponent.weight = 4;
    //     await this.registerTemplateComponent(templateComponent);

    //     return true;
    // }

    private initializePageVO() {
        const content_type_id = ModuleTableFieldController.create_new(PageVO.API_TYPE_ID, field_names<PageVO>().content_type_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Type de contenu', true);
        const translatable_title_id = ModuleTableFieldController.create_new(PageVO.API_TYPE_ID, field_names<PageVO>().translatable_title_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Titre', true);
        const label_field = translatable_title_id;
        const datatable_fields = [
            ModuleTableFieldController.create_new(PageVO.API_TYPE_ID, field_names<PageVO>().main_route, ModuleTableFieldVO.FIELD_TYPE_string, 'URL principale', true),
            content_type_id,
            translatable_title_id
        ];

        const datatable = new ModuleTableVO(this, PageVO.API_TYPE_ID, () => new PageVO(), datatable_fields, label_field, "Pages");
        translatable_title_id.set_many_to_one_target_moduletable_name(TranslatableTextVO.API_TYPE_ID);
        content_type_id.set_many_to_one_target_moduletable_name(ContentTypeVO.API_TYPE_ID);
        this.datatables.push(datatable);
    }

    private initializeContentTypeVO() {
        const translatable_name_id = ModuleTableFieldController.create_new(ContentTypeVO.API_TYPE_ID, field_names<ContentTypeVO>().translatable_name_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Nom', true);
        const label_field = translatable_name_id;
        const translatable_desc_id = ModuleTableFieldController.create_new(ContentTypeVO.API_TYPE_ID, field_names<ContentTypeVO>().translatable_desc_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Description', false);
        const datatable_fields = [
            translatable_name_id,
            translatable_desc_id
        ];

        const datatable = new ModuleTableVO(this, ContentTypeVO.API_TYPE_ID, () => new ContentTypeVO(), datatable_fields, label_field, "Types de contenus");
        translatable_desc_id.set_many_to_one_target_moduletable_name(TranslatableTextVO.API_TYPE_ID);
        translatable_name_id.set_many_to_one_target_moduletable_name(TranslatableTextVO.API_TYPE_ID);
        this.datatables.push(datatable);
    }

    private initializePageAliasVO() {
        const label_field = ModuleTableFieldController.create_new(PageAliasVO.API_TYPE_ID, field_names<PageAliasVO>().alias_route, ModuleTableFieldVO.FIELD_TYPE_string, 'Alias', true);
        const page_id = ModuleTableFieldController.create_new(PageAliasVO.API_TYPE_ID, field_names<PageAliasVO>().page_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Page', true);
        const datatable_fields = [
            label_field,
            page_id
        ];

        const datatable = new ModuleTableVO(this, PageAliasVO.API_TYPE_ID, () => new PageAliasVO(), datatable_fields, label_field, "Alias des pages");
        page_id.set_many_to_one_target_moduletable_name(PageVO.API_TYPE_ID);
        this.datatables.push(datatable);
    }

    private initializeTemplateComponentVO() {
        const label_field = ModuleTableFieldController.create_new(TemplateComponentVO.API_TYPE_ID, field_names<TemplateComponentVO>().type_id, ModuleTableFieldVO.FIELD_TYPE_string, 'UID du composant', true);
        const translatable_name_id = ModuleTableFieldController.create_new(TemplateComponentVO.API_TYPE_ID, field_names<TemplateComponentVO>().translatable_title_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Nom', false);
        const translatable_desc_id = ModuleTableFieldController.create_new(TemplateComponentVO.API_TYPE_ID, field_names<TemplateComponentVO>().translatable_desc_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Description', false);
        const thumbnail_id = ModuleTableFieldController.create_new(TemplateComponentVO.API_TYPE_ID, field_names<TemplateComponentVO>().thumbnail_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Miniature', false);
        const datatable_fields = [
            label_field,
            translatable_name_id,
            translatable_desc_id,
            thumbnail_id,
            ModuleTableFieldController.create_new(TemplateComponentVO.API_TYPE_ID, field_names<TemplateComponentVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        const datatable = new ModuleTableVO(this, TemplateComponentVO.API_TYPE_ID, () => new TemplateComponentVO(), datatable_fields, label_field, "Templates de composants");
        translatable_name_id.set_many_to_one_target_moduletable_name(TranslatableTextVO.API_TYPE_ID);
        translatable_desc_id.set_many_to_one_target_moduletable_name(TranslatableTextVO.API_TYPE_ID);
        thumbnail_id.set_many_to_one_target_moduletable_name(ImageVO.API_TYPE_ID);
        this.datatables.push(datatable);
    }


    private initializeImg_HTML_ComponentVO() {
        const page_id = ModuleTableFieldController.create_new(ImgHtmlComponentVO.API_TYPE_ID, field_names<ImgHtmlComponentVO>().page_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Page', true);
        const image_vo_id = ModuleTableFieldController.create_new(ImgHtmlComponentVO.API_TYPE_ID, field_names<ImgHtmlComponentVO>().image_vo_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Image', false);
        const datatable_fields = [
            page_id,
            image_vo_id,
            ModuleTableFieldController.create_new(ImgHtmlComponentVO.API_TYPE_ID, field_names<ImgHtmlComponentVO>().html, ModuleTableFieldVO.FIELD_TYPE_html, 'HTML', false),
            ModuleTableFieldController.create_new(ImgHtmlComponentVO.API_TYPE_ID, field_names<ImgHtmlComponentVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        const datatable = new ModuleTableVO(this, ImgHtmlComponentVO.API_TYPE_ID, () => new ImgHtmlComponentVO(), datatable_fields, null, "Composant template : Img+HTML");
        page_id.set_many_to_one_target_moduletable_name(PageVO.API_TYPE_ID);
        image_vo_id.set_many_to_one_target_moduletable_name(ImageVO.API_TYPE_ID);
        this.datatables.push(datatable);
    }

    private initializeHTML_Img_ComponentVO() {
        const page_id = ModuleTableFieldController.create_new(HtmlImgComponentVO.API_TYPE_ID, field_names<HtmlImgComponentVO>().page_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Page', true);
        const image_vo_id = ModuleTableFieldController.create_new(HtmlImgComponentVO.API_TYPE_ID, field_names<HtmlImgComponentVO>().image_vo_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Image', false);
        const datatable_fields = [
            page_id,
            image_vo_id,
            ModuleTableFieldController.create_new(HtmlImgComponentVO.API_TYPE_ID, field_names<HtmlImgComponentVO>().html, ModuleTableFieldVO.FIELD_TYPE_html, 'HTML', false),
            ModuleTableFieldController.create_new(HtmlImgComponentVO.API_TYPE_ID, field_names<HtmlImgComponentVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        const datatable = new ModuleTableVO(this, HtmlImgComponentVO.API_TYPE_ID, () => new HtmlImgComponentVO(), datatable_fields, null, "Composant template : HTML+Img");
        page_id.set_many_to_one_target_moduletable_name(PageVO.API_TYPE_ID);
        image_vo_id.set_many_to_one_target_moduletable_name(ImageVO.API_TYPE_ID);
        this.datatables.push(datatable);
    }

    private initializeHTML_ComponentVO() {
        const page_id = ModuleTableFieldController.create_new(HtmlComponentVO.API_TYPE_ID, field_names<HtmlComponentVO>().page_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Page', true);
        const datatable_fields = [
            page_id,
            ModuleTableFieldController.create_new(HtmlComponentVO.API_TYPE_ID, field_names<HtmlComponentVO>().html, ModuleTableFieldVO.FIELD_TYPE_html, 'Texte', false),
            ModuleTableFieldController.create_new(HtmlComponentVO.API_TYPE_ID, field_names<HtmlComponentVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        const datatable = new ModuleTableVO(this, HtmlComponentVO.API_TYPE_ID, () => new HtmlComponentVO(), datatable_fields, null, "Composant template : HTML");
        page_id.set_many_to_one_target_moduletable_name(PageVO.API_TYPE_ID);
        this.datatables.push(datatable);
    }

    private initializeHTML_HTML_ComponentVO() {
        const page_id = ModuleTableFieldController.create_new(HtmlHtmlComponentVO.API_TYPE_ID, field_names<HtmlHtmlComponentVO>().page_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Page', true);
        const datatable_fields = [
            page_id,
            ModuleTableFieldController.create_new(HtmlHtmlComponentVO.API_TYPE_ID, field_names<HtmlHtmlComponentVO>().left_html, ModuleTableFieldVO.FIELD_TYPE_html, 'Texte - Gauche', false),
            ModuleTableFieldController.create_new(HtmlHtmlComponentVO.API_TYPE_ID, field_names<HtmlHtmlComponentVO>().right_html, ModuleTableFieldVO.FIELD_TYPE_html, 'Texte - Droite', false),
            ModuleTableFieldController.create_new(HtmlHtmlComponentVO.API_TYPE_ID, field_names<HtmlHtmlComponentVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        const datatable = new ModuleTableVO(this, HtmlHtmlComponentVO.API_TYPE_ID, () => new HtmlHtmlComponentVO(), datatable_fields, null, "Composant template : HTML+HTML");
        page_id.set_many_to_one_target_moduletable_name(PageVO.API_TYPE_ID);
        this.datatables.push(datatable);
    }

    private initializeHTML_HTML_HTML_ComponentVO() {
        const page_id = ModuleTableFieldController.create_new(HtmlHtmlHtmlComponentVO.API_TYPE_ID, field_names<HtmlHtmlHtmlComponentVO>().page_id, ModuleTableFieldVO.FIELD_TYPE_foreign_key, 'Page', true);
        const datatable_fields = [
            page_id,
            ModuleTableFieldController.create_new(HtmlHtmlHtmlComponentVO.API_TYPE_ID, field_names<HtmlHtmlHtmlComponentVO>().left_html, ModuleTableFieldVO.FIELD_TYPE_html, 'Texte - Gauche', false),
            ModuleTableFieldController.create_new(HtmlHtmlHtmlComponentVO.API_TYPE_ID, field_names<HtmlHtmlHtmlComponentVO>().center_html, ModuleTableFieldVO.FIELD_TYPE_html, 'Texte - Centre', false),
            ModuleTableFieldController.create_new(HtmlHtmlHtmlComponentVO.API_TYPE_ID, field_names<HtmlHtmlHtmlComponentVO>().right_html, ModuleTableFieldVO.FIELD_TYPE_html, 'Texte - Droite', false),
            ModuleTableFieldController.create_new(HtmlHtmlHtmlComponentVO.API_TYPE_ID, field_names<HtmlHtmlHtmlComponentVO>().weight, ModuleTableFieldVO.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        const datatable = new ModuleTableVO(this, HtmlHtmlHtmlComponentVO.API_TYPE_ID, () => new HtmlHtmlHtmlComponentVO(), datatable_fields, null, "Composant template : HTML+HTML+HTML");
        page_id.set_many_to_one_target_moduletable_name(PageVO.API_TYPE_ID);
        this.datatables.push(datatable);
    }
}