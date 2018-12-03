import URLHandler from '../../tools/URLHandler';
import ModuleAccessPolicy from '../AccessPolicy/ModuleAccessPolicy';
import ModuleAPI from '../API/ModuleAPI';
import NumberParamVO from '../API/vos/apis/NumberParamVO';
import GetAPIDefinition from '../API/vos/GetAPIDefinition';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import ImageVO from '../Image/vos/ImageVO';
import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import TranslatableTextVO from '../Translation/vos/TranslatableTextVO';
import VOsTypesManager from '../VOsTypesManager';
import IInstantiatedPageComponent from './interfaces/IInstantiatedPageComponent';
import HtmlComponentVO from './page_components_types/HtmlComponentVO';
import HtmlHtmlComponentVO from './page_components_types/HtmlHtmlComponentVO';
import HtmlHtmlHtmlComponentVO from './page_components_types/HtmlHtmlHtmlComponentVO';
import ImgHtmlComponentVO from './page_components_types/ImgHtmlComponentVO';
import ContentTypeVO from './vos/ContentTypeVO';
import PageAliasVO from './vos/PageAliasVO';
import PageVO from './vos/PageVO';
import TemplateComponentVO from './vos/TemplateComponentVO';
import HtmlImgComponentVO from './page_components_types/HtmlImgComponentVO';

export default class ModuleCMS extends Module {

    public static MODULE_NAME: string = "CMS";
    public static POLICY_GROUP = ModuleAccessPolicy.POLICY_GROUP_UID_PREFIX + ModuleCMS.MODULE_NAME;

    public static POLICY_BO_ACCESS = ModuleAccessPolicy.POLICY_UID_PREFIX + ModuleCMS.MODULE_NAME + ".BO_ACCESS";
    public static POLICY_FO_ACCESS = ModuleAccessPolicy.POLICY_UID_PREFIX + ModuleCMS.MODULE_NAME + ".FO_ACCESS";

    public static APINAME_registerTemplateComponent: string = "registerTemplateComponent";
    public static APINAME_getPageComponents: string = "getPageComponents";

    public static getInstance(): ModuleCMS {
        if (!ModuleCMS.instance) {
            ModuleCMS.instance = new ModuleCMS();
        }
        return ModuleCMS.instance;
    }

    private static instance: ModuleCMS = null;

    public registered_template_components_by_type: { [type: string]: TemplateComponentVO } = {};
    private constructor() {

        super("cms", ModuleCMS.MODULE_NAME);
    }

    public registerApis() {
        ModuleAPI.getInstance().registerApi(new GetAPIDefinition<NumberParamVO, boolean>(
            ModuleCMS.APINAME_getPageComponents,
            (param: NumberParamVO) => {
                // On se base sur les templates enregistrés pour définir les types dont dépend cette api
                let res: string[] = [];
                for (let i in ModuleCMS.getInstance().registered_template_components_by_type) {
                    let registered_template_component: TemplateComponentVO = ModuleCMS.getInstance().registered_template_components_by_type[i];
                    res.push(registered_template_component.type_id);
                }

                return res;
            },
            NumberParamVO.translateCheckAccessParams,
            NumberParamVO.URL,
            NumberParamVO.translateToURL,
            NumberParamVO.translateFromREQ
        ));

        ModuleAPI.getInstance().registerApi(new PostAPIDefinition<TemplateComponentVO, TemplateComponentVO>(
            ModuleCMS.APINAME_registerTemplateComponent,
            [TemplateComponentVO.API_TYPE_ID]
        ));
    }

    public async getPageComponents(page_id: number): Promise<IInstantiatedPageComponent[]> {
        return await ModuleAPI.getInstance().handleAPI<NumberParamVO, IInstantiatedPageComponent[]>(ModuleCMS.APINAME_getPageComponents, page_id);
    }

    /**
     * This function has to be called both in the server and client contexts, to register the component types
     *  so one call in the shared section while initializing modules should be ok
     * @param templateComponent description of the templateComponent to recover/register
     */
    public async registerTemplateComponent(templateComponent: TemplateComponentVO): Promise<TemplateComponentVO> {
        let res: TemplateComponentVO = await ModuleAPI.getInstance().handleAPI<TemplateComponentVO, TemplateComponentVO>(ModuleCMS.APINAME_registerTemplateComponent, templateComponent);

        if (!ModuleCMS.getInstance().registered_template_components_by_type[templateComponent.type_id]) {
            ModuleCMS.getInstance().registered_template_components_by_type[templateComponent.type_id] = templateComponent;
        }

        return res;
    }

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

        if (!URLHandler.getInstance().isValidRoute(route)) {
            return null;
        }

        return route;
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

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

    public async hook_module_async_client_admin_initialization(): Promise<any> {
        await this.configure_templates();
        return true;
    }

    public async hook_module_configure(): Promise<boolean> {
        await this.configure_templates();
        return true;
    }

    private async configure_templates(): Promise<boolean> {

        let templateComponent: TemplateComponentVO = new TemplateComponentVO();
        templateComponent.type_id = HtmlComponentVO.API_TYPE_ID;
        templateComponent.weight = 0;
        await this.registerTemplateComponent(templateComponent);

        templateComponent = new TemplateComponentVO();
        templateComponent.type_id = HtmlHtmlComponentVO.API_TYPE_ID;
        templateComponent.weight = 1;
        await this.registerTemplateComponent(templateComponent);

        templateComponent = new TemplateComponentVO();
        templateComponent.type_id = HtmlHtmlHtmlComponentVO.API_TYPE_ID;
        templateComponent.weight = 2;
        await this.registerTemplateComponent(templateComponent);

        templateComponent = new TemplateComponentVO();
        templateComponent.type_id = ImgHtmlComponentVO.API_TYPE_ID;
        templateComponent.weight = 3;
        await this.registerTemplateComponent(templateComponent);

        templateComponent = new TemplateComponentVO();
        templateComponent.type_id = HtmlImgComponentVO.API_TYPE_ID;
        templateComponent.weight = 4;
        await this.registerTemplateComponent(templateComponent);

        return true;
    }

    private initializePageVO() {
        let content_type_id = new ModuleTableField('content_type_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Type de contenu', true);
        let translatable_title_id = new ModuleTableField('translatable_title_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Titre', true);
        let label_field = translatable_title_id;
        let datatable_fields = [
            new ModuleTableField('main_route', ModuleTableField.FIELD_TYPE_string, 'URL principale', true),
            content_type_id,
            translatable_title_id
        ];

        let datatable = new ModuleTable(this, PageVO.API_TYPE_ID, datatable_fields, label_field, "Pages");
        translatable_title_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[TranslatableTextVO.API_TYPE_ID]);
        content_type_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[ContentTypeVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private initializeContentTypeVO() {
        let translatable_name_id = new ModuleTableField('translatable_name_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Nom', true);
        let label_field = translatable_name_id;
        let translatable_desc_id = new ModuleTableField('translatable_desc_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Description', false);
        let datatable_fields = [
            translatable_name_id,
            translatable_desc_id
        ];

        let datatable = new ModuleTable(this, ContentTypeVO.API_TYPE_ID, datatable_fields, label_field, "Types de contenus");
        translatable_desc_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[TranslatableTextVO.API_TYPE_ID]);
        translatable_name_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[TranslatableTextVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private initializePageAliasVO() {
        let label_field = new ModuleTableField('alias_route', ModuleTableField.FIELD_TYPE_string, 'Alias', true);
        let page_id = new ModuleTableField('page_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Page', true);
        let datatable_fields = [
            label_field,
            page_id
        ];

        let datatable = new ModuleTable(this, PageAliasVO.API_TYPE_ID, datatable_fields, label_field, "Alias des pages");
        page_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[PageVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private initializeTemplateComponentVO() {
        let label_field = new ModuleTableField('type_id', ModuleTableField.FIELD_TYPE_string, 'UID du composant', true);
        let translatable_name_id = new ModuleTableField('translatable_title_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Nom', false);
        let translatable_desc_id = new ModuleTableField('translatable_desc_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Description', false);
        let thumbnail_id = new ModuleTableField('thumbnail_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Miniature', false);
        let datatable_fields = [
            label_field,
            translatable_name_id,
            translatable_desc_id,
            thumbnail_id,
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        let datatable = new ModuleTable(this, TemplateComponentVO.API_TYPE_ID, datatable_fields, label_field, "Templates de composants");
        translatable_name_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[TranslatableTextVO.API_TYPE_ID]);
        translatable_desc_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[TranslatableTextVO.API_TYPE_ID]);
        thumbnail_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[ImageVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }


    private initializeImg_HTML_ComponentVO() {
        let page_id = new ModuleTableField('page_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Page', true);
        let image_vo_id = new ModuleTableField('image_vo_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Image', false);
        let datatable_fields = [
            page_id,
            image_vo_id,
            new ModuleTableField('html', ModuleTableField.FIELD_TYPE_html, 'HTML', false),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        let datatable = new ModuleTable(this, ImgHtmlComponentVO.API_TYPE_ID, datatable_fields, null, "Composant template : Img+HTML");
        page_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[PageVO.API_TYPE_ID]);
        image_vo_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[ImageVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private initializeHTML_Img_ComponentVO() {
        let page_id = new ModuleTableField('page_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Page', true);
        let image_vo_id = new ModuleTableField('image_vo_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Image', false);
        let datatable_fields = [
            page_id,
            image_vo_id,
            new ModuleTableField('html', ModuleTableField.FIELD_TYPE_html, 'HTML', false),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        let datatable = new ModuleTable(this, HtmlImgComponentVO.API_TYPE_ID, datatable_fields, null, "Composant template : HTML+Img");
        page_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[PageVO.API_TYPE_ID]);
        image_vo_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[ImageVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private initializeHTML_ComponentVO() {
        let page_id = new ModuleTableField('page_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Page', true);
        let datatable_fields = [
            page_id,
            new ModuleTableField('html', ModuleTableField.FIELD_TYPE_html, 'Texte', false),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        let datatable = new ModuleTable(this, HtmlComponentVO.API_TYPE_ID, datatable_fields, null, "Composant template : HTML");
        page_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[PageVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private initializeHTML_HTML_ComponentVO() {
        let page_id = new ModuleTableField('page_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Page', true);
        let datatable_fields = [
            page_id,
            new ModuleTableField('left_html', ModuleTableField.FIELD_TYPE_html, 'Texte - Gauche', false),
            new ModuleTableField('right_html', ModuleTableField.FIELD_TYPE_html, 'Texte - Droite', false),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        let datatable = new ModuleTable(this, HtmlHtmlComponentVO.API_TYPE_ID, datatable_fields, null, "Composant template : HTML+HTML");
        page_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[PageVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private initializeHTML_HTML_HTML_ComponentVO() {
        let page_id = new ModuleTableField('page_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Page', true);
        let datatable_fields = [
            page_id,
            new ModuleTableField('left_html', ModuleTableField.FIELD_TYPE_html, 'Texte - Gauche', false),
            new ModuleTableField('center_html', ModuleTableField.FIELD_TYPE_html, 'Texte - Centre', false),
            new ModuleTableField('right_html', ModuleTableField.FIELD_TYPE_html, 'Texte - Droite', false),
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids', true, true, 0)
        ];

        let datatable = new ModuleTable(this, HtmlHtmlHtmlComponentVO.API_TYPE_ID, datatable_fields, null, "Composant template : HTML+HTML+HTML");
        page_id.addManyToOneRelation(VOsTypesManager.getInstance().moduleTables_by_voType[PageVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }
}