import ModuleServerBase from '../ModuleServerBase';
import ModuleSASSSkinConfigurator from '../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import * as sass from 'node-sass';
import * as fs from 'fs';
export default class ModuleSASSSkinConfiguratorServer extends ModuleServerBase {

    public static getInstance() {
        if (!ModuleSASSSkinConfiguratorServer.instance) {
            ModuleSASSSkinConfiguratorServer.instance = new ModuleSASSSkinConfiguratorServer();
        }
        return ModuleSASSSkinConfiguratorServer.instance;
    }

    private static instance: ModuleSASSSkinConfiguratorServer = null;

    get actif(): boolean {
        return ModuleSASSSkinConfigurator.getInstance().actif;
    }

    private fileName;

    private sassDir;
    private dynSassFile;

    private cssDir;
    private dynCssFile;

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

    public async generatesass() {

        // On veut recharger le Sass dans 2 cas :
        //	- les fichiers SCSS changent
        //	- les paramètres du module sont mis à jour
        this.fileName = 'resource-planning-skin';

        this.sassDir = './src/client/scss/';
        this.dynSassFile = this.sassDir + this.fileName + '.scss';

        this.cssDir = './src/client/public/css/';
        this.dynCssFile = this.cssDir + this.fileName + '.css';

        let self = this;
        fs.watch(this.sassDir, function (event, filename) {

            self.load_dyn_sass();
        });

        return await this.load_dyn_sass();
    }

    private async dynamicSass(scssEntry, variables, handleSuccess, handleError): Promise<any> {

        return new Promise((resolve, reject) => {

            var dataString =
                this.sassGenerator.sassVariables(variables) +
                this.sassGenerator.sassImport(scssEntry);

            this.sassOptionsDefaults['data'] = dataString;

            let self = this;

            sass.render(this.sassOptionsDefaults, function (err, result) {

                if (!result) {
                    console.log(self.fileName + '.css ERROR :result null:' + err);
                    return;
                }

                fs.writeFile(self.dynCssFile, result.css, function (err) {
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

        for (let i in ModuleSASSSkinConfigurator.getInstance().fields) {
            let field = ModuleSASSSkinConfigurator.getInstance().fields[i];

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