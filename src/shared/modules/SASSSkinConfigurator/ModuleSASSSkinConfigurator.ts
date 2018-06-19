import Module from '../Module';
import ModuleTableField from '../ModuleTableField';
import ModuleTable from '../ModuleTable';
import ModuleParamChange from '../ModuleParamChange';
import * as moment from 'moment';

export default class ModuleSASSSkinConfigurator extends Module {

    public static getInstance(): ModuleSASSSkinConfigurator {
        if (!ModuleSASSSkinConfigurator.instance) {
            ModuleSASSSkinConfigurator.instance = new ModuleSASSSkinConfigurator();
        }
        return ModuleSASSSkinConfigurator.instance;
    }

    private static instance: ModuleSASSSkinConfigurator = null;

    private fileName;

    private sassDir;
    private dynSassFile;

    private cssDir;
    private dynCssFile;

    private sass;
    private fs;

    private sassOptionsDefaults = {};

    private sassGenerator = {

        sassVariable: function (name, value) {
            return "$" + name + ": " + value + ";";
        },

        sassVariables: function (variablesObj) {
            let self = this;
            return Object.keys(variablesObj).map(function (name) {
                return self.sassVariable(name, variablesObj[name]);
            }).join('\n');
        },

        sassImport: function (path) {
            return "@import '" + path + "';";
        }
    };

    private constructor() {

        super("sass_resource_planning_skin_configurator", "SASSSkinConfigurator");

        this.initialize();
    }

    /// #if false
    public async hook_module_configure(db) { return true; }
    /// #endif

    public async hook_module_async_client_admin_initialization() { }

    /// #if false
    public async hook_module_install(db) {

        // Cette section ne doit jamais être incluse sur le client

        // On veut recharger le Sass dans 2 cas :
        //	- les fichiers SCSS changent
        //	- les paramètres du module sont mis à jour
        this.fileName = 'resource-planning-skin';

        this.sassDir = './src/client/scss/';
        this.dynSassFile = this.sassDir + this.fileName + '.scss';

        this.cssDir = './src/client/public/css/';
        this.dynCssFile = this.cssDir + this.fileName + '.css';

        this.sass = require('node-sass');
        this.fs = require('fs');

        let self = this;
        this.fs.watch(this.sassDir, function (event, filename) {

            self.load_dyn_sass();
        });

        return await this.load_dyn_sass();
    }
    /// #endif

    public async hook_module_on_params_changed(paramChanged: Array<ModuleParamChange<any>>) {
        await this.load_dyn_sass();
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

    private async dynamicSass(scssEntry, variables, handleSuccess, handleError): Promise<any> {

        return new Promise((resolve, reject) => {

            var dataString =
                this.sassGenerator.sassVariables(variables) +
                this.sassGenerator.sassImport(scssEntry);

            this.sassOptionsDefaults['data'] = dataString;

            let self = this;

            this.sass.render(this.sassOptionsDefaults, function (err, result) {

                if (!result) {
                    console.log(self.fileName + '.css ERROR :result null:' + err);
                    return;
                }

                self.fs.writeFile(self.dynCssFile, result.css, function (err) {
                    if (!err) {
                        console.log(self.fileName + '.css writen successfuly');
                    } else {
                        console.log(self.fileName + '.css ERROR :' + err);
                    }
                });

                if (err) {
                    handleError(err);
                } else {
                    handleSuccess(result.css.toString());
                }
                resolve();
            });
        });
    }

    private async load_dyn_sass(handleSuccess = null, handleError = null) {

        // On configure les fichiers sass et on surcharge avec les datas configurées en admin
        let SkinOptions = {};

        for (let i in this.fields) {
            let field = this.fields[i];

            SkinOptions[field.field_id] = field.field_value;
        }

        await this.dynamicSass(this.dynSassFile, SkinOptions, function () {
            console.log('SASS OK');
            if (handleSuccess) {
                handleSuccess();
            }
        }, function (e) {
            console.log('SASS LOADING FAILED !' + e);
            if (handleError) {
                handleError();
            }
        });

        return true;
    }
}