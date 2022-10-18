import { Express } from 'express';
import { IDatabase } from 'pg-promise';
import ModuleAccessPolicy from '../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleAjaxCache from '../../shared/modules/AjaxCache/ModuleAjaxCache';
import ModuleAnimation from '../../shared/modules/Animation/ModuleAnimation';
import ModuleAnonymization from '../../shared/modules/Anonymization/ModuleAnonymization';
import ModuleAPI from '../../shared/modules/API/ModuleAPI';
import ModuleBGThread from '../../shared/modules/BGThread/ModuleBGThread';
import ModuleCMS from '../../shared/modules/CMS/ModuleCMS';
import ModuleAbonnement from '../../shared/modules/Commerce/Abonnement/ModuleAbonnement';
import ModuleClient from '../../shared/modules/Commerce/Client/ModuleClient';
import ModuleCommande from '../../shared/modules/Commerce/Commande/ModuleCommande';
import ModuleCommerce from '../../shared/modules/Commerce/ModuleCommerce';
import ModulePaiement from '../../shared/modules/Commerce/Paiement/ModulePaiement';
import ModuleProduit from '../../shared/modules/Commerce/Produit/ModuleProduit';
import ModuleContextFilter from '../../shared/modules/ContextFilter/ModuleContextFilter';
import ModuleCron from '../../shared/modules/Cron/ModuleCron';
import ModuleDAO from '../../shared/modules/DAO/ModuleDAO';
import ModuleDashboardBuilder from '../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import ModuleDataExport from '../../shared/modules/DataExport/ModuleDataExport';
import ModuleDataImport from '../../shared/modules/DataImport/ModuleDataImport';
import ModuleDataRender from '../../shared/modules/DataRender/ModuleDataRender';
import ModuleDataSource from '../../shared/modules/DataSource/ModuleDataSource';
import ModuleDocument from '../../shared/modules/Document/ModuleDocument';
import ModuleFacturationProAPI from '../../shared/modules/FacturationProAPI/ModuleFacturationProAPI';
import ModuleFeedback from '../../shared/modules/Feedback/ModuleFeedback';
import ModuleFile from '../../shared/modules/File/ModuleFile';
import ModuleFork from '../../shared/modules/Fork/ModuleFork';
import ModuleFormatDatesNombres from '../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import ModuleGeneratePDF from '../../shared/modules/GeneratePDF/ModuleGeneratePDF';
import ModuleImage from '../../shared/modules/Image/ModuleImage';
import ModuleImageFormat from '../../shared/modules/ImageFormat/ModuleImageFormat';
import ModuleMailer from '../../shared/modules/Mailer/ModuleMailer';
import ModuleMaintenance from '../../shared/modules/Maintenance/ModuleMaintenance';
import ModuleMenu from '../../shared/modules/Menu/ModuleMenu';
import Module from '../../shared/modules/Module';
import ModuleNFCConnect from '../../shared/modules/NFCConnect/ModuleNFCConnect';
import ModuleParams from '../../shared/modules/Params/ModuleParams';
import ModulePerfMon from '../../shared/modules/PerfMon/ModulePerfMon';
import ModulePowershell from '../../shared/modules/Powershell/ModulePowershell';
import ModulePushData from '../../shared/modules/PushData/ModulePushData';
import ModuleRequest from '../../shared/modules/Request/ModuleRequest';
import ModuleSASSSkinConfigurator from '../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import ModuleSendInBlue from '../../shared/modules/SendInBlue/ModuleSendInBlue';
import ModuleSupervision from '../../shared/modules/Supervision/ModuleSupervision';
import ModuleTableFieldTypes from '../../shared/modules/TableFieldTypes/ModuleTableFieldTypes';
import ModuleTeamsAPI from '../../shared/modules/TeamsAPI/ModuleTeamsAPI';
import ModuleTranslationsImport from '../../shared/modules/Translation/import/ModuleTranslationsImport';
import ModuleTranslation from '../../shared/modules/Translation/ModuleTranslation';
import ModuleTrigger from '../../shared/modules/Trigger/ModuleTrigger';
import ModuleVar from '../../shared/modules/Var/ModuleVar';
import ModuleVersioned from '../../shared/modules/Versioned/ModuleVersioned';
import ModuleVocus from '../../shared/modules/Vocus/ModuleVocus';
import ConsoleHandler from '../../shared/tools/ConsoleHandler';
import { all_promises } from '../../shared/tools/PromiseTools';
import ConfigurationService from '../env/ConfigurationService';
import ModuleAccessPolicyServer from './AccessPolicy/ModuleAccessPolicyServer';
import ModuleAjaxCacheServer from './AjaxCache/ModuleAjaxCacheServer';
import ModuleAnimationServer from './Animation/ModuleAnimationServer';
import ModuleAnonymizationServer from './Anonymization/ModuleAnonymizationServer';
import ModuleAPIServer from './API/ModuleAPIServer';
import ModuleBGThreadServer from './BGThread/ModuleBGThreadServer';
import ModuleCMSServer from './CMS/ModuleCMSServer';
import ModuleAbonnementServer from './Commerce/Abonnement/ModuleAbonnementServer';
import ModuleClientServer from './Commerce/Client/ModuleClientServer';
import ModuleCommandeServer from './Commerce/Commande/ModuleCommandeServer';
import ModuleCommerceServer from './Commerce/ModuleCommerceServer';
import ModulePaiementServer from './Commerce/Paiement/ModulePaiementServer';
import ModuleProduitServer from './Commerce/Produit/ModuleProduitServer';
import ModuleContextFilterServer from './ContextFilter/ModuleContextFilterServer';
import ModuleCronServer from './Cron/ModuleCronServer';
import DAOQueryCacheController from './DAO/DAOQueryCacheController';
import ModuleDAOServer from './DAO/ModuleDAOServer';
import ModuleDashboardBuilderServer from './DashboardBuilder/ModuleDashboardBuilderServer';
import ModuleDataExportServer from './DataExport/ModuleDataExportServer';
import ModuleDataImportServer from './DataImport/ModuleDataImportServer';
import ModuleDataRenderServer from './DataRender/ModuleDataRenderServer';
import ModuleDocumentServer from './Document/ModuleDocumentServer';
import ModuleFacturationProAPIServer from './FacturationProAPI/ModuleFacturationProAPIServer';
import ModuleFeedbackServer from './Feedback/ModuleFeedbackServer';
import ModuleFileServer from './File/ModuleFileServer';
import ModuleForkServer from './Fork/ModuleForkServer';
import ModuleFormatDatesNombresServer from './FormatDatesNombres/ModuleFormatDatesNombresServer';
import ModuleGeneratePDFServer from './GeneratePDF/ModuleGeneratePDFServer';
import ModuleImageServer from './Image/ModuleImageServer';
import ModuleImageFormatServer from './ImageFormat/ModuleImageFormatServer';
import ModuleMailerServer from './Mailer/ModuleMailerServer';
import ModuleMaintenanceServer from './Maintenance/ModuleMaintenanceServer';
import ModuleMenuServer from './Menu/ModuleMenuServer';
import ModuleDBService from './ModuleDBService';
import ModuleServerBase from './ModuleServerBase';
import ModuleTableDBService from './ModuleTableDBService';
import ModuleNFCConnectServer from './NFCConnect/ModuleNFCConnectServer';
import ModuleParamsServer from './Params/ModuleParamsServer';
import ModulePerfMonServer from './PerfMon/ModulePerfMonServer';
import ModulePowershellServer from './Powershell/ModulePowershellServer';
import ModulePushDataServer from './PushData/ModulePushDataServer';
import ModuleRequestServer from './Request/ModuleRequestServer';
import ModuleSASSSkinConfiguratorServer from './SASSSkinConfigurator/ModuleSASSSkinConfiguratorServer';
import ModuleSendInBlueServer from './SendInBlue/ModuleSendInBlueServer';
import ModuleSupervisionServer from './Supervision/ModuleSupervisionServer';
import ModuleTeamsAPIServer from './TeamsAPI/ModuleTeamsAPIServer';
import ModuleTranslationsImportServer from './Translation/import/ModuleTranslationsImportServer';
import ModuleTranslationServer from './Translation/ModuleTranslationServer';
import ModuleVarServer from './Var/ModuleVarServer';
import ModuleVersionedServer from './Versioned/ModuleVersionedServer';
import ModuleVocusServer from './Vocus/ModuleVocusServer';

export default abstract class ModuleServiceBase {

    public static getInstance(): ModuleServiceBase {
        return ModuleServiceBase.instance;
    }
    private static instance: ModuleServiceBase;

    /**
     * Local thread cache -----
     */
    public db;

    public post_modules_installation_hooks: Array<() => void> = [];

    protected registered_child_modules: Module[] = [];
    protected login_child_modules: Module[] = [];
    protected server_child_modules: ModuleServerBase[] = [];

    private registered_modules: Module[] = [];
    private login_modules: Module[] = [];
    private server_modules: ModuleServerBase[] = [];

    private registered_base_modules: Module[] = [];
    private login_base_modules: Module[] = [];
    private server_base_modules: ModuleServerBase[] = [];

    private db_: IDatabase<any>;
    /**
     * ----- Local thread cache
     */

    protected constructor() {
        ModuleServiceBase.instance = null;
        ModuleServiceBase.instance = this;

        this.db = {
            none: this.db_none.bind(this),
            oneOrNone: this.db_oneOrNone.bind(this),
            query: this.db_query.bind(this),
            tx: (options, cb) => this.db_.tx(options, cb)
        };
    }

    get bdd_owner(): string {
        return ConfigurationService.getInstance().node_configuration.BDD_OWNER;
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

    public async register_all_modules(db: IDatabase<any>, is_generator: boolean = false) {
        this.db_ = db;

        db.$pool.options.max = ConfigurationService.getInstance().node_configuration.MAX_POOL;
        db.$pool.options.idleTimeoutMillis = 120000;

        this.registered_base_modules = this.getBaseModules();
        this.registered_child_modules = this.getChildModules();
        this.registered_modules = [].concat(this.registered_base_modules, this.registered_child_modules);

        this.login_base_modules = this.getLoginBaseModules();
        this.login_child_modules = this.getLoginChildModules();
        this.login_modules = [].concat(this.login_base_modules, this.login_child_modules);

        this.server_base_modules = this.getServerBaseModules();
        this.server_child_modules = this.getServerChildModules();
        this.server_modules = [].concat(this.server_base_modules, this.server_child_modules);

        // On init le lien de db dans ces modules
        ModuleDBService.getInstance(db);
        ModuleTableDBService.getInstance(db);

        // En version SERVER_START_BOOSTER on check pas le format de la BDD au démarrage, le générateur s'en charge déjà en amont
        if ((!!is_generator) || (!ConfigurationService.getInstance().node_configuration.SERVER_START_BOOSTER)) {

            await this.create_modules_base_structure_in_db();

            // On lance l'installation des modules.
            await this.install_modules();
        } else {

            for (let i in this.registered_modules) {
                let registered_module = this.registered_modules[i];

                await ModuleDBService.getInstance(db).load_or_create_module_is_actif(registered_module);
            }
        }

        // On lance la configuration des modules, et avant on configure les apis des modules server
        await this.configure_server_modules_apis();
        // On charge le cache des tables segmentées. On cherche à être exhaustifs pour le coup
        await this.preload_segmented_known_databases();

        // A mon avis c'est de la merde ça... on charge où la vérif des params, le hook install, ... ?
        // if ((!!is_generator) || (!ConfigurationService.getInstance().node_configuration.SERVER_START_BOOSTER)) {

        //     // On appelle le hook de configuration
        //     await this.configure_modules();

        // } else {

        for (let i in this.registered_modules) {
            let registered_module = this.registered_modules[i];

            if (!registered_module.actif) {
                continue;
            }

            // Sinon on doit juste appeler les hooks qui vont bien et le chargement des params + rechargement automatique
            if (!await registered_module.hook_module_configure()) {
                return false;
            }

            // On lance le thread de reload de la conf toutes les X seconds, si il y a des paramètres
            if (registered_module.fields && (registered_module.fields.length > 0)) {

                await ModuleDBService.getInstance(db).loadParams(registered_module);

                ModuleDBService.getInstance(db).reloadParamsThread(registered_module).then().catch((error) => ConsoleHandler.getInstance().error(error));
            }

            // On appelle le hook de fin d'installation
            await registered_module.hook_module_install();
        }
        // }

        for (let i in this.post_modules_installation_hooks) {
            let post_modules_installation_hook = this.post_modules_installation_hooks[i];

            // Appel async
            post_modules_installation_hook();
        }
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

    public async preload_segmented_known_databases() {

        for (let i in this.registered_modules) {
            let module_: Module = this.registered_modules[i];

            if (!module_.actif) {
                continue;
            }
            for (let j in module_.datatables) {
                let t = module_.datatables[j];

                if (!t.is_segmented) {
                    continue;
                }

                await ModuleDAOServer.getInstance().preload_segmented_known_database(t);
            }
        }
    }

    /**
     * FIXME : pour le moment on est obligé de tout faire dans l'ordre, impossible de paraléliser à ce niveau
     *  puisque les rôles typiquement créés d'un côté peuvent être utilisés de l'autre ...
     */
    public async configure_server_modules(app: Express) {
        for (let i in this.server_modules) {
            let server_module: ModuleServerBase = this.server_modules[i];

            if (ConfigurationService.getInstance().node_configuration.DEBUG_START_SERVER) {
                ConsoleHandler.getInstance().log('configure_server_modules:server_module:' + server_module.name + ':START');
            }

            if (server_module.actif) {

                await all_promises([
                    server_module.registerAccessPolicies(),
                    server_module.registerAccessRoles(),
                    server_module.registerImport(),
                ]);

                if (ConfigurationService.getInstance().node_configuration.DEBUG_START_SERVER) {
                    ConsoleHandler.getInstance().log('configure_server_modules:server_module:' + server_module.name + ':registerCrons');
                }

                server_module.registerCrons();

                if (ConfigurationService.getInstance().node_configuration.DEBUG_START_SERVER) {
                    ConsoleHandler.getInstance().log('configure_server_modules:server_module:' + server_module.name + ':registerAccessHooks');
                }
                server_module.registerAccessHooks();

                if (app) {
                    if (ConfigurationService.getInstance().node_configuration.DEBUG_START_SERVER) {
                        ConsoleHandler.getInstance().log('configure_server_modules:server_module:' + server_module.name + ':registerExpressApis');
                    }
                    server_module.registerExpressApis(app);
                }
            }

            if (ConfigurationService.getInstance().node_configuration.DEBUG_START_SERVER) {
                ConsoleHandler.getInstance().log('configure_server_modules:server_module:' + server_module.name + ':END');
            }
        }
    }

    public async late_server_modules_configurations() {
        for (let i in this.server_modules) {
            let server_module: ModuleServerBase = this.server_modules[i];

            if (server_module.actif) {
                await server_module.late_configuration();
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
            ModuleBGThread.getInstance(),
            ModuleAnonymization.getInstance()
        ];
    }

    private getBaseModules(): Module[] {
        return [
            ModuleDAO.getInstance(),
            ModuleTranslation.getInstance(),
            ModuleAccessPolicy.getInstance(),
            ModulePerfMon.getInstance(),
            ModuleAPI.getInstance(),
            ModuleAjaxCache.getInstance(),
            ModuleFile.getInstance(),
            ModuleImage.getInstance(),
            ModuleTrigger.getInstance(),
            ModuleCron.getInstance(),
            ModuleDataSource.getInstance(),
            ModuleContextFilter.getInstance(),
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
            ModuleFork.getInstance(),
            ModuleImageFormat.getInstance(),
            ModuleSupervision.getInstance(),
            ModuleTeamsAPI.getInstance(),
            ModuleAnimation.getInstance(),
            ModuleAnonymization.getInstance(),
            ModuleFacturationProAPI.getInstance(),
            ModulePowershell.getInstance(),
            ModuleNFCConnect.getInstance(),
            ModuleDashboardBuilder.getInstance(),
            ModuleMenu.getInstance()
        ];
    }

    private getServerBaseModules(): ModuleServerBase[] {
        return [
            ModuleDAOServer.getInstance(),
            ModuleTranslationServer.getInstance(),
            ModuleAccessPolicyServer.getInstance(),
            ModulePerfMonServer.getInstance(),
            ModuleAPIServer.getInstance(),
            ModuleAjaxCacheServer.getInstance(),
            ModuleFileServer.getInstance(),
            ModuleImageServer.getInstance(),
            ModuleCronServer.getInstance(),
            ModuleContextFilterServer.getInstance(),
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
            ModuleForkServer.getInstance(),
            ModuleImageFormatServer.getInstance(),
            ModuleSupervisionServer.getInstance(),
            ModuleTeamsAPIServer.getInstance(),
            ModuleAnimationServer.getInstance(),
            ModuleAnonymizationServer.getInstance(),
            ModuleFacturationProAPIServer.getInstance(),
            ModulePowershellServer.getInstance(),
            ModuleNFCConnectServer.getInstance(),
            ModuleDashboardBuilderServer.getInstance(),
            ModuleMenuServer.getInstance(),
            ModuleFormatDatesNombresServer.getInstance()
        ];
    }

    private async db_none(query: string, values?: []) {

        /**
         * Handle query cache update
         */

        await DAOQueryCacheController.getInstance().invalidate_cache_from_query_or_return_result(query, values);

        return await this.db_.none(query, values);
    }

    private async db_query(query: string, values?: []) {

        /**
         * Handle query cache update
         */
        let res = await DAOQueryCacheController.getInstance().invalidate_cache_from_query_or_return_result(query, values);

        if (typeof res !== 'undefined') {
            return res;
        }

        res = await this.db_.query(query, values);

        DAOQueryCacheController.getInstance().save_cache_from_query_result(query, values, res);

        return res;
    }

    private async db_oneOrNone(query: string, values?: []) {

        /**
         * Handle query cache update
         */
        let res = await DAOQueryCacheController.getInstance().invalidate_cache_from_query_or_return_result(query, values);

        if (typeof res !== 'undefined') {
            return res;
        }

        res = await this.db_.oneOrNone(query, values);

        DAOQueryCacheController.getInstance().save_cache_from_query_result(query, values, res);

        return res;
    }
}