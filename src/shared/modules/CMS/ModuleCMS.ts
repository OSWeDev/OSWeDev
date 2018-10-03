import Module from '../Module';
import ModuleTable from '../ModuleTable';
import ModuleTableField from '../ModuleTableField';
import TranslatableTextVO from '../Translation/vos/TranslatableTextVO';
import VOsTypesManager from '../VOsTypesManager';
import HTML_ComponentVO from './template_components_vo/HTML_ComponentVO';
import HTML_HTML_ComponentVO from './template_components_vo/HTML_HTML_ComponentVO';
import HTML_HTML_HTML_ComponentVO from './template_components_vo/HTML_HTML_HTML_ComponentVO';
import Img_HTML_ComponentVO from './template_components_vo/Img_HTML_ComponentVO';
import ContentTypeVO from './vos/ContentTypeVO';
import PageAliasVO from './vos/PageAliasVO';
import PageComponentVO from './vos/PageComponentVO';
import PageVO from './vos/PageVO';
import TemplateComponentVO from './vos/TemplateComponentVO';
import ImageVO from '../Image/vos/ImageVO';

export default class ModuleCMS extends Module {

    public static ACCESS_GROUP_NAME = "CMS_ACCESS";
    public static ACCESS_RULE_NAME = "ADMIN_CONF";

    public static getInstance(): ModuleCMS {
        if (!ModuleCMS.instance) {
            ModuleCMS.instance = new ModuleCMS();
        }
        return ModuleCMS.instance;
    }

    private static instance: ModuleCMS = null;

    private constructor() {

        super("cms", "CMS");
    }

    public initialize() {
        this.fields = [];
        this.datatables = [];

        this.initializeContentTypeVO();
        this.initializePageVO();
        this.initializePageComponentVO();
        this.initializePageAliasVO();
        this.initializeTemplateComponentVO();

        this.initializeHTML_ComponentVO();
        this.initializeHTML_HTML_ComponentVO();
        this.initializeHTML_HTML_HTML_ComponentVO();
        this.initializeImg_HTML_ComponentVO();
    }

    private initializePageComponentVO() {
        let label_field = new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'Type de composant', true);
        let page_id = new ModuleTableField('page_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Page', true);
        let datatable_fields = [
            label_field,
            page_id,
            new ModuleTableField('weight', ModuleTableField.FIELD_TYPE_int, 'Poids dans la page', true, true, 0)
        ];

        let datatable = new ModuleTable(this, PageComponentVO.API_TYPE_ID, datatable_fields, label_field, "Composants des pages");
        page_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[PageVO.API_TYPE_ID]);
        this.datatables.push(datatable);
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
        translatable_title_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[TranslatableTextVO.API_TYPE_ID]);
        content_type_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[ContentTypeVO.API_TYPE_ID]);
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
        translatable_desc_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[TranslatableTextVO.API_TYPE_ID]);
        translatable_name_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[TranslatableTextVO.API_TYPE_ID]);
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
        page_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[PageVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private initializeTemplateComponentVO() {
        let label_field = new ModuleTableField('type', ModuleTableField.FIELD_TYPE_string, 'UID du composant', true);
        let translatable_name_id = new ModuleTableField('translatable_title_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Nom', true);
        let translatable_desc_id = new ModuleTableField('translatable_desc_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Description', true);
        let thumbnail_id = new ModuleTableField('thumbnail_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Miniature', true);
        let datatable_fields = [
            label_field,
            translatable_name_id,
            translatable_desc_id,
            thumbnail_id
        ];

        let datatable = new ModuleTable(this, TemplateComponentVO.API_TYPE_ID, datatable_fields, label_field, "Alias des pages");
        translatable_name_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[TranslatableTextVO.API_TYPE_ID]);
        translatable_desc_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[TranslatableTextVO.API_TYPE_ID]);
        thumbnail_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[ImageVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }


    private initializeImg_HTML_ComponentVO() {
        let page_component_id = new ModuleTableField('page_component_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Composant', true);
        let image_vo_id = new ModuleTableField('image_vo_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Image', false);
        let label_field = page_component_id;
        let datatable_fields = [
            page_component_id,
            image_vo_id,
            new ModuleTableField('image_position', ModuleTableField.FIELD_TYPE_enum, 'Position de l\'image', true, true, Img_HTML_ComponentVO.IMAGE_POSITION_LEFT).setEnumValues({
                [Img_HTML_ComponentVO.IMAGE_POSITION_LEFT]: Img_HTML_ComponentVO.IMAGE_POSITION_NAMES[Img_HTML_ComponentVO.IMAGE_POSITION_LEFT],
                [Img_HTML_ComponentVO.IMAGE_POSITION_RIGHT]: Img_HTML_ComponentVO.IMAGE_POSITION_NAMES[Img_HTML_ComponentVO.IMAGE_POSITION_RIGHT],
            }),
            new ModuleTableField('html', ModuleTableField.FIELD_TYPE_string, 'HTML', false)
        ];

        let datatable = new ModuleTable(this, Img_HTML_ComponentVO.API_TYPE_ID, datatable_fields, label_field, "Composant template : HTML");
        page_component_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[PageComponentVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private initializeHTML_ComponentVO() {
        let page_component_id = new ModuleTableField('page_component_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Composant', true);
        let label_field = page_component_id;
        let datatable_fields = [
            page_component_id,
            new ModuleTableField('html', ModuleTableField.FIELD_TYPE_string, 'Texte', false)
        ];

        let datatable = new ModuleTable(this, HTML_ComponentVO.API_TYPE_ID, datatable_fields, label_field, "Composant template : HTML");
        page_component_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[PageComponentVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private initializeHTML_HTML_ComponentVO() {
        let page_component_id = new ModuleTableField('page_component_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Composant', true);
        let label_field = page_component_id;
        let datatable_fields = [
            page_component_id,
            new ModuleTableField('left_html', ModuleTableField.FIELD_TYPE_string, 'Texte - Gauche', false),
            new ModuleTableField('right_html', ModuleTableField.FIELD_TYPE_string, 'Texte - Droite', false)
        ];

        let datatable = new ModuleTable(this, HTML_HTML_ComponentVO.API_TYPE_ID, datatable_fields, label_field, "Composant template : HTML");
        page_component_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[PageComponentVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }

    private initializeHTML_HTML_HTML_ComponentVO() {
        let page_component_id = new ModuleTableField('page_component_id', ModuleTableField.FIELD_TYPE_foreign_key, 'Composant', true);
        let label_field = page_component_id;
        let datatable_fields = [
            page_component_id,
            new ModuleTableField('html', ModuleTableField.FIELD_TYPE_string, 'Texte - Gauche', false),
            new ModuleTableField('html', ModuleTableField.FIELD_TYPE_string, 'Texte - Centre', false),
            new ModuleTableField('html', ModuleTableField.FIELD_TYPE_string, 'Texte - Droite', false)
        ];

        let datatable = new ModuleTable(this, HTML_HTML_HTML_ComponentVO.API_TYPE_ID, datatable_fields, label_field, "Composant template : HTML");
        page_component_id.addManyToOneRelation(datatable, VOsTypesManager.getInstance().moduleTables_by_voType[PageComponentVO.API_TYPE_ID]);
        this.datatables.push(datatable);
    }
}