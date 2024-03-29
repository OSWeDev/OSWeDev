import CacheInvalidationRulesVO from '../AjaxCache/vos/CacheInvalidationRulesVO';
import APIControllerWrapper from '../API/APIControllerWrapper';
import StringParamVO, { StringParamVOStatic } from '../API/vos/apis/StringParamVO';
import PostAPIDefinition from '../API/vos/PostAPIDefinition';
import Module from '../Module';

export default class ModuleSASSSkinConfigurator extends Module {

    public static MODULE_NAME: string = 'sass_skin_generator';
    public static APINAME_get_sass_param_value: string = 'get_sass_param_value';

    /**
     * Sert de définition de la liste des params à placer dans le scss généré, et à définir les valeurs par défaut, qui sont remplacées au démarrage par les datas en base (ou init la bdd avec ces infos)
     */
    public static SASS_PARAMS_VALUES: { [param_name: string]: string } = {
        danger_color: '#b3003c',
        success_color: '#8e961b',
        input_editable_bg_color_danger: '#ebcccc',
        input_editable_bg_color: 'white',
        input_readonly_text_color: 'white',
        input_ok_bg_color: '#8d951e',
        button_text_color: 'white',
        button_primary_bg_color: '#b3003c',
        button_primary_active_bg_color: 'rgba(179,0,60,0.5)',
        button_warning_color: '#465776',
        table_header_bg_color: '#D6C8BC',
        table_border: '1px solid #D2D2D2',
        table_activeitems_bg_color: '#D8DFB6',
        main_sidebar_bg_color: '#E2D5C5',
        main_sidebar_bg_color_rgba: 'rgba(226,213,197,0.9)',
        main_footer_bg_color: '#8d951e',
        main_header_bg_color: '#8d951e',
        main_box_body_bg_color: '#efe5d9',
        main_menu_text_color: 'white',
        main_box_title_color: '#b3003c',
        main_background_url: '"/client/public/img/background.jpg"',
        main_icons_lightbackground: 'rgba(255,255,255,0.3)',
        main_menu_bg_color: '#b3003c',
        main_menu_active_bg_color: 'rgba(179,0,60,0.5)',
        box_title_bg_url: '"/client/public/img/field_set_header.png"',
        picto_store_url: '"/client/public/img/pictos/storepicto.png"',
        picto_store_info_url: '"/client/public/img/pictos/store_info_picto.png"',
        picto_orga_url: '"/client/public/img/pictos/picto_orga.png"',
        picto_tool_small_url: '"/client/public/img/pictos/picto_tool_small.png"',
        picto_fleche_verte_url: '"/client/public/img/pictos/picto_fleche_verte.png"',
        picto_clock_small_url: '"/client/public/img/pictos/clock_picto_small.png"',
        picto_objectivos_url: '"/client/public/img/pictos/picto_objectivos.png"',
        picto_atteindre_url: '"/client/public/img/pictos/picto_atteindre.png"',
        picto_equipe_url: '"/client/public/img/picto_equipe.png"',
        main_link_color: '#b3003c',
        header_text_color: '#563c22',
        light_warning: '#b3003c',
        light_low: '#339ec1',
        gris_clair: '#999',
        vert_clair: '#8d951e',
        table_header_odd_bg: '#E2D6C8',
        table_header_even_bg: 'white',
        table_content_odd_bg: '#f4f0ea',
        table_content_even_bg: 'white',
        main_background: '#FAF6ED',
        main_sidebar_background: 'transparent',
        planning_realise_header_bg: '#563C22',
        main_background_int_url: '',
        main_background_header_url: '',
        logo_url: '',
        picto_product_url: '',
        picto_saisonnalite_url: '',
        animation_background: '#332765',
        animation_secondary: '#b8b6be',
        animation_orange: '#ea911b',
        animation_rouge: '#b7013d',
        animation_vert: '#b6c209',
        header_text_color_mid_opacity: '#563c2299',
    };

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
}