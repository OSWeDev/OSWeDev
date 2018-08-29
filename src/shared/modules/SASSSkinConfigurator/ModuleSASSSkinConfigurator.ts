import Module from '../Module';
import ModuleTableField from '../ModuleTableField';

export default class ModuleSASSSkinConfigurator extends Module {

    public static getInstance(): ModuleSASSSkinConfigurator {
        if (!ModuleSASSSkinConfigurator.instance) {
            ModuleSASSSkinConfigurator.instance = new ModuleSASSSkinConfigurator();
        }
        return ModuleSASSSkinConfigurator.instance;
    }

    private static instance: ModuleSASSSkinConfigurator = null;

    private constructor() {

        super("sass_resource_planning_skin_configurator", "SASSSkinConfigurator");
    }

    public initialize() {
        this.fields = [
            new ModuleTableField('danger_color', ModuleTableField.FIELD_TYPE_string, 'danger_color', true, true, '#b3003c'),
            new ModuleTableField('success_color', ModuleTableField.FIELD_TYPE_string, 'success_color', true, true, '#8e961b'),

            new ModuleTableField('input_editable_bg_color_danger', ModuleTableField.FIELD_TYPE_string, 'input_editable_bg_color_danger', true, true, '#ebcccc'),
            new ModuleTableField('input_editable_bg_color', ModuleTableField.FIELD_TYPE_string, 'input_editable_bg_color', true, true, 'white'),

            new ModuleTableField('input_readonly_text_color', ModuleTableField.FIELD_TYPE_string, 'input_readonly_text_color', true, true, 'white'),
            new ModuleTableField('input_ok_bg_color', ModuleTableField.FIELD_TYPE_string, 'input_ok_bg_color', true, true, '#8d951e'),

            new ModuleTableField('button_text_color', ModuleTableField.FIELD_TYPE_string, 'button_text_color', true, true, 'white'),
            new ModuleTableField('button_primary_bg_color', ModuleTableField.FIELD_TYPE_string, 'button_primary_bg_color', true, true, '#b3003c'),
            new ModuleTableField('button_primary_active_bg_color', ModuleTableField.FIELD_TYPE_string, 'button_primary_active_bg_color', true, true, 'rgba(179,0,60,0.5)'),
            new ModuleTableField('button_warning_color', ModuleTableField.FIELD_TYPE_string, 'button_warning_color', true, true, '#465776'),

            new ModuleTableField('table_header_bg_color', ModuleTableField.FIELD_TYPE_string, 'table_header_bg_color', true, true, '#D6C8BC'),
            new ModuleTableField('table_border', ModuleTableField.FIELD_TYPE_string, 'table_border', true, true, '1px solid #D2D2D2'),
            new ModuleTableField('table_activeitems_bg_color', ModuleTableField.FIELD_TYPE_string, 'table_activeitems_bg_color', true, true, '#D8DFB6'),

            new ModuleTableField('main_sidebar_bg_color', ModuleTableField.FIELD_TYPE_string, 'main_sidebar_bg_color', true, true, '#E2D5C5'),
            new ModuleTableField('main_sidebar_bg_color_rgba', ModuleTableField.FIELD_TYPE_string, 'main_sidebar_bg_color_rgba', true, true, 'rgba(226,213,197,0.9)'),
            new ModuleTableField('main_footer_bg_color', ModuleTableField.FIELD_TYPE_string, 'main_footer_bg_color', true, true, '#8d951e'),
            new ModuleTableField('main_header_bg_color', ModuleTableField.FIELD_TYPE_string, 'main_header_bg_color', true, true, '#8d951e'),
            new ModuleTableField('main_box_body_bg_color', ModuleTableField.FIELD_TYPE_string, 'main_box_body_bg_color', true, true, '#efe5d9'),

            new ModuleTableField('main_menu_text_color', ModuleTableField.FIELD_TYPE_string, 'main_menu_text_color', true, true, 'white'),

            new ModuleTableField('main_box_title_color', ModuleTableField.FIELD_TYPE_string, 'main_box_title_color', true, true, '#b3003c'),

            new ModuleTableField('main_background_int_url', ModuleTableField.FIELD_TYPE_string, 'main_background_int_url', true, true, '"/public/img/background_int.jpg"'),
            new ModuleTableField('main_background_url', ModuleTableField.FIELD_TYPE_string, 'main_background_url', true, true, '"/public/img/background.jpg"'),

            new ModuleTableField('main_icons_lightbackground', ModuleTableField.FIELD_TYPE_string, 'main_icons_lightbackground', true, true, 'rgba(255,255,255,0.3)'),

            new ModuleTableField('main_menu_bg_color', ModuleTableField.FIELD_TYPE_string, 'main_menu_bg_color', true, true, '#b3003c'),
            new ModuleTableField('main_menu_active_bg_color', ModuleTableField.FIELD_TYPE_string, 'main_menu_active_bg_color', true, true, 'rgba(179,0,60,0.5)'),

            new ModuleTableField('box_title_bg_url', ModuleTableField.FIELD_TYPE_string, 'box_title_bg_url', true, true, '"/public/img/field_set_header.png"'),
            new ModuleTableField('picto_store_url', ModuleTableField.FIELD_TYPE_string, 'picto_store_url', true, true, '"/public/img/pictos/storepicto.png"'),
            new ModuleTableField('picto_store_info_url', ModuleTableField.FIELD_TYPE_string, 'picto_store_info_url', true, true, '"/public/img/pictos/store_info_picto.png"'),
            new ModuleTableField('picto_orga_url', ModuleTableField.FIELD_TYPE_string, 'picto_orga_url', true, true, '"/public/img/pictos/picto_orga.png"'),
            new ModuleTableField('picto_tool_small_url', ModuleTableField.FIELD_TYPE_string, 'picto_tool_small_url', true, true, '"/public/img/pictos/picto_tool_small.png"'),
            new ModuleTableField('picto_fleche_verte_url', ModuleTableField.FIELD_TYPE_string, 'picto_fleche_verte_url', true, true, '"/public/img/pictos/picto_fleche_verte.png"'),
            new ModuleTableField('picto_clock_small_url', ModuleTableField.FIELD_TYPE_string, 'picto_clock_small_url', true, true, '"/public/img/pictos/clock_picto_small.png"'),
            new ModuleTableField('picto_objectivos_url', ModuleTableField.FIELD_TYPE_string, 'picto_objectivos_url', true, true, '"/public/img/pictos/picto_objectivos.png"'),
            new ModuleTableField('picto_atteindre_url', ModuleTableField.FIELD_TYPE_string, 'picto_atteindre_url', true, true, '"/public/img/pictos/picto_atteindre.png"'),
            new ModuleTableField('picto_equipe_url', ModuleTableField.FIELD_TYPE_string, 'picto_equipe_url', true, true, '"/public/img/picto_equipe.png"'),
            new ModuleTableField('main_link_color', ModuleTableField.FIELD_TYPE_string, 'main_link_color', true, true, '#b3003c'),
            new ModuleTableField('header_text_color', ModuleTableField.FIELD_TYPE_string, 'header_text_color', true, true, '#563c22'),

            new ModuleTableField('light_warning', ModuleTableField.FIELD_TYPE_string, 'light_warning', true, true, '#b3003c'),
            new ModuleTableField('light_low', ModuleTableField.FIELD_TYPE_string, 'light_low', true, true, '#339ec1'),
            new ModuleTableField('gris_clair', ModuleTableField.FIELD_TYPE_string, 'gris_clair', true, true, '#999'),
            new ModuleTableField('vert_clair', ModuleTableField.FIELD_TYPE_string, 'vert_clair', true, true, '#8d951e'),
        ];
        this.datatables = [];
    }
}