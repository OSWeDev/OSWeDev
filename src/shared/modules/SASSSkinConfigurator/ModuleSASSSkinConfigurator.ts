import { all_promises } from '../../tools/PromiseTools';
import CacheInvalidationRulesVO from '../AjaxCache/vos/CacheInvalidationRulesVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';
import ModuleParams from '../Params/ModuleParams';

export default class ModuleSASSSkinConfigurator extends Module {

    public static MODULE_NAME: string = 'sass_skin_generator';
    public static APINAME_get_sass_param_value: string = 'get_sass_param_value';

    public static PARAM_NAME_danger_color: string = 'sass_skin_generator.danger_color';
    public static PARAM_NAME_success_color: string = 'sass_skin_generator.success_color';
    public static PARAM_NAME_input_editable_bg_color_danger: string = 'sass_skin_generator.input_editable_bg_color_danger';
    public static PARAM_NAME_input_editable_bg_color: string = 'sass_skin_generator.input_editable_bg_color';
    public static PARAM_NAME_input_readonly_text_color: string = 'sass_skin_generator.input_readonly_text_color';
    public static PARAM_NAME_input_ok_bg_color: string = 'sass_skin_generator.input_ok_bg_color';
    public static PARAM_NAME_button_text_color: string = 'sass_skin_generator.button_text_color';
    public static PARAM_NAME_button_primary_bg_color: string = 'sass_skin_generator.button_primary_bg_color';
    public static PARAM_NAME_button_primary_active_bg_color: string = 'sass_skin_generator.button_primary_active_bg_color';
    public static PARAM_NAME_button_warning_color: string = 'sass_skin_generator.button_warning_color';
    public static PARAM_NAME_table_header_bg_color: string = 'sass_skin_generator.table_header_bg_color';
    public static PARAM_NAME_table_border: string = 'sass_skin_generator.table_border';
    public static PARAM_NAME_table_activeitems_bg_color: string = 'sass_skin_generator.table_activeitems_bg_color';
    public static PARAM_NAME_main_sidebar_bg_color: string = 'sass_skin_generator.main_sidebar_bg_color';
    public static PARAM_NAME_main_sidebar_bg_color_rgba: string = 'sass_skin_generator.main_sidebar_bg_color_rgba';
    public static PARAM_NAME_main_footer_bg_color: string = 'sass_skin_generator.main_footer_bg_color';
    public static PARAM_NAME_main_header_bg_color: string = 'sass_skin_generator.main_header_bg_color';
    public static PARAM_NAME_main_box_body_bg_color: string = 'sass_skin_generator.main_box_body_bg_color';
    public static PARAM_NAME_main_menu_text_color: string = 'sass_skin_generator.main_menu_text_color';
    public static PARAM_NAME_main_box_title_color: string = 'sass_skin_generator.main_box_title_color';
    public static PARAM_NAME_main_background_url: string = 'sass_skin_generator.main_background_url';
    public static PARAM_NAME_main_icons_lightbackground: string = 'sass_skin_generator.main_icons_lightbackground';
    public static PARAM_NAME_main_menu_bg_color: string = 'sass_skin_generator.main_menu_bg_color';
    public static PARAM_NAME_main_menu_active_bg_color: string = 'sass_skin_generator.main_menu_active_bg_color';
    public static PARAM_NAME_box_title_bg_url: string = 'sass_skin_generator.box_title_bg_url';
    public static PARAM_NAME_picto_store_url: string = 'sass_skin_generator.picto_store_url';
    public static PARAM_NAME_picto_store_info_url: string = 'sass_skin_generator.picto_store_info_url';
    public static PARAM_NAME_picto_orga_url: string = 'sass_skin_generator.picto_orga_url';
    public static PARAM_NAME_picto_tool_small_url: string = 'sass_skin_generator.picto_tool_small_url';
    public static PARAM_NAME_picto_fleche_verte_url: string = 'sass_skin_generator.picto_fleche_verte_url';
    public static PARAM_NAME_picto_clock_small_url: string = 'sass_skin_generator.picto_clock_small_url';
    public static PARAM_NAME_picto_objectivos_url: string = 'sass_skin_generator.picto_objectivos_url';
    public static PARAM_NAME_picto_atteindre_url: string = 'sass_skin_generator.picto_atteindre_url';
    public static PARAM_NAME_picto_equipe_url: string = 'sass_skin_generator.picto_equipe_url';
    public static PARAM_NAME_main_link_color: string = 'sass_skin_generator.main_link_color';
    public static PARAM_NAME_header_text_color: string = 'sass_skin_generator.header_text_color';
    public static PARAM_NAME_light_warning: string = 'sass_skin_generator.light_warning';
    public static PARAM_NAME_light_low: string = 'sass_skin_generator.light_low';
    public static PARAM_NAME_gris_clair: string = 'sass_skin_generator.gris_clair';
    public static PARAM_NAME_vert_clair: string = 'sass_skin_generator.vert_clair';
    public static PARAM_NAME_table_header_odd_bg: string = 'sass_skin_generator.table_header_odd_bg';
    public static PARAM_NAME_table_header_even_bg: string = 'sass_skin_generator.table_header_even_bg';
    public static PARAM_NAME_table_content_odd_bg: string = 'sass_skin_generator.table_content_odd_bg';
    public static PARAM_NAME_table_content_even_bg: string = 'sass_skin_generator.table_content_even_bg';
    public static PARAM_NAME_main_background: string = 'sass_skin_generator.main_background';
    public static PARAM_NAME_main_sidebar_background: string = 'sass_skin_generator.main_sidebar_background';
    public static PARAM_NAME_planning_realise_header_bg: string = 'sass_skin_generator.planning_realise_header_bg';
    public static PARAM_NAME_main_background_int_url: string = 'sass_skin_generator.main_background_int_url';
    public static PARAM_NAME_main_background_header_url: string = 'sass_skin_generator.main_background_header_url';
    public static PARAM_NAME_logo_url: string = 'sass_skin_generator.logo_url';
    public static PARAM_NAME_picto_product_url: string = 'sass_skin_generator.picto_product_url';
    public static PARAM_NAME_picto_saisonnalite_url: string = 'sass_skin_generator.picto_saisonnalite_url';
    public static PARAM_NAME_animation_background: string = 'sass_skin_generator.animation_background';
    public static PARAM_NAME_animation_secondary: string = 'sass_skin_generator.animation_secondary';
    public static PARAM_NAME_animation_orange: string = 'sass_skin_generator.animation_orange';
    public static PARAM_NAME_animation_rouge: string = 'sass_skin_generator.animation_rouge';
    public static PARAM_NAME_animation_vert: string = 'sass_skin_generator.animation_vert';
    public static PARAM_NAME_header_text_color_mid_opacity: string = 'sass_skin_generator.header_text_color_mid_opacity';

    public static DEFAULT_danger_color: string = '#b3003c';
    public static DEFAULT_success_color: string = '#8e961b';
    public static DEFAULT_input_editable_bg_color_danger: string = '#ebcccc';
    public static DEFAULT_input_editable_bg_color: string = 'white';
    public static DEFAULT_input_readonly_text_color: string = 'white';
    public static DEFAULT_input_ok_bg_color: string = '#8d951e';
    public static DEFAULT_button_text_color: string = 'white';
    public static DEFAULT_button_primary_bg_color: string = '#b3003c';
    public static DEFAULT_button_primary_active_bg_color: string = 'rgba(179,0,60,0.5)';
    public static DEFAULT_button_warning_color: string = '#465776';
    public static DEFAULT_table_header_bg_color: string = '#D6C8BC';
    public static DEFAULT_table_border: string = '1px solid #D2D2D2';
    public static DEFAULT_table_activeitems_bg_color: string = '#D8DFB6';
    public static DEFAULT_main_sidebar_bg_color: string = '#E2D5C5';
    public static DEFAULT_main_sidebar_bg_color_rgba: string = 'rgba(226,213,197,0.9)';
    public static DEFAULT_main_footer_bg_color: string = '#8d951e';
    public static DEFAULT_main_header_bg_color: string = '#8d951e';
    public static DEFAULT_main_box_body_bg_color: string = '#efe5d9';
    public static DEFAULT_main_menu_text_color: string = 'white';
    public static DEFAULT_main_box_title_color: string = '#b3003c';
    public static DEFAULT_main_background_url: string = '"/client/public/img/background.jpg"';
    public static DEFAULT_main_icons_lightbackground: string = 'rgba(255,255,255,0.3)';
    public static DEFAULT_main_menu_bg_color: string = '#b3003c';
    public static DEFAULT_main_menu_active_bg_color: string = 'rgba(179,0,60,0.5)';
    public static DEFAULT_box_title_bg_url: string = '"/client/public/img/field_set_header.png"';
    public static DEFAULT_picto_store_url: string = '"/client/public/img/pictos/storepicto.png"';
    public static DEFAULT_picto_store_info_url: string = '"/client/public/img/pictos/store_info_picto.png"';
    public static DEFAULT_picto_orga_url: string = '"/client/public/img/pictos/picto_orga.png"';
    public static DEFAULT_picto_tool_small_url: string = '"/client/public/img/pictos/picto_tool_small.png"';
    public static DEFAULT_picto_fleche_verte_url: string = '"/client/public/img/pictos/picto_fleche_verte.png"';
    public static DEFAULT_picto_clock_small_url: string = '"/client/public/img/pictos/clock_picto_small.png"';
    public static DEFAULT_picto_objectivos_url: string = '"/client/public/img/pictos/picto_objectivos.png"';
    public static DEFAULT_picto_atteindre_url: string = '"/client/public/img/pictos/picto_atteindre.png"';
    public static DEFAULT_picto_equipe_url: string = '"/client/public/img/picto_equipe.png"';
    public static DEFAULT_main_link_color: string = '#b3003c';
    public static DEFAULT_header_text_color: string = '#563c22';
    public static DEFAULT_light_warning: string = '#b3003c';
    public static DEFAULT_light_low: string = '#339ec1';
    public static DEFAULT_gris_clair: string = '#999';
    public static DEFAULT_vert_clair: string = '#8d951e';
    public static DEFAULT_table_header_odd_bg: string = '#E2D6C8';
    public static DEFAULT_table_header_even_bg: string = 'white';
    public static DEFAULT_table_content_odd_bg: string = '#f4f0ea';
    public static DEFAULT_table_content_even_bg: string = 'white';
    public static DEFAULT_main_background: string = '#FAF6ED';
    public static DEFAULT_main_sidebar_background: string = 'transparent';
    public static DEFAULT_planning_realise_header_bg: string = '#563C22';
    public static DEFAULT_main_background_int_url: string = '';
    public static DEFAULT_main_background_header_url: string = '';
    public static DEFAULT_logo_url: string = '';
    public static DEFAULT_picto_product_url: string = '';
    public static DEFAULT_picto_saisonnalite_url: string = '';
    public static DEFAULT_animation_background: string = '#332765';
    public static DEFAULT_animation_secondary: string = '#b8b6be';
    public static DEFAULT_animation_orange: string = '#ea911b';
    public static DEFAULT_animation_rouge: string = '#b7013d';
    public static DEFAULT_animation_vert: string = '#b6c209';
    public static DEFAULT_header_text_color_mid_opacity: string = '#563c2299';

    public static CACHE_danger_color: string = null;
    public static CACHE_success_color: string = null;
    public static CACHE_input_editable_bg_color_danger: string = null;
    public static CACHE_input_editable_bg_color: string = null;
    public static CACHE_input_readonly_text_color: string = null;
    public static CACHE_input_ok_bg_color: string = null;
    public static CACHE_button_text_color: string = null;
    public static CACHE_button_primary_bg_color: string = null;
    public static CACHE_button_primary_active_bg_color: string = null;
    public static CACHE_button_warning_color: string = null;
    public static CACHE_table_header_bg_color: string = null;
    public static CACHE_table_border: string = null;
    public static CACHE_table_activeitems_bg_color: string = null;
    public static CACHE_main_sidebar_bg_color: string = null;
    public static CACHE_main_sidebar_bg_color_rgba: string = null;
    public static CACHE_main_footer_bg_color: string = null;
    public static CACHE_main_header_bg_color: string = null;
    public static CACHE_main_box_body_bg_color: string = null;
    public static CACHE_main_menu_text_color: string = null;
    public static CACHE_main_box_title_color: string = null;
    public static CACHE_main_background_url: string = null;
    public static CACHE_main_icons_lightbackground: string = null;
    public static CACHE_main_menu_bg_color: string = null;
    public static CACHE_main_menu_active_bg_color: string = null;
    public static CACHE_box_title_bg_url: string = null;
    public static CACHE_picto_store_url: string = null;
    public static CACHE_picto_store_info_url: string = null;
    public static CACHE_picto_orga_url: string = null;
    public static CACHE_picto_tool_small_url: string = null;
    public static CACHE_picto_fleche_verte_url: string = null;
    public static CACHE_picto_clock_small_url: string = null;
    public static CACHE_picto_objectivos_url: string = null;
    public static CACHE_picto_atteindre_url: string = null;
    public static CACHE_picto_equipe_url: string = null;
    public static CACHE_main_link_color: string = null;
    public static CACHE_header_text_color: string = null;
    public static CACHE_light_warning: string = null;
    public static CACHE_light_low: string = null;
    public static CACHE_gris_clair: string = null;
    public static CACHE_vert_clair: string = null;
    public static CACHE_table_header_odd_bg: string = null;
    public static CACHE_table_header_even_bg: string = null;
    public static CACHE_table_content_odd_bg: string = null;
    public static CACHE_table_content_even_bg: string = null;
    public static CACHE_main_background: string = null;
    public static CACHE_main_sidebar_background: string = null;
    public static CACHE_planning_realise_header_bg: string = null;
    public static CACHE_main_background_int_url: string = null;
    public static CACHE_main_background_header_url: string = null;
    public static CACHE_logo_url: string = null;
    public static CACHE_picto_product_url: string = null;
    public static CACHE_picto_saisonnalite_url: string = null;
    public static CACHE_animation_background: string = null;
    public static CACHE_animation_secondary: string = null;
    public static CACHE_animation_orange: string = null;
    public static CACHE_animation_rouge: string = null;
    public static CACHE_animation_vert: string = null;
    public static CACHE_header_text_color_mid_opacity: string = null;

    public static SASS_PARAMS_NAMES: string[] = [
        'danger_color',
        'success_color',
        'input_editable_bg_color_danger',
        'input_editable_bg_color',
        'input_readonly_text_color',
        'input_ok_bg_color',
        'button_text_color',
        'button_primary_bg_color',
        'button_primary_active_bg_color',
        'button_warning_color',
        'table_header_bg_color',
        'table_border',
        'table_activeitems_bg_color',
        'main_sidebar_bg_color',
        'main_sidebar_bg_color_rgba',
        'main_footer_bg_color',
        'main_header_bg_color',
        'main_box_body_bg_color',
        'main_menu_text_color',
        'main_box_title_color',
        'main_background_url',
        'main_icons_lightbackground',
        'main_menu_bg_color',
        'main_menu_active_bg_color',
        'box_title_bg_url',
        'picto_store_url',
        'picto_store_info_url',
        'picto_orga_url',
        'picto_tool_small_url',
        'picto_fleche_verte_url',
        'picto_clock_small_url',
        'picto_objectivos_url',
        'picto_atteindre_url',
        'picto_equipe_url',
        'main_link_color',
        'header_text_color',
        'light_warning',
        'light_low',
        'gris_clair',
        'vert_clair',
        'table_header_odd_bg',
        'table_header_even_bg',
        'table_content_odd_bg',
        'table_content_even_bg',
        'main_background',
        'main_sidebar_background',
        'planning_realise_header_bg',
        'main_background_int_url',
        'main_background_header_url',
        'logo_url',
        'picto_product_url',
        'picto_saisonnalite_url',
        'animation_background',
        'animation_secondary',
        'animation_orange',
        'animation_rouge',
        'animation_vert',
        'header_text_color_mid_opacity',
    ];

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleSASSSkinConfigurator {
        if (!ModuleSASSSkinConfigurator.instance) {
            ModuleSASSSkinConfigurator.instance = new ModuleSASSSkinConfigurator();
        }
        return ModuleSASSSkinConfigurator.instance;
    }

    private static instance: ModuleSASSSkinConfigurator = null;

    public get_sass_param_value: (param_name: string) => Promise<any> = APIControllerWrapper.sah(ModuleSASSSkinConfigurator.APINAME_get_sass_param_value);

    private constructor() {

        super(ModuleSASSSkinConfigurator.MODULE_NAME, "SASSSkinConfigurator");
        this.forceActivationOnInstallation();
    }

    public registerApis() {

        APIControllerWrapper.registerApi(new PostAPIDefinition<StringParamVO, any>(
            null,
            ModuleSASSSkinConfigurator.APINAME_get_sass_param_value,
            CacheInvalidationRulesVO.ALWAYS_FORCE_INVALIDATION_API_TYPES_INVOLVED,
            StringParamVOStatic
        ).disable_csrf_protection());
    }

    /* istanbul ignore next: nothing to test here */
    public async initializeasync() {
        await all_promises([
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_danger_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_danger_color, ModuleSASSSkinConfigurator.DEFAULT_danger_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_success_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_success_color, ModuleSASSSkinConfigurator.DEFAULT_success_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_input_editable_bg_color_danger = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_input_editable_bg_color_danger, ModuleSASSSkinConfigurator.DEFAULT_input_editable_bg_color_danger, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_input_editable_bg_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_input_editable_bg_color, ModuleSASSSkinConfigurator.DEFAULT_input_editable_bg_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_input_readonly_text_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_input_readonly_text_color, ModuleSASSSkinConfigurator.DEFAULT_input_readonly_text_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_input_ok_bg_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_input_ok_bg_color, ModuleSASSSkinConfigurator.DEFAULT_input_ok_bg_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_button_text_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_button_text_color, ModuleSASSSkinConfigurator.DEFAULT_button_text_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_button_primary_bg_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_button_primary_bg_color, ModuleSASSSkinConfigurator.DEFAULT_button_primary_bg_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_button_primary_active_bg_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_button_primary_active_bg_color, ModuleSASSSkinConfigurator.DEFAULT_button_primary_active_bg_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_button_warning_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_button_warning_color, ModuleSASSSkinConfigurator.DEFAULT_button_warning_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_table_header_bg_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_table_header_bg_color, ModuleSASSSkinConfigurator.DEFAULT_table_header_bg_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_table_border = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_table_border, ModuleSASSSkinConfigurator.DEFAULT_table_border, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_table_activeitems_bg_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_table_activeitems_bg_color, ModuleSASSSkinConfigurator.DEFAULT_table_activeitems_bg_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_sidebar_bg_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_sidebar_bg_color, ModuleSASSSkinConfigurator.DEFAULT_main_sidebar_bg_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_sidebar_bg_color_rgba = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_sidebar_bg_color_rgba, ModuleSASSSkinConfigurator.DEFAULT_main_sidebar_bg_color_rgba, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_footer_bg_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_footer_bg_color, ModuleSASSSkinConfigurator.DEFAULT_main_footer_bg_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_header_bg_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_header_bg_color, ModuleSASSSkinConfigurator.DEFAULT_main_header_bg_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_box_body_bg_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_box_body_bg_color, ModuleSASSSkinConfigurator.DEFAULT_main_box_body_bg_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_menu_text_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_menu_text_color, ModuleSASSSkinConfigurator.DEFAULT_main_menu_text_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_box_title_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_box_title_color, ModuleSASSSkinConfigurator.DEFAULT_main_box_title_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_background_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_background_url, ModuleSASSSkinConfigurator.DEFAULT_main_background_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_icons_lightbackground = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_icons_lightbackground, ModuleSASSSkinConfigurator.DEFAULT_main_icons_lightbackground, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_menu_bg_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_menu_bg_color, ModuleSASSSkinConfigurator.DEFAULT_main_menu_bg_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_menu_active_bg_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_menu_active_bg_color, ModuleSASSSkinConfigurator.DEFAULT_main_menu_active_bg_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_box_title_bg_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_box_title_bg_url, ModuleSASSSkinConfigurator.DEFAULT_box_title_bg_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_picto_store_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_picto_store_url, ModuleSASSSkinConfigurator.DEFAULT_picto_store_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_picto_store_info_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_picto_store_info_url, ModuleSASSSkinConfigurator.DEFAULT_picto_store_info_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_picto_orga_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_picto_orga_url, ModuleSASSSkinConfigurator.DEFAULT_picto_orga_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_picto_tool_small_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_picto_tool_small_url, ModuleSASSSkinConfigurator.DEFAULT_picto_tool_small_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_picto_fleche_verte_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_picto_fleche_verte_url, ModuleSASSSkinConfigurator.DEFAULT_picto_fleche_verte_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_picto_clock_small_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_picto_clock_small_url, ModuleSASSSkinConfigurator.DEFAULT_picto_clock_small_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_picto_objectivos_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_picto_objectivos_url, ModuleSASSSkinConfigurator.DEFAULT_picto_objectivos_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_picto_atteindre_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_picto_atteindre_url, ModuleSASSSkinConfigurator.DEFAULT_picto_atteindre_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_picto_equipe_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_picto_equipe_url, ModuleSASSSkinConfigurator.DEFAULT_picto_equipe_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_link_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_link_color, ModuleSASSSkinConfigurator.DEFAULT_main_link_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_header_text_color = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_header_text_color, ModuleSASSSkinConfigurator.DEFAULT_header_text_color, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_light_warning = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_light_warning, ModuleSASSSkinConfigurator.DEFAULT_light_warning, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_light_low = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_light_low, ModuleSASSSkinConfigurator.DEFAULT_light_low, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_gris_clair = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_gris_clair, ModuleSASSSkinConfigurator.DEFAULT_gris_clair, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_vert_clair = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_vert_clair, ModuleSASSSkinConfigurator.DEFAULT_vert_clair, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_table_header_odd_bg = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_table_header_odd_bg, ModuleSASSSkinConfigurator.DEFAULT_table_header_odd_bg, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_table_header_even_bg = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_table_header_even_bg, ModuleSASSSkinConfigurator.DEFAULT_table_header_even_bg, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_table_content_odd_bg = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_table_content_odd_bg, ModuleSASSSkinConfigurator.DEFAULT_table_content_odd_bg, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_table_content_even_bg = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_table_content_even_bg, ModuleSASSSkinConfigurator.DEFAULT_table_content_even_bg, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_background = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_background, ModuleSASSSkinConfigurator.DEFAULT_main_background, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_sidebar_background = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_sidebar_background, ModuleSASSSkinConfigurator.DEFAULT_main_sidebar_background, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_planning_realise_header_bg = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_planning_realise_header_bg, ModuleSASSSkinConfigurator.DEFAULT_planning_realise_header_bg, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_background_int_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_background_int_url, ModuleSASSSkinConfigurator.DEFAULT_main_background_int_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_main_background_header_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_main_background_header_url, ModuleSASSSkinConfigurator.DEFAULT_main_background_header_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_logo_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_logo_url, ModuleSASSSkinConfigurator.DEFAULT_logo_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_picto_product_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_picto_product_url, ModuleSASSSkinConfigurator.DEFAULT_picto_product_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_picto_saisonnalite_url = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_picto_saisonnalite_url, ModuleSASSSkinConfigurator.DEFAULT_picto_saisonnalite_url, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_animation_background = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_animation_background, ModuleSASSSkinConfigurator.DEFAULT_animation_background, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_animation_secondary = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_animation_secondary, ModuleSASSSkinConfigurator.DEFAULT_animation_secondary, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_animation_orange = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_animation_orange, ModuleSASSSkinConfigurator.DEFAULT_animation_orange, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_animation_rouge = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_animation_rouge, ModuleSASSSkinConfigurator.DEFAULT_animation_rouge, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_animation_vert = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_animation_vert, ModuleSASSSkinConfigurator.DEFAULT_animation_vert, 1000 * 60 * 60);
            })(),
            (async () => {
                ModuleSASSSkinConfigurator.CACHE_header_text_color_mid_opacity = await ModuleParams.getInstance().getParamValueAsString(ModuleSASSSkinConfigurator.PARAM_NAME_header_text_color_mid_opacity, ModuleSASSSkinConfigurator.DEFAULT_header_text_color_mid_opacity, 1000 * 60 * 60);
            })()
        ]);
    }


    /* istanbul ignore next: nothing to test here */
    public async hook_module_async_client_admin_initialization(): Promise<any> {
        await this.initializeasync();
        return true;
    }

    /* istanbul ignore next: nothing to test here */
    public async hook_module_configure(): Promise<boolean> {
        await this.initializeasync();
        return true;
    }
}