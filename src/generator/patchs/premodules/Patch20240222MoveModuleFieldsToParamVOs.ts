/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import Dates from '../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20240222MoveModuleFieldsToParamVOs implements IGeneratorWorker {

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20240222MoveModuleFieldsToParamVOs {
        if (!Patch20240222MoveModuleFieldsToParamVOs.instance) {
            Patch20240222MoveModuleFieldsToParamVOs.instance = new Patch20240222MoveModuleFieldsToParamVOs();
        }
        return Patch20240222MoveModuleFieldsToParamVOs.instance;
    }

    private static instance: Patch20240222MoveModuleFieldsToParamVOs = null;

    get uid(): string {
        return 'Patch20240222MoveModuleFieldsToParamVOs';
    }

    private constructor() { }

    public async work(db: IDatabase<any>) {
        try {
            /**
             * On commence par bouger tout ce qui concerne OSWEDV si c'est pas encore fait
             */

            /**
             * ModuleMailer
             * Ancienne conf des param_name :
             *     public static PARAM_NAME_HOST = 'host';
             *     public static PARAM_NAME_PORT = 'port';
             *     public static PARAM_NAME_SECURE = 'secure';
             *     public static PARAM_NAME_AUTH_USER = 'auth_user';
             *     public static PARAM_NAME_AUTH_PASS = 'auth_pass';
             *     public static PARAM_NAME_FROM = 'from_address';
             *     public static PARAM_NAME_SUBJECT_PREFIX = 'subject_prefix';
             *     public static PARAM_NAME_SUBJECT_SUFFIX = 'subject_suffix';
             * Nouvelle conf des param_name :
             *     public static PARAM_NAME_HOST = 'ModuleMailer.host';
             *     public static PARAM_NAME_PORT = 'ModuleMailer.port';
             *     public static PARAM_NAME_SECURE = 'ModuleMailer.secure';
             *     public static PARAM_NAME_AUTH_USER = 'ModuleMailer.auth_user';
             *     public static PARAM_NAME_AUTH_PASS = 'ModuleMailer.auth_pass';
             *     public static PARAM_NAME_FROM = 'ModuleMailer.from_address';
             *     public static PARAM_NAME_SUBJECT_PREFIX = 'ModuleMailer.subject_prefix';
             *     public static PARAM_NAME_SUBJECT_SUFFIX = 'ModuleMailer.subject_suffix';
             */
            let conf_module_mailer_lines = await db.oneOrNone("SELECT * FROM admin.module_mailer;");
            let conf_module_mailer_line = conf_module_mailer_lines ? conf_module_mailer_lines[0] : null;
            if (!!conf_module_mailer_line) {
                ConsoleHandler.log('Migration des champs de ModuleMailer vers ParamVOs');
                await this.add_param_if_not_exists(db, 'ModuleMailer.host', conf_module_mailer_line.host);
                await this.add_param_if_not_exists(db, 'ModuleMailer.port', conf_module_mailer_line.port ? conf_module_mailer_line.port.toString() : null);
                await this.add_param_if_not_exists(db, 'ModuleMailer.secure', conf_module_mailer_line.secure ? '1' : '0');
                await this.add_param_if_not_exists(db, 'ModuleMailer.auth_user', conf_module_mailer_line.auth_user);
                await this.add_param_if_not_exists(db, 'ModuleMailer.auth_pass', conf_module_mailer_line.auth_pass);
                await this.add_param_if_not_exists(db, 'ModuleMailer.from_address', conf_module_mailer_line.from_address);
                await this.add_param_if_not_exists(db, 'ModuleMailer.subject_prefix', conf_module_mailer_line.subject_prefix);
                await this.add_param_if_not_exists(db, 'ModuleMailer.subject_suffix', conf_module_mailer_line.subject_suffix);

                await db.none("DROP TABLE admin.module_mailer;");
            }

            /**
             * ModuleFormatDatesNombres
             * Ancienne conf des param_name :
             *     public static PARAM_NAME_date_format_month_date = 'date_format_month_date';
             *     public static PARAM_NAME_date_format_fullyear_month_date = 'date_format_fullyear_month_date';
             *     public static PARAM_NAME_date_format_fullyear_month_day_date = 'date_format_fullyear_month_day_date';
             *     public static PARAM_NAME_date_format_fullyear = 'date_format_fullyear';
             *     public static PARAM_NAME_nombre_separateur_1000 = 'nombre_separateur_1000';
             *     public static PARAM_NAME_nombre_separateur_decimal = 'nombre_separateur_decimal';
             * Nouvelle conf des param_name :
             *     public static PARAM_NAME_date_format_month_date = 'ModuleFormatDatesNombres.date_format_month_date';
             *     public static PARAM_NAME_date_format_fullyear_month_date = 'ModuleFormatDatesNombres.date_format_fullyear_month_date';
             *     public static PARAM_NAME_date_format_fullyear_month_day_date = 'ModuleFormatDatesNombres.date_format_fullyear_month_day_date';
             *     public static PARAM_NAME_date_format_fullyear = 'ModuleFormatDatesNombres.date_format_fullyear';
             *     public static PARAM_NAME_nombre_separateur_1000 = 'ModuleFormatDatesNombres.nombre_separateur_1000';
             *     public static PARAM_NAME_nombre_separateur_decimal = 'ModuleFormatDatesNombres.nombre_separateur_decimal';
             */
            let conf_module_format_dates_nombres_lines = await db.oneOrNone("SELECT * FROM admin.module_format_dates_nombres;");
            let conf_module_format_dates_nombres_line = conf_module_format_dates_nombres_lines ? conf_module_format_dates_nombres_lines[0] : null;
            if (!!conf_module_format_dates_nombres_line) {
                ConsoleHandler.log('Migration des champs de ModuleFormatDatesNombres vers ParamVOs');
                await this.add_param_if_not_exists(db, 'ModuleFormatDatesNombres.date_format_month_date', conf_module_format_dates_nombres_line.date_format_month_date);
                await this.add_param_if_not_exists(db, 'ModuleFormatDatesNombres.date_format_fullyear_month_date', conf_module_format_dates_nombres_line.date_format_fullyear_month_date);
                await this.add_param_if_not_exists(db, 'ModuleFormatDatesNombres.date_format_fullyear_month_day_date', conf_module_format_dates_nombres_line.date_format_fullyear_month_day_date);
                await this.add_param_if_not_exists(db, 'ModuleFormatDatesNombres.date_format_fullyear', conf_module_format_dates_nombres_line.date_format_fullyear);
                await this.add_param_if_not_exists(db, 'ModuleFormatDatesNombres.nombre_separateur_1000', conf_module_format_dates_nombres_line.nombre_separateur_1000);
                await this.add_param_if_not_exists(db, 'ModuleFormatDatesNombres.nombre_separateur_decimal', conf_module_format_dates_nombres_line.nombre_separateur_decimal);

                await db.none("DROP TABLE admin.module_format_dates_nombres;");
            }

            /**
             * ModuleSASSSkinConfigurator
             * Ancienne conf des param_name :
             *     public static PARAM_NAME_danger_color: string = 'danger_color';
             *     public static PARAM_NAME_success_color: string = 'success_color';
             *     public static PARAM_NAME_input_editable_bg_color_danger: string = 'input_editable_bg_color_danger';
             *     public static PARAM_NAME_input_editable_bg_color: string = 'input_editable_bg_color';
             *     public static PARAM_NAME_input_readonly_text_color: string = 'input_readonly_text_color';
             *     public static PARAM_NAME_input_ok_bg_color: string = 'input_ok_bg_color';
             *     public static PARAM_NAME_button_text_color: string = 'button_text_color';
             *     public static PARAM_NAME_button_primary_bg_color: string = 'button_primary_bg_color';
             *     public static PARAM_NAME_button_primary_active_bg_color: string = 'button_primary_active_bg_color';
             *     public static PARAM_NAME_button_warning_color: string = 'button_warning_color';
             *     public static PARAM_NAME_table_header_bg_color: string = 'table_header_bg_color';
             *     public static PARAM_NAME_table_border: string = 'table_border';
             *     public static PARAM_NAME_table_activeitems_bg_color: string = 'table_activeitems_bg_color';
             *     public static PARAM_NAME_main_sidebar_bg_color: string = 'main_sidebar_bg_color';
             *     public static PARAM_NAME_main_sidebar_bg_color_rgba: string = 'main_sidebar_bg_color_rgba';
             *     public static PARAM_NAME_main_footer_bg_color: string = 'main_footer_bg_color';
             *     public static PARAM_NAME_main_header_bg_color: string = 'main_header_bg_color';
             *     public static PARAM_NAME_main_box_body_bg_color: string = 'main_box_body_bg_color';
             *     public static PARAM_NAME_main_menu_text_color: string = 'main_menu_text_color';
             *     public static PARAM_NAME_main_box_title_color: string = 'main_box_title_color';
             *     public static PARAM_NAME_main_background_url: string = 'main_background_url';
             *     public static PARAM_NAME_main_icons_lightbackground: string = 'main_icons_lightbackground';
             *     public static PARAM_NAME_main_menu_bg_color: string = 'main_menu_bg_color';
             *     public static PARAM_NAME_main_menu_active_bg_color: string = 'main_menu_active_bg_color';
             *     public static PARAM_NAME_box_title_bg_url: string = 'box_title_bg_url';
             *     public static PARAM_NAME_picto_store_url: string = 'picto_store_url';
             *     public static PARAM_NAME_picto_store_info_url: string = 'picto_store_info_url';
             *     public static PARAM_NAME_picto_orga_url: string = 'picto_orga_url';
             *     public static PARAM_NAME_picto_tool_small_url: string = 'picto_tool_small_url';
             *     public static PARAM_NAME_picto_fleche_verte_url: string = 'picto_fleche_verte_url';
             *     public static PARAM_NAME_picto_clock_small_url: string = 'picto_clock_small_url';
             *     public static PARAM_NAME_picto_objectivos_url: string = 'picto_objectivos_url';
             *     public static PARAM_NAME_picto_atteindre_url: string = 'picto_atteindre_url';
             *     public static PARAM_NAME_picto_equipe_url: string = 'picto_equipe_url';
             *     public static PARAM_NAME_main_link_color: string = 'main_link_color';
             *     public static PARAM_NAME_header_text_color: string = 'header_text_color';
             *     public static PARAM_NAME_light_warning: string = 'light_warning';
             *     public static PARAM_NAME_light_low: string = 'light_low';
             *     public static PARAM_NAME_gris_clair: string = 'gris_clair';
             *     public static PARAM_NAME_vert_clair: string = 'vert_clair';
             *     public static PARAM_NAME_table_header_odd_bg: string = 'table_header_odd_bg';
             *     public static PARAM_NAME_table_header_even_bg: string = 'table_header_even_bg';
             *     public static PARAM_NAME_table_content_odd_bg: string = 'table_content_odd_bg';
             *     public static PARAM_NAME_table_content_even_bg: string = 'table_content_even_bg';
             *     public static PARAM_NAME_main_background: string = 'main_background';
             *     public static PARAM_NAME_main_sidebar_background: string = 'main_sidebar_background';
             *     public static PARAM_NAME_planning_realise_header_bg: string = 'planning_realise_header_bg';
             *     public static PARAM_NAME_main_background_int_url: string = 'main_background_int_url';
             *     public static PARAM_NAME_main_background_header_url: string = 'main_background_header_url';
             *     public static PARAM_NAME_logo_url: string = 'logo_url';
             *     public static PARAM_NAME_picto_product_url: string = 'picto_product_url';
             *     public static PARAM_NAME_picto_saisonnalite_url: string = 'picto_saisonnalite_url';
             *     public static PARAM_NAME_animation_background: string = 'animation_background';
             *     public static PARAM_NAME_animation_secondary: string = 'animation_secondary';
             *     public static PARAM_NAME_animation_orange: string = 'animation_orange';
             *     public static PARAM_NAME_animation_rouge: string = 'animation_rouge';
             *     public static PARAM_NAME_animation_vert: string = 'animation_vert';
             *     public static PARAM_NAME_header_text_color_mid_opacity: string = 'header_text_color_mid_opacity';
             * Nouvelle conf des param_name :
             *     public static PARAM_NAME_danger_color: string = 'sass_skin_generator.danger_color';
             *     public static PARAM_NAME_success_color: string = 'sass_skin_generator.success_color';
             *     public static PARAM_NAME_input_editable_bg_color_danger: string = 'sass_skin_generator.input_editable_bg_color_danger';
             *     public static PARAM_NAME_input_editable_bg_color: string = 'sass_skin_generator.input_editable_bg_color';
             *     public static PARAM_NAME_input_readonly_text_color: string = 'sass_skin_generator.input_readonly_text_color';
             *     public static PARAM_NAME_input_ok_bg_color: string = 'sass_skin_generator.input_ok_bg_color';
             *     public static PARAM_NAME_button_text_color: string = 'sass_skin_generator.button_text_color';
             *     public static PARAM_NAME_button_primary_bg_color: string = 'sass_skin_generator.button_primary_bg_color';
             *     public static PARAM_NAME_button_primary_active_bg_color: string = 'sass_skin_generator.button_primary_active_bg_color';
             *     public static PARAM_NAME_button_warning_color: string = 'sass_skin_generator.button_warning_color';
             *     public static PARAM_NAME_table_header_bg_color: string = 'sass_skin_generator.table_header_bg_color';
             *     public static PARAM_NAME_table_border: string = 'sass_skin_generator.table_border';
             *     public static PARAM_NAME_table_activeitems_bg_color: string = 'sass_skin_generator.table_activeitems_bg_color';
             *     public static PARAM_NAME_main_sidebar_bg_color: string = 'sass_skin_generator.main_sidebar_bg_color';
             *     public static PARAM_NAME_main_sidebar_bg_color_rgba: string = 'sass_skin_generator.main_sidebar_bg_color_rgba';
             *     public static PARAM_NAME_main_footer_bg_color: string = 'sass_skin_generator.main_footer_bg_color';
             *     public static PARAM_NAME_main_header_bg_color: string = 'sass_skin_generator.main_header_bg_color';
             *     public static PARAM_NAME_main_box_body_bg_color: string = 'sass_skin_generator.main_box_body_bg_color';
             *     public static PARAM_NAME_main_menu_text_color: string = 'sass_skin_generator.main_menu_text_color';
             *     public static PARAM_NAME_main_box_title_color: string = 'sass_skin_generator.main_box_title_color';
             *     public static PARAM_NAME_main_background_url: string = 'sass_skin_generator.main_background_url';
             *     public static PARAM_NAME_main_icons_lightbackground: string = 'sass_skin_generator.main_icons_lightbackground';
             *     public static PARAM_NAME_main_menu_bg_color: string = 'sass_skin_generator.main_menu_bg_color';
             *     public static PARAM_NAME_main_menu_active_bg_color: string = 'sass_skin_generator.main_menu_active_bg_color';
             *     public static PARAM_NAME_box_title_bg_url: string = 'sass_skin_generator.box_title_bg_url';
             *     public static PARAM_NAME_picto_store_url: string = 'sass_skin_generator.picto_store_url';
             *     public static PARAM_NAME_picto_store_info_url: string = 'sass_skin_generator.picto_store_info_url';
             *     public static PARAM_NAME_picto_orga_url: string = 'sass_skin_generator.picto_orga_url';
             *     public static PARAM_NAME_picto_tool_small_url: string = 'sass_skin_generator.picto_tool_small_url';
             *     public static PARAM_NAME_picto_fleche_verte_url: string = 'sass_skin_generator.picto_fleche_verte_url';
             *     public static PARAM_NAME_picto_clock_small_url: string = 'sass_skin_generator.picto_clock_small_url';
             *     public static PARAM_NAME_picto_objectivos_url: string = 'sass_skin_generator.picto_objectivos_url';
             *     public static PARAM_NAME_picto_atteindre_url: string = 'sass_skin_generator.picto_atteindre_url';
             *     public static PARAM_NAME_picto_equipe_url: string = 'sass_skin_generator.picto_equipe_url';
             *     public static PARAM_NAME_main_link_color: string = 'sass_skin_generator.main_link_color';
             *     public static PARAM_NAME_header_text_color: string = 'sass_skin_generator.header_text_color';
             *     public static PARAM_NAME_light_warning: string = 'sass_skin_generator.light_warning';
             *     public static PARAM_NAME_light_low: string = 'sass_skin_generator.light_low';
             *     public static PARAM_NAME_gris_clair: string = 'sass_skin_generator.gris_clair';
             *     public static PARAM_NAME_vert_clair: string = 'sass_skin_generator.vert_clair';
             *     public static PARAM_NAME_table_header_odd_bg: string = 'sass_skin_generator.table_header_odd_bg';
             *     public static PARAM_NAME_table_header_even_bg: string = 'sass_skin_generator.table_header_even_bg';
             *     public static PARAM_NAME_table_content_odd_bg: string = 'sass_skin_generator.table_content_odd_bg';
             *     public static PARAM_NAME_table_content_even_bg: string = 'sass_skin_generator.table_content_even_bg';
             *     public static PARAM_NAME_main_background: string = 'sass_skin_generator.main_background';
             *     public static PARAM_NAME_main_sidebar_background: string = 'sass_skin_generator.main_sidebar_background';
             *     public static PARAM_NAME_planning_realise_header_bg: string = 'sass_skin_generator.planning_realise_header_bg';
             *     public static PARAM_NAME_main_background_int_url: string = 'sass_skin_generator.main_background_int_url';
             *     public static PARAM_NAME_main_background_header_url: string = 'sass_skin_generator.main_background_header_url';
             *     public static PARAM_NAME_logo_url: string = 'sass_skin_generator.logo_url';
             *     public static PARAM_NAME_picto_product_url: string = 'sass_skin_generator.picto_product_url';
             *     public static PARAM_NAME_picto_saisonnalite_url: string = 'sass_skin_generator.picto_saisonnalite_url';
             *     public static PARAM_NAME_animation_background: string = 'sass_skin_generator.animation_background';
             *     public static PARAM_NAME_animation_secondary: string = 'sass_skin_generator.animation_secondary';
             *     public static PARAM_NAME_animation_orange: string = 'sass_skin_generator.animation_orange';
             *     public static PARAM_NAME_animation_rouge: string = 'sass_skin_generator.animation_rouge';
             *     public static PARAM_NAME_animation_vert: string = 'sass_skin_generator.animation_vert';
             *     public static PARAM_NAME_header_text_color_mid_opacity: string = 'sass_skin_generator.header_text_color_mid_opacity';
             */
            let conf_module_sass_skin_configurator_lines = await db.oneOrNone("SELECT * FROM admin.module_sass_resource_planning_skin_configurator;");
            let conf_module_sass_skin_configurator_line = conf_module_sass_skin_configurator_lines ? conf_module_sass_skin_configurator_lines[0] : null;
            if (!!conf_module_sass_skin_configurator_line) {
                ConsoleHandler.log('Migration des champs de ModuleSASSSkinConfigurator vers ParamVOs');
                await this.add_param_if_not_exists(db, 'sass_skin_generator.danger_color', conf_module_sass_skin_configurator_line.danger_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.success_color', conf_module_sass_skin_configurator_line.success_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.input_editable_bg_color_danger', conf_module_sass_skin_configurator_line.input_editable_bg_color_danger);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.input_editable_bg_color', conf_module_sass_skin_configurator_line.input_editable_bg_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.input_readonly_text_color', conf_module_sass_skin_configurator_line.input_readonly_text_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.input_ok_bg_color', conf_module_sass_skin_configurator_line.input_ok_bg_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.button_text_color', conf_module_sass_skin_configurator_line.button_text_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.button_primary_bg_color', conf_module_sass_skin_configurator_line.button_primary_bg_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.button_primary_active_bg_color', conf_module_sass_skin_configurator_line.button_primary_active_bg_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.button_warning_color', conf_module_sass_skin_configurator_line.button_warning_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.table_header_bg_color', conf_module_sass_skin_configurator_line.table_header_bg_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.table_border', conf_module_sass_skin_configurator_line.table_border);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.table_activeitems_bg_color', conf_module_sass_skin_configurator_line.table_activeitems_bg_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_sidebar_bg_color', conf_module_sass_skin_configurator_line.main_sidebar_bg_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_sidebar_bg_color_rgba', conf_module_sass_skin_configurator_line.main_sidebar_bg_color_rgba);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_footer_bg_color', conf_module_sass_skin_configurator_line.main_footer_bg_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_header_bg_color', conf_module_sass_skin_configurator_line.main_header_bg_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_box_body_bg_color', conf_module_sass_skin_configurator_line.main_box_body_bg_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_menu_text_color', conf_module_sass_skin_configurator_line.main_menu_text_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_box_title_color', conf_module_sass_skin_configurator_line.main_box_title_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_background_url', conf_module_sass_skin_configurator_line.main_background_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_icons_lightbackground', conf_module_sass_skin_configurator_line.main_icons_lightbackground);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_menu_bg_color', conf_module_sass_skin_configurator_line.main_menu_bg_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_menu_active_bg_color', conf_module_sass_skin_configurator_line.main_menu_active_bg_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.box_title_bg_url', conf_module_sass_skin_configurator_line.box_title_bg_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.picto_store_url', conf_module_sass_skin_configurator_line.picto_store_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.picto_store_info_url', conf_module_sass_skin_configurator_line.picto_store_info_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.picto_orga_url', conf_module_sass_skin_configurator_line.picto_orga_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.picto_tool_small_url', conf_module_sass_skin_configurator_line.picto_tool_small_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.picto_fleche_verte_url', conf_module_sass_skin_configurator_line.picto_fleche_verte_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.picto_clock_small_url', conf_module_sass_skin_configurator_line.picto_clock_small_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.picto_objectivos_url', conf_module_sass_skin_configurator_line.picto_objectivos_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.picto_atteindre_url', conf_module_sass_skin_configurator_line.picto_atteindre_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.picto_equipe_url', conf_module_sass_skin_configurator_line.picto_equipe_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_link_color', conf_module_sass_skin_configurator_line.main_link_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.header_text_color', conf_module_sass_skin_configurator_line.header_text_color);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.light_warning', conf_module_sass_skin_configurator_line.light_warning);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.light_low', conf_module_sass_skin_configurator_line.light_low);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.gris_clair', conf_module_sass_skin_configurator_line.gris_clair);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.vert_clair', conf_module_sass_skin_configurator_line.vert_clair);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.table_header_odd_bg', conf_module_sass_skin_configurator_line.table_header_odd_bg);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.table_header_even_bg', conf_module_sass_skin_configurator_line.table_header_even_bg);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.table_content_odd_bg', conf_module_sass_skin_configurator_line.table_content_odd_bg);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.table_content_even_bg', conf_module_sass_skin_configurator_line.table_content_even_bg);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_background', conf_module_sass_skin_configurator_line.main_background);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_sidebar_background', conf_module_sass_skin_configurator_line.main_sidebar_background);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.planning_realise_header_bg', conf_module_sass_skin_configurator_line.planning_realise_header_bg);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_background_int_url', conf_module_sass_skin_configurator_line.main_background_int_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.main_background_header_url', conf_module_sass_skin_configurator_line.main_background_header_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.logo_url', conf_module_sass_skin_configurator_line.logo_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.picto_product_url', conf_module_sass_skin_configurator_line.picto_product_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.picto_saisonnalite_url', conf_module_sass_skin_configurator_line.picto_saisonnalite_url);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.animation_background', conf_module_sass_skin_configurator_line.animation_background);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.animation_secondary', conf_module_sass_skin_configurator_line.animation_secondary);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.animation_orange', conf_module_sass_skin_configurator_line.animation_orange);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.animation_rouge', conf_module_sass_skin_configurator_line.animation_rouge);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.animation_vert', conf_module_sass_skin_configurator_line.animation_vert);
                await this.add_param_if_not_exists(db, 'sass_skin_generator.header_text_color_mid_opacity', conf_module_sass_skin_configurator_line.header_text_color_mid_opacity);

                await db.none("DROP TABLE admin.module_sass_resource_planning_skin_configurator;");
            }

            /**
             * ModuleAccessPolicy
             * A priori on a toujours la table mais on s'en sert plus, on la supprime dans ce cas
             */
            let conf_module_access_policy_lines = await db.oneOrNone("SELECT * FROM admin.module_access_policy;");
            let conf_module_access_policy_line = conf_module_access_policy_lines ? conf_module_access_policy_lines[0] : null;
            if (!!conf_module_access_policy_line) {
                await db.none("DROP TABLE admin.module_access_policy;");
            }

            /**
             * ModuleMaintenance
             * Idem
             */
            let conf_module_maintenance_lines = await db.oneOrNone("SELECT * FROM admin.module_maintenance;");
            let conf_module_maintenance_line = conf_module_maintenance_lines ? conf_module_maintenance_lines[0] : null;
            if (!!conf_module_maintenance_line) {
                await db.none("DROP TABLE admin.module_maintenance;");
            }

            /**
             * On liste les tables qui restent dans admin.* et on les loggue en indiquant de bien unshift le patch qui doit gérer la migration
             *  tout en bloquant aussi la compilation pour assurer une prise en compte et un correctif immédiat
             */
            // Il existe la table "admin.modules" normalement qu'il est normal d'avoir et qu'on veut pas prendre en compte du coup
            let remaining_tables = await db.manyOrNone("SELECT table_name FROM information_schema.tables WHERE table_schema = 'admin' AND table_name != 'modules';");
            if (remaining_tables && (remaining_tables.length > 0)) {
                ConsoleHandler.error('Il reste des tables dans le schéma admin, il faut les migrer vers des ParamVOs et les supprimer de la base de données. Tables restantes : ' + remaining_tables.map((table) => table.table_name).join(', '));
                throw new Error('Il reste des tables dans le schéma admin, il faut les migrer vers des ParamVOs et les supprimer de la base de données. Tables restantes : ' + remaining_tables.map((table) => table.table_name).join(', '));
            }

        } catch (error) {
            ConsoleHandler.error('Erreur lors de la migration des champs de Module.FIELDS vers ParamVOs:' + error);
            throw error;
        }
    }

    private async add_param_if_not_exists(db: IDatabase<any>, name: string, value: string) {
        let param = await db.oneOrNone("SELECT * FROM ref.module_params_param WHERE name=$1;", [name]);
        if (!param) {
            await db.none("INSERT INTO ref.module_params_param (name, value, last_up_date) VALUES ($1, $2, $3);", [name, value, Dates.now()]);
        }
    }
}