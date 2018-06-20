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

        this.initialize();
    }

    protected initialize() {
        this.fields = [
            new ModuleTableField('danger_color', 'text', 'danger_color', true, true, '#b3003c'),
            new ModuleTableField('success_color', 'text', 'success_color', true, true, '#8e961b'),

            new ModuleTableField('input_editable_bg_color_danger', 'text', 'input_editable_bg_color_danger', true, true, '#ebcccc'),
            new ModuleTableField('input_editable_bg_color', 'text', 'input_editable_bg_color', true, true, 'white'),

            new ModuleTableField('input_readonly_text_color', 'text', 'input_readonly_text_color', true, true, 'white'),
            new ModuleTableField('input_ok_bg_color', 'text', 'input_ok_bg_color', true, true, '#8d951e'),

            new ModuleTableField('button_text_color', 'text', 'button_text_color', true, true, 'white'),
            new ModuleTableField('button_primary_bg_color', 'text', 'button_primary_bg_color', true, true, '#b3003c'),
            new ModuleTableField('button_primary_active_bg_color', 'text', 'button_primary_active_bg_color', true, true, 'rgba(179,0,60,0.5)'),
            new ModuleTableField('button_warning_color', 'text', 'button_warning_color', true, true, '#465776'),

            new ModuleTableField('table_header_bg_color', 'text', 'table_header_bg_color', true, true, '#D6C8BC'),
            new ModuleTableField('table_border', 'text', 'table_border', true, true, '1px solid #D2D2D2'),
            new ModuleTableField('table_activeitems_bg_color', 'text', 'table_activeitems_bg_color', true, true, '#D8DFB6'),

            new ModuleTableField('main_sidebar_bg_color', 'text', 'main_sidebar_bg_color', true, true, '#E2D5C5'),
            new ModuleTableField('main_sidebar_bg_color_rgba', 'text', 'main_sidebar_bg_color_rgba', true, true, 'rgba(226,213,197,0.9)'),
            new ModuleTableField('main_footer_bg_color', 'text', 'main_footer_bg_color', true, true, '#8d951e'),
            new ModuleTableField('main_header_bg_color', 'text', 'main_header_bg_color', true, true, '#8d951e'),
            new ModuleTableField('main_box_body_bg_color', 'text', 'main_box_body_bg_color', true, true, '#efe5d9'),

            new ModuleTableField('main_menu_text_color', 'text', 'main_menu_text_color', true, true, 'white'),

            new ModuleTableField('main_box_title_color', 'text', 'main_box_title_color', true, true, '#b3003c'),

            new ModuleTableField('main_background_int_url', 'text', 'main_background_int_url', true, true, '"/public/img/background_int.jpg"'),
            new ModuleTableField('main_background_url', 'text', 'main_background_url', true, true, '"/public/img/background.jpg"'),

            new ModuleTableField('main_icons_lightbackground', 'text', 'main_icons_lightbackground', true, true, 'rgba(255,255,255,0.3)'),

            new ModuleTableField('main_menu_bg_color', 'text', 'main_menu_bg_color', true, true, '#b3003c'),
            new ModuleTableField('main_menu_active_bg_color', 'text', 'main_menu_active_bg_color', true, true, 'rgba(179,0,60,0.5)'),

            new ModuleTableField('box_title_bg_url', 'text', 'box_title_bg_url', true, true, '"/public/img/field_set_header.png"'),
            new ModuleTableField('picto_store_url', 'text', 'picto_store_url', true, true, '"/public/img/pictos/storepicto.png"'),
            new ModuleTableField('picto_store_info_url', 'text', 'picto_store_info_url', true, true, '"/public/img/pictos/store_info_picto.png"'),
            new ModuleTableField('picto_orga_url', 'text', 'picto_orga_url', true, true, '"/public/img/pictos/picto_orga.png"'),
            new ModuleTableField('picto_tool_small_url', 'text', 'picto_tool_small_url', true, true, '"/public/img/pictos/picto_tool_small.png"'),
            new ModuleTableField('picto_fleche_verte_url', 'text', 'picto_fleche_verte_url', true, true, '"/public/img/pictos/picto_fleche_verte.png"'),
            new ModuleTableField('picto_clock_small_url', 'text', 'picto_clock_small_url', true, true, '"/public/img/pictos/clock_picto_small.png"'),
            new ModuleTableField('picto_objectivos_url', 'text', 'picto_objectivos_url', true, true, '"/public/img/pictos/picto_objectivos.png"'),
            new ModuleTableField('picto_atteindre_url', 'text', 'picto_atteindre_url', true, true, '"/public/img/pictos/picto_atteindre.png"'),
            new ModuleTableField('picto_equipe_url', 'text', 'picto_equipe_url', true, true, '"/public/img/picto_equipe.png"'),
            new ModuleTableField('main_link_color', 'text', 'main_link_color', true, true, '#b3003c'),
            new ModuleTableField('header_text_color', 'text', 'header_text_color', true, true, '#563c22'),
        ];
        this.datatables = [];
    }
}