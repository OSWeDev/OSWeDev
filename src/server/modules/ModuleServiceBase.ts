import { Express } from 'express';
import { IDatabase } from 'pg-promise';
import ModuleAccessPolicy from '../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleAjaxCache from '../../shared/modules/AjaxCache/ModuleAjaxCache';
import ModuleAPI from '../../shared/modules/API/ModuleAPI';
import ModuleBGThread from '../../shared/modules/BGThread/ModuleBGThread';
import ModuleCMS from '../../shared/modules/CMS/ModuleCMS';
import ModuleAbonnement from '../../shared/modules/Commerce/Abonnement/ModuleAbonnement';
import ModuleClient from '../../shared/modules/Commerce/Client/ModuleClient';
import ModuleCommande from '../../shared/modules/Commerce/Commande/ModuleCommande';
import ModuleCommerce from '../../shared/modules/Commerce/ModuleCommerce';
import ModulePaiement from '../../shared/modules/Commerce/Paiement/ModulePaiement';
import ModuleProduit from '../../shared/modules/Commerce/Produit/ModuleProduit';
import ModuleCron from '../../shared/modules/Cron/ModuleCron';
import ModuleDAO from '../../shared/modules/DAO/ModuleDAO';
import ModuleDataExport from '../../shared/modules/DataExport/ModuleDataExport';
import ModuleDataImport from '../../shared/modules/DataImport/ModuleDataImport';
import ModuleDataRender from '../../shared/modules/DataRender/ModuleDataRender';
import ModuleDataSource from '../../shared/modules/DataSource/ModuleDataSource';
import ModuleFile from '../../shared/modules/File/ModuleFile';
import ModuleFormatDatesNombres from '../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import ModuleGeneratePDF from '../../shared/modules/GeneratePDF/ModuleGeneratePDF';
import ModuleImage from '../../shared/modules/Image/ModuleImage';
import ModuleMailer from '../../shared/modules/Mailer/ModuleMailer';
import ModuleMaintenance from '../../shared/modules/Maintenance/ModuleMaintenance';
import Module from '../../shared/modules/Module';
import ModuleParams from '../../shared/modules/Params/ModuleParams';
import ModulePushData from '../../shared/modules/PushData/ModulePushData';
import ModuleSASSSkinConfigurator from '../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import ModuleSendInBlue from '../../shared/modules/SendInBlue/ModuleSendInBlue';
import ModuleTableFieldTypes from '../../shared/modules/TableFieldTypes/ModuleTableFieldTypes';
import ModuleTranslationsImport from '../../shared/modules/Translation/import/ModuleTranslationsImport';
import ModuleTranslation from '../../shared/modules/Translation/ModuleTranslation';
import ModuleTrigger from '../../shared/modules/Trigger/ModuleTrigger';
import ModuleVar from '../../shared/modules/Var/ModuleVar';
import ModuleVersioned from '../../shared/modules/Versioned/ModuleVersioned';
import ModuleVocus from '../../shared/modules/Vocus/ModuleVocus';
import ConfigurationService from '../env/ConfigurationService';
import ModuleAccessPolicyServer from './AccessPolicy/ModuleAccessPolicyServer';
import ModuleAjaxCacheServer from './AjaxCache/ModuleAjaxCacheServer';
import ModuleAPIServer from './API/ModuleAPIServer';
import ModuleBGThreadServer from './BGThread/ModuleBGThreadServer';
import ModuleCMSServer from './CMS/ModuleCMSServer';
import ModuleAbonnementServer from './Commerce/Abonnement/ModuleAbonnementServer';
import ModuleClientServer from './Commerce/Client/ModuleClientServer';
import ModuleCommandeServer from './Commerce/Commande/ModuleCommandeServer';
import ModuleCommerceServer from './Commerce/ModuleCommerceServer';
import ModulePaiementServer from './Commerce/Paiement/ModulePaiementServer';
import ModuleProduitServer from './Commerce/Produit/ModuleProduitServer';
import ModuleCronServer from './Cron/ModuleCronServer';
import ModuleDAOServer from './DAO/ModuleDAOServer';
import ModuleDataExportServer from './DataExport/ModuleDataExportServer';
import ModuleDataImportServer from './DataImport/ModuleDataImportServer';
import ModuleDataRenderServer from './DataRender/ModuleDataRenderServer';
import ModuleFileServer from './File/ModuleFileServer';
import ModuleGeneratePDFServer from './GeneratePDF/ModuleGeneratePDFServer';
import ModuleImageServer from './Image/ModuleImageServer';
import ModuleMailerServer from './Mailer/ModuleMailerServer';
import ModuleMaintenanceServer from './Maintenance/ModuleMaintenanceServer';
import ModuleDBService from './ModuleDBService';
import ModuleServerBase from './ModuleServerBase';
import ModuleParamsServer from './Params/ModuleParamsServer';
import ModulePushDataServer from './PushData/ModulePushDataServer';
import ModuleSASSSkinConfiguratorServer from './SASSSkinConfigurator/ModuleSASSSkinConfiguratorServer';
import ModuleSendInBlueServer from './SendInBlue/ModuleSendInBlueServer';
import ModuleTranslationsImportServer from './Translation/import/ModuleTranslationsImportServer';
import ModuleTranslationServer from './Translation/ModuleTranslationServer';
import ModuleVarServer from './Var/ModuleVarServer';
import ModuleVersionedServer from './Versioned/ModuleVersionedServer';
import ModuleVocusServer from './Vocus/ModuleVocusServer';
import ModuleFeedback from '../../shared/modules/Feedback/ModuleFeedback';
import ModuleFeedbackServer from './Feedback/ModuleFeedbackServer';
import ModuleRequest from '../../shared/modules/Request/ModuleRequest';
import ModuleRequestServer from './Request/ModuleRequestServer';
import ModuleDocument from '../../shared/modules/Document/ModuleDocument';
import ModuleDocumentServer from './Document/ModuleDocumentServer';

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
        ModuleServiceBase.instance = null;
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
            ModuleTableFieldTypes.getInstance(),
            ModuleBGThread.getInstance()
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
            ModuleMaintenance.getInstance(),
            ModuleTableFieldTypes.getInstance(),
            ModuleBGThread.getInstance(),
            ModuleParams.getInstance(),
            ModuleSendInBlue.getInstance(),
            ModuleVocus.getInstance(),
            ModuleFeedback.getInstance(),
            ModuleRequest.getInstance(),
            ModuleDocument.getInstance(),
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
            ModuleMaintenanceServer.getInstance(),
            ModuleBGThreadServer.getInstance(),
            ModuleParamsServer.getInstance(),
            ModuleSendInBlueServer.getInstance(),
            ModuleVocusServer.getInstance(),
            ModuleFeedbackServer.getInstance(),
            ModuleRequestServer.getInstance(),
            ModuleDocumentServer.getInstance(),
        ];
    }
}