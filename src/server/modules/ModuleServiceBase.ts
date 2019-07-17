import Module from '../../shared/modules/Module';
import ModuleServerBase from './ModuleServerBase';
import { Express } from 'express';
import ModuleDBService from './ModuleDBService';
import ModuleAjaxCache from '../../shared/modules/AjaxCache/ModuleAjaxCache';
import ModuleAPI from '../../shared/modules/API/ModuleAPI';
import ModuleDAO from '../../shared/modules/DAO/ModuleDAO';
import ModuleAccessPolicy from '../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleCron from '../../shared/modules/Cron/ModuleCron';
import ModuleTranslation from '../../shared/modules/Translation/ModuleTranslation';
import ModuleMailer from '../../shared/modules/Mailer/ModuleMailer';
import ModuleDataImport from '../../shared/modules/DataImport/ModuleDataImport';
import ModuleDataExport from '../../shared/modules/DataExport/ModuleDataExport';
import ModuleDataRender from '../../shared/modules/DataRender/ModuleDataRender';
import ModuleAPIServer from './API/ModuleAPIServer';
import ModuleDAOServer from './DAO/ModuleDAOServer';
import ModuleAccessPolicyServer from './AccessPolicy/ModuleAccessPolicyServer';
import ModuleTranslationServer from './Translation/ModuleTranslationServer';
import ModuleMailerServer from './Mailer/ModuleMailerServer';
import ModuleDataImportServer from './DataImport/ModuleDataImportServer';
import ModuleDataExportServer from './DataExport/ModuleDataExportServer';
import ModuleDataRenderServer from './DataRender/ModuleDataRenderServer';
import { IDatabase } from 'pg-promise';
import ModuleSASSSkinConfigurator from '../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import ModuleFormatDatesNombres from '../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import ModuleSASSSkinConfiguratorServer from './SASSSkinConfigurator/ModuleSASSSkinConfiguratorServer';
import ModuleCronServer from './Cron/ModuleCronServer';
import ModuleTrigger from '../../shared/modules/Trigger/ModuleTrigger';
import ConfigurationService from '../env/ConfigurationService';
import ModulePushDataServer from './PushData/ModulePushDataServer';
import ModulePushData from '../../shared/modules/PushData/ModulePushData';
import ModuleFileServer from './File/ModuleFileServer';
import ModuleFile from '../../shared/modules/File/ModuleFile';
import ModuleImageServer from './Image/ModuleImageServer';
import ModuleImage from '../../shared/modules/Image/ModuleImage';
import ModuleCommerce from '../../shared/modules/Commerce/ModuleCommerce';
import ModuleCommerceServer from './Commerce/ModuleCommerceServer';
import ModuleProduit from '../../shared/modules/Commerce/Produit/ModuleProduit';
import ModuleClient from '../../shared/modules/Commerce/Client/ModuleClient';
import ModuleCommande from '../../shared/modules/Commerce/Commande/ModuleCommande';
import ModuleAbonnement from '../../shared/modules/Commerce/Abonnement/ModuleAbonnement';
import ModulePaiement from '../../shared/modules/Commerce/Paiement/ModulePaiement';
import ModuleCommandeServer from './Commerce/Commande/ModuleCommandeServer';
import ModuleProduitServer from './Commerce/Produit/ModuleProduitServer';
import ModuleClientServer from './Commerce/Client/ModuleClientServer';
import ModuleAbonnementServer from './Commerce/Abonnement/ModuleAbonnementServer';
import ModulePaiementServer from './Commerce/Paiement/ModulePaiementServer';
import ModuleCMS from '../../shared/modules/CMS/ModuleCMS';
import ModuleCMSServer from './CMS/ModuleCMSServer';
import ModuleAjaxCacheServer from './AjaxCache/ModuleAjaxCacheServer';
import ModuleVar from '../../shared/modules/Var/ModuleVar';
import ModuleVarServer from './Var/ModuleVarServer';
import ModuleDataSource from '../../shared/modules/DataSource/ModuleDataSource';
import ModuleVersioned from '../../shared/modules/Versioned/ModuleVersioned';
import ModuleVersionedServer from './Versioned/ModuleVersionedServer';
import ModuleGeneratePDF from '../../shared/modules/GeneratePDF/ModuleGeneratePDF';
import ModuleGeneratePDFServer from './GeneratePDF/ModuleGeneratePDFServer';
import ModuleTranslationsImportServer from './Translation/import/ModuleTranslationsImportServer';
import ModuleTranslationsImport from '../../shared/modules/Translation/import/ModuleTranslationsImport';
import ModuleMaintenanceServer from './Maintenance/ModuleMaintenanceServer';
import ModuleMaintenance from '../../shared/modules/Maintenance/ModuleMaintenance';

export default abstract class ModuleServiceBase {

    public static getInstance(): ModuleServiceBase {
        return ModuleServiceBase.instance;
    }
    private static instance: ModuleServiceBase;

    public db: IDatabase<any>;

    protected registered_child_modules: Module[] = [];
    protected login_child_modules: Module[] = [];
    protected server_child_modules: ModuleServerBase[] = [];

    private registered_modules: Module[] = [];
    private login_modules: Module[] = [];
    private server_modules: ModuleServerBase[] = [];

    private registered_base_modules: Module[] = [];
    private login_base_modules: Module[] = [];
    private server_base_modules: ModuleServerBase[] = [];


    protected constructor() {
        ModuleServiceBase.instance = this;
    }

    get bdd_owner(): string {
        return ConfigurationService.getInstance().getNodeConfiguration().BDD_OWNER;
    }

    get sharedModules(): Module[] {
        return this.registered_modules;
    }
    get loginModules(): Module[] {
        return this.login_modules;
    }
    get serverModules(): ModuleServerBase[] {
        return this.server_modules;
    }

    public isBaseSharedModule(module: Module): boolean {
        if (!module) {
            return false;
        }

        for (let i in this.registered_base_modules) {
            if (this.registered_base_modules[i] == module) {
                return true;
            }
        }
        return false;
    }
    public isBaseLoginModule(module: Module): boolean {
        if (!module) {
            return false;
        }

        for (let i in this.login_base_modules) {
            if (this.login_base_modules[i] == module) {
                return true;
            }
        }
        return false;
    }
    public isBaseServerModule(module: ModuleServerBase): boolean {
        if (!module) {
            return false;
        }

        for (let i in this.server_base_modules) {
            if (this.server_base_modules[i] == module) {
                return true;
            }
        }
        return false;
    }

    public async register_all_modules(db: IDatabase<any>) {
        this.db = db;

        this.registered_base_modules = this.getBaseModules();
        this.registered_child_modules = this.getChildModules();
        this.registered_modules = [].concat(this.registered_base_modules, this.registered_child_modules);

        this.login_base_modules = this.getLoginBaseModules();
        this.login_child_modules = this.getLoginChildModules();
        this.login_modules = [].concat(this.login_base_modules, this.login_child_modules);

        this.server_base_modules = this.getServerBaseModules();
        this.server_child_modules = this.getServerChildModules();
        this.server_modules = [].concat(this.server_base_modules, this.server_child_modules);

        await this.create_modules_base_structure_in_db();

        // On lance l'installation des modules.
        await this.install_modules();

        // On lance la configuration des modules, et avant on configure les apis des modules server
        await this.configure_server_modules_apis();

        // On appelle le hook de configuration
        await this.configure_modules();
    }

    public async configure_server_modules_apis() {
        for (let i in this.server_modules) {
            let server_module: ModuleServerBase = this.server_modules[i];

            if (server_module.actif) {
                server_module.registerServerApiHandlers();
                await server_module.configure();
            }
        }
    }

    public async configure_server_modules(app: Express) {
        for (let i in this.server_modules) {
            let server_module: ModuleServerBase = this.server_modules[i];

            if (server_module.actif) {
                await server_module.registerAccessPolicies();
                await server_module.registerAccessRoles();

                await server_module.registerImport();
                server_module.registerCrons();
                server_module.registerAccessHooks();

                if (app) {
                    server_module.registerExpressApis(app);
                }
            }
        }
    }

    public get_modules_infos(env) {
        //  Si on a des sous-modules à définir pour front / admin / server, on peut le faire
        //      et en faisant le lien dans le typescript, on importera que le fichier qui nous est utile.
        return this.registered_modules;
    }

    protected abstract getChildModules(): Module[];
    protected getLoginChildModules(): Module[] {
        return [];
    }
    protected abstract getServerChildModules(): ModuleServerBase[];

    private async create_modules_base_structure_in_db() {
        // On vérifie que la table des modules est disponible, sinon on la crée
        await this.db.none("CREATE TABLE IF NOT EXISTS admin.modules (id bigserial NOT NULL, name varchar(255) not null, actif bool default false, CONSTRAINT modules_pkey PRIMARY KEY (id));");
        await this.db.none('GRANT ALL ON TABLE admin.modules TO ' + this.bdd_owner + ';');
    }

    private async install_modules() {
        for (let i in this.registered_modules) {
            let registered_module = this.registered_modules[i];

            try {
                await ModuleDBService.getInstance(this.db).module_install(
                    registered_module
                );
            } catch (e) {
                console.error(
                    "Erreur lors de l'installation du module \"" +
                    registered_module.name +
                    '".'
                );
                console.log(e);
                process.exit(0);
            }
        }

        console.log("Tous les modules ont été installés");
        return true;
    }

    private async configure_modules() {
        for (let i in this.registered_modules) {
            let registered_module = this.registered_modules[i];

            try {
                if (registered_module.actif) {
                    await ModuleDBService.getInstance(this.db).module_configure(
                        registered_module
                    );
                }
            } catch (e) {
                console.error(
                    "Erreur lors de la configuration du module \"" +
                    registered_module.name +
                    '".'
                );
                console.log(e);
                process.exit(0);
            }
        }

        console.log("Tous les modules ont été configurés");
        return true;
    }

    private getLoginBaseModules(): Module[] {
        return [
            ModuleAjaxCache.getInstance(),
            ModuleAPI.getInstance(),
            ModuleDAO.getInstance(),
            ModuleTranslation.getInstance(),
            ModuleAccessPolicy.getInstance(),
            ModuleFile.getInstance(),
            ModuleImage.getInstance(),
            ModuleTrigger.getInstance(),
            ModulePushData.getInstance(),
            ModuleFormatDatesNombres.getInstance(),
            ModuleMailer.getInstance(),
            ModuleSASSSkinConfigurator.getInstance(),
            ModuleVar.getInstance(),
        ];
    }

    private getBaseModules(): Module[] {
        return [
            ModuleDAO.getInstance(),
            ModuleTranslation.getInstance(),
            ModuleAccessPolicy.getInstance(),
            ModuleAPI.getInstance(),
            ModuleAjaxCache.getInstance(),
            ModuleFile.getInstance(),
            ModuleImage.getInstance(),
            ModuleTrigger.getInstance(),
            ModuleCron.getInstance(),
            ModuleDataSource.getInstance(),
            ModuleVar.getInstance(),
            ModulePushData.getInstance(),
            ModuleFormatDatesNombres.getInstance(),
            ModuleMailer.getInstance(),
            ModuleDataImport.getInstance(),
            ModuleDataExport.getInstance(),
            ModuleDataRender.getInstance(),
            ModuleSASSSkinConfigurator.getInstance(),
            ModuleCommerce.getInstance(),
            ModuleProduit.getInstance(),
            ModuleClient.getInstance(),
            ModuleCommande.getInstance(),
            ModuleAbonnement.getInstance(),
            ModulePaiement.getInstance(),
            ModuleCMS.getInstance(),
            ModuleVersioned.getInstance(),
            ModuleGeneratePDF.getInstance(),
            ModuleTranslationsImport.getInstance(),
            ModuleMaintenance.getInstance()
        ];
    }

    private getServerBaseModules(): ModuleServerBase[] {
        return [
            ModuleDAOServer.getInstance(),
            ModuleTranslationServer.getInstance(),
            ModuleAccessPolicyServer.getInstance(),
            ModuleAPIServer.getInstance(),
            ModuleAjaxCacheServer.getInstance(),
            ModuleFileServer.getInstance(),
            ModuleImageServer.getInstance(),
            ModuleCronServer.getInstance(),
            ModuleVarServer.getInstance(),
            ModulePushDataServer.getInstance(),
            ModuleMailerServer.getInstance(),
            ModuleDataImportServer.getInstance(),
            ModuleDataExportServer.getInstance(),
            ModuleDataRenderServer.getInstance(),
            ModuleSASSSkinConfiguratorServer.getInstance(),
            ModuleCommerceServer.getInstance(),
            ModuleProduitServer.getInstance(),
            ModuleClientServer.getInstance(),
            ModuleCommandeServer.getInstance(),
            ModuleAbonnementServer.getInstance(),
            ModulePaiementServer.getInstance(),
            ModuleCMSServer.getInstance(),
            ModuleVersionedServer.getInstance(),
            ModuleGeneratePDFServer.getInstance(),
            ModuleTranslationsImportServer.getInstance(),
            ModuleMaintenanceServer.getInstance()
        ];
    }
}