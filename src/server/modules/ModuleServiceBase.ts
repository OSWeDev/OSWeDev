import { Express } from 'express';
import { IDatabase } from 'pg-promise';
import ModuleAPI from '../../shared/modules/API/ModuleAPI';
import ModuleAccessPolicy from '../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ModuleActionURL from '../../shared/modules/ActionURL/ModuleActionURL';
import ModuleAjaxCache from '../../shared/modules/AjaxCache/ModuleAjaxCache';
import ModuleAnimation from '../../shared/modules/Animation/ModuleAnimation';
import ModuleAnonymization from '../../shared/modules/Anonymization/ModuleAnonymization';
import ModuleAzureMemoryCheck from '../../shared/modules/AzureMemoryCheck/ModuleAzureMemoryCheck';
import ModuleBGThread from '../../shared/modules/BGThread/ModuleBGThread';
import ModuleCMS from '../../shared/modules/CMS/ModuleCMS';
import ModuleClockifyAPI from '../../shared/modules/ClockifyAPI/ModuleClockifyAPI';
import ModuleAbonnement from '../../shared/modules/Commerce/Abonnement/ModuleAbonnement';
import ModuleClient from '../../shared/modules/Commerce/Client/ModuleClient';
import ModuleCommande from '../../shared/modules/Commerce/Commande/ModuleCommande';
import ModuleCommerce from '../../shared/modules/Commerce/ModuleCommerce';
import ModulePaiement from '../../shared/modules/Commerce/Paiement/ModulePaiement';
import ModuleProduit from '../../shared/modules/Commerce/Produit/ModuleProduit';
import ModuleContextFilter from '../../shared/modules/ContextFilter/ModuleContextFilter';
import ModuleCron from '../../shared/modules/Cron/ModuleCron';
import ModuleDAO from '../../shared/modules/DAO/ModuleDAO';
import ModuleTableController from '../../shared/modules/DAO/ModuleTableController';
import ModuleDashboardBuilder from '../../shared/modules/DashboardBuilder/ModuleDashboardBuilder';
import ModuleDataExport from '../../shared/modules/DataExport/ModuleDataExport';
import ModuleDataImport from '../../shared/modules/DataImport/ModuleDataImport';
import ModuleDataRender from '../../shared/modules/DataRender/ModuleDataRender';
import ModuleDataSource from '../../shared/modules/DataSource/ModuleDataSource';
import ModuleDocument from '../../shared/modules/Document/ModuleDocument';
import ModuleEnvParam from '../../shared/modules/EnvParam/ModuleEnvParam';
import ModuleEvolizAPI from '../../shared/modules/EvolizAPI/ModuleEvolizAPI';
import ModuleExpressDBSessions from '../../shared/modules/ExpressDBSessions/ModuleExpressDBSessions';
import ModuleFacturationProAPI from '../../shared/modules/FacturationProAPI/ModuleFacturationProAPI';
import ModuleFeedback from '../../shared/modules/Feedback/ModuleFeedback';
import ModuleFile from '../../shared/modules/File/ModuleFile';
import ModuleFork from '../../shared/modules/Fork/ModuleFork';
import Dates from '../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleFormatDatesNombres from '../../shared/modules/FormatDatesNombres/ModuleFormatDatesNombres';
import ModuleGPT from '../../shared/modules/GPT/ModuleGPT';
import ModuleGeneratePDF from '../../shared/modules/GeneratePDF/ModuleGeneratePDF';
import ModuleImage from '../../shared/modules/Image/ModuleImage';
import ModuleImageFormat from '../../shared/modules/ImageFormat/ModuleImageFormat';
import ModuleMailer from '../../shared/modules/Mailer/ModuleMailer';
import ModuleMaintenance from '../../shared/modules/Maintenance/ModuleMaintenance';
import ModuleMenu from '../../shared/modules/Menu/ModuleMenu';
import Module from '../../shared/modules/Module';
import ModuleNFCConnect from '../../shared/modules/NFCConnect/ModuleNFCConnect';
import ModuleOselia from '../../shared/modules/Oselia/ModuleOselia';
import ModuleParams from '../../shared/modules/Params/ModuleParams';
import ModulePlayWright from '../../shared/modules/PlayWright/ModulePlayWright';
import ModulePopup from '../../shared/modules/Popup/ModulePopup';
import ModulePowershell from '../../shared/modules/Powershell/ModulePowershell';
import ModulePushData from '../../shared/modules/PushData/ModulePushData';
import ModuleRequest from '../../shared/modules/Request/ModuleRequest';
import ModuleSASSSkinConfigurator from '../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import ModuleSendInBlue from '../../shared/modules/SendInBlue/ModuleSendInBlue';
import ModuleStats from '../../shared/modules/Stats/ModuleStats';
import StatsController from '../../shared/modules/Stats/StatsController';
import ModuleSuiviCompetences from '../../shared/modules/SuiviCompetences/ModuleSuiviCompetences';
import ModuleSupervision from '../../shared/modules/Supervision/ModuleSupervision';
import ModuleSurvey from '../../shared/modules/Survey/ModuleSurvey';
import ModuleTableFieldTypes from '../../shared/modules/TableFieldTypes/ModuleTableFieldTypes';
import ModuleTeamsAPI from '../../shared/modules/TeamsAPI/ModuleTeamsAPI';
import ModuleTranslation from '../../shared/modules/Translation/ModuleTranslation';
import ModuleTranslationsImport from '../../shared/modules/Translation/import/ModuleTranslationsImport';
import ModuleTrigger from '../../shared/modules/Trigger/ModuleTrigger';
import ModuleUserLogVars from '../../shared/modules/UserLogVars/ModuleUserLogVars';
import ModuleVar from '../../shared/modules/Var/ModuleVar';
import ModuleVersioned from '../../shared/modules/Versioned/ModuleVersioned';
import ModuleVocus from '../../shared/modules/Vocus/ModuleVocus';
import ConsoleHandler from '../../shared/tools/ConsoleHandler';
import DBDisconnectionManager from '../../shared/tools/DBDisconnectionManager';
import { all_promises } from '../../shared/tools/PromiseTools';
import ThreadHandler from '../../shared/tools/ThreadHandler';
import ConfigurationService from '../env/ConfigurationService';
import ModuleAPIServer from './API/ModuleAPIServer';
import ModuleAccessPolicyServer from './AccessPolicy/ModuleAccessPolicyServer';
import ModuleActionURLServer from './ActionURL/ModuleActionURLServer';
import ModuleAjaxCacheServer from './AjaxCache/ModuleAjaxCacheServer';
import ModuleAnimationServer from './Animation/ModuleAnimationServer';
import ModuleAnonymizationServer from './Anonymization/ModuleAnonymizationServer';
import ModuleAzureMemoryCheckServer from './AzureMemoryCheck/ModuleAzureMemoryCheckServer';
import ModuleBGThreadServer from './BGThread/ModuleBGThreadServer';
import ModuleCMSServer from './CMS/ModuleCMSServer';
import ModuleClockifyAPIServer from './ClockifyAPI/ModuleClockifyAPIServer';
import ModuleAbonnementServer from './Commerce/Abonnement/ModuleAbonnementServer';
import ModuleClientServer from './Commerce/Client/ModuleClientServer';
import ModuleCommandeServer from './Commerce/Commande/ModuleCommandeServer';
import ModuleCommerceServer from './Commerce/ModuleCommerceServer';
import ModulePaiementServer from './Commerce/Paiement/ModulePaiementServer';
import ModuleProduitServer from './Commerce/Produit/ModuleProduitServer';
import ModuleContextFilterServer from './ContextFilter/ModuleContextFilterServer';
import ModuleCronServer from './Cron/ModuleCronServer';
import ModuleDAOServer from './DAO/ModuleDAOServer';
import ModuleDashboardBuilderServer from './DashboardBuilder/ModuleDashboardBuilderServer';
import ModuleDataExportServer from './DataExport/ModuleDataExportServer';
import ModuleDataImportServer from './DataImport/ModuleDataImportServer';
import ModuleDataRenderServer from './DataRender/ModuleDataRenderServer';
import ModuleDocumentServer from './Document/ModuleDocumentServer';
import ModuleEnvParamServer from './EnvParam/ModuleEnvParamServer';
import ModuleEvolizAPIServer from './EvolizAPI/ModuleEvolizAPIServer';
import ModuleExpressDBSessionServer from './ExpressDBSessions/ModuleExpressDBSessionsServer';
import ModuleFacturationProAPIServer from './FacturationProAPI/ModuleFacturationProAPIServer';
import ModuleFeedbackServer from './Feedback/ModuleFeedbackServer';
import ModuleFileServer from './File/ModuleFileServer';
import ModuleForkServer from './Fork/ModuleForkServer';
import ModuleFormatDatesNombresServer from './FormatDatesNombres/ModuleFormatDatesNombresServer';
import ModuleGPTServer from './GPT/ModuleGPTServer';
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
import ModuleOseliaServer from './Oselia/ModuleOseliaServer';
import ModuleParamsServer from './Params/ModuleParamsServer';
import ModulePlayWrightServer from './PlayWright/ModulePlayWrightServer';
import ModulePopupServer from './Popup/ModulePopupServer';
import ModulePowershellServer from './Powershell/ModulePowershellServer';
import PreloadedModuleServerController from './PreloadedModuleServerController';
import ModulePushDataServer from './PushData/ModulePushDataServer';
import ModuleRequestServer from './Request/ModuleRequestServer';
import ModuleSASSSkinConfiguratorServer from './SASSSkinConfigurator/ModuleSASSSkinConfiguratorServer';
import ModuleSendInBlueServer from './SendInBlue/ModuleSendInBlueServer';
import ModuleStatsServer from './Stats/ModuleStatsServer';
import ModuleSuiviCompetencesServer from './SuiviCompetences/ModuleSuiviCompetencesServer';
import ModuleSupervisionServer from './Supervision/ModuleSupervisionServer';
import ModuleSurveyServer from './Survey/ModuleSurveyServer';
import ModuleTeamsAPIServer from './TeamsAPI/ModuleTeamsAPIServer';
import ModuleTranslationServer from './Translation/ModuleTranslationServer';
import ModuleTranslationsImportServer from './Translation/import/ModuleTranslationsImportServer';
import ModuleTriggerServer from './Trigger/ModuleTriggerServer';
import ModuleUserLogVarsServer from './UserLogVars/ModuleUserLogVarsServer';
import ModuleVarServer from './Var/ModuleVarServer';
import ModuleVersionedServer from './Versioned/ModuleVersionedServer';
import ModuleVocusServer from './Vocus/ModuleVocusServer';
import ModuleAzureConnect from '../../shared/modules/AzureConnect/ModuleAzureConnect';
import ModuleAzureConnectServer from './AzureConnect/ModuleAzureConnectServer';

export default abstract class ModuleServiceBase {

    public static db;

    private static instance: ModuleServiceBase;

    /**
     * Local thread cache -----
     */
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

        ModuleServiceBase.db = {
            none: this.db_none.bind(this),
            one: this.db_one.bind(this),
            oneOrNone: this.db_oneOrNone.bind(this),
            query: this.db_query.bind(this),
            tx: (options, cb) => this.db_.tx(options, cb)
        };
    }

    get bdd_owner(): string {
        return ConfigurationService.node_configuration.bdd_owner;
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

    // istanbul ignore next: nothing to test
    public static getInstance(): ModuleServiceBase {
        return ModuleServiceBase.instance;
    }

    public isBaseSharedModule(module: Module): boolean {
        if (!module) {
            return false;
        }

        for (const i in this.registered_base_modules) {
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

        for (const i in this.login_base_modules) {
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

        for (const i in this.server_base_modules) {
            if (this.server_base_modules[i] == module) {
                return true;
            }
        }
        return false;
    }

    public async init_db(db: IDatabase<any>) {
        this.db_ = db;

        db.$pool.options.max = ConfigurationService.node_configuration.max_pool;
        db.$pool.options.idleTimeoutMillis = 120000;
    }

    public async register_all_modules(is_generator: boolean = false) {

        // // On charge le actif /inactif depuis la BDD pour surcharger à l'init la conf de l'appli
        // //  VALIDE UNIQUEMENT si le module est déjà créé en base, le activate_on_install est pas pris en compte....
        PreloadedModuleServerController.db = ModuleServiceBase.db;

        // On va créer la structure de base de la BDD pour les modules
        if ((!!is_generator) || (!ConfigurationService.node_configuration.server_start_booster)) {

            await this.create_modules_base_structure_in_db(this.db_);
        }

        await PreloadedModuleServerController.preload_modules_is_actif();

        this.registered_base_modules = this.getBaseModules();
        this.registered_child_modules = this.getChildModules();
        this.registered_modules = [].concat(this.registered_base_modules, this.registered_child_modules);

        this.login_base_modules = this.getLoginBaseModules();
        this.login_child_modules = this.getLoginChildModules();
        this.login_modules = [].concat(this.login_base_modules, this.login_child_modules);

        this.server_base_modules = this.getServerBaseModules();
        this.server_child_modules = this.getServerChildModules();
        this.server_modules = [].concat(this.server_base_modules, this.server_child_modules);

        ModuleTableController.initialize();
        ModuleTableDBService.getInstance(ModuleServiceBase.db);

        // En version SERVER_START_BOOSTER on check pas le format de la BDD au démarrage, le générateur s'en charge déjà en amont
        if ((!!is_generator) || (!ConfigurationService.node_configuration.server_start_booster)) {

            // On lance l'installation des modules.
            await this.install_modules();
        } else {

            if (ConfigurationService.node_configuration.debug_start_server) {
                ConsoleHandler.log('ModuleServiceBase:register_all_modules:load_or_create_module_is_actif:START');
            }
            for (const i in this.registered_modules) {
                const registered_module = this.registered_modules[i];

                await PreloadedModuleServerController.load_or_create_module_is_actif(registered_module);
            }
            if (ConfigurationService.node_configuration.debug_start_server) {
                ConsoleHandler.log('ModuleServiceBase:register_all_modules:load_or_create_module_is_actif:END');
            }
        }

        // On lance la configuration des modules, et avant on configure les apis des modules server
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ModuleServiceBase:register_all_modules:configure_server_modules_apis:START');
        }
        await this.configure_server_modules_apis();
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ModuleServiceBase:register_all_modules:configure_server_modules_apis:END');
        }

        // On charge le cache des tables segmentées. On cherche à être exhaustifs pour le coup
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ModuleServiceBase:register_all_modules:preload_segmented_known_databases:START');
        }
        await this.preload_segmented_known_databases();
        if (ConfigurationService.node_configuration.debug_start_server) {
            ConsoleHandler.log('ModuleServiceBase:register_all_modules:preload_segmented_known_databases:END');
        }

        // A mon avis c'est de la merde ça... on charge où la vérif des params, le hook install, ... ?
        // if ((!!is_generator) || (!ConfigurationService.node_configuration.server_start_booster)) {

        //     // On appelle le hook de configuration
        //     await this.configure_modules();

        // } else {

        for (const i in this.registered_modules) {
            const registered_module = this.registered_modules[i];

            if (!registered_module.actif) {
                continue;
            }

            // Sinon on doit juste appeler les hooks qui vont bien et le chargement des params + rechargement automatique
            if (!await registered_module.hook_module_configure()) {
                return false;
            }

            // On appelle le hook de fin d'installation
            await registered_module.hook_module_install();
        }
        // }

        for (const i in this.post_modules_installation_hooks) {
            const post_modules_installation_hook = this.post_modules_installation_hooks[i];

            // Appel async
            post_modules_installation_hook();
        }
    }

    public async configure_server_modules_apis() {
        for (const i in this.server_modules) {
            const server_module: ModuleServerBase = this.server_modules[i];

            if (server_module.actif) {
                server_module.registerServerApiHandlers();
                await server_module.configure();
            }
        }
    }

    public async preload_segmented_known_databases() {

        for (const i in this.registered_modules) {
            const module_: Module = this.registered_modules[i];

            if (!module_.actif) {
                continue;
            }
            for (const vo_type in ModuleTableController.vo_type_by_module_name[module_.name]) {
                const t = ModuleTableController.module_tables_by_vo_type[vo_type];

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
    public async configure_server_modules(app: Express, is_generator: boolean = false) {
        for (const i in this.server_modules) {
            const server_module: ModuleServerBase = this.server_modules[i];

            if (ConfigurationService.node_configuration.debug_start_server) {
                ConsoleHandler.log('configure_server_modules:server_module:' + server_module.name + ':START');
            }

            if (server_module.actif) {

                await all_promises([
                    server_module.registerAccessPolicies(is_generator),
                    server_module.registerAccessRoles(),
                    server_module.registerImport(),
                ]);

                if (ConfigurationService.node_configuration.debug_start_server) {
                    ConsoleHandler.log('configure_server_modules:server_module:' + server_module.name + ':registerCrons');
                }

                server_module.registerCrons();

                if (ConfigurationService.node_configuration.debug_start_server) {
                    ConsoleHandler.log('configure_server_modules:server_module:' + server_module.name + ':registerAccessHooks');
                }
                server_module.registerAccessHooks();

                if (app) {
                    if (ConfigurationService.node_configuration.debug_start_server) {
                        ConsoleHandler.log('configure_server_modules:server_module:' + server_module.name + ':registerExpressApis');
                    }
                    server_module.registerExpressApis(app);
                }
            }

            if (ConfigurationService.node_configuration.debug_start_server) {
                ConsoleHandler.log('configure_server_modules:server_module:' + server_module.name + ':END');
            }
        }
    }

    public async late_server_modules_configurations(is_generator: boolean) {
        for (const i in this.server_modules) {
            const server_module: ModuleServerBase = this.server_modules[i];

            if (server_module.actif) {
                await server_module.late_configuration(is_generator);
            }
        }
    }

    public get_modules_infos(env) {
        //  Si on a des sous-modules à définir pour front / admin / server, on peut le faire
        //      et en faisant le lien dans le typescript, on importera que le fichier qui nous est utile.
        return this.registered_modules;
    }

    public async handle_errors(
        error: Error,
        func_name: string,
        retry_hook_func: (...any) => Promise<any>,
        retry_hook_func_params: any[] = null) {

        const res = null;
        let sleep_id = 'ModuleServiceBase.handle_errors.'; // + func_name;
        let compteur_id = null; // func_name;
        if (error &&
            ((error['message'] == 'Connection terminated unexpectedly') ||
                (error['message'].startsWith('connect ETIMEDOUT ')))) {

            sleep_id += 'connect_error';
            compteur_id = 'connect_error';
        } else if (error && (error['message'] == 'canceling statement due to statement timeout')) {

            sleep_id += 'statement_timeout';
            compteur_id = 'statement_timeout';
        } else if (error && (error['message'] == 'sorry, too many clients already')) {

            sleep_id += 'too_many_clients';
            compteur_id = 'too_many_clients';
        } else if ((error['code'] == 'ENOTFOUND') && (error['errno'] == -3008)) {

            sleep_id += 'connect_error';
            compteur_id = 'connect_error';

            if (DBDisconnectionManager.instance) {
                DBDisconnectionManager.instance.mark_as_disconnected();
            }
        } else if ((error['code'] == 'ECONNRESET') && (error['errno'] == -4077)) {

            sleep_id += 'e_conn_reset';
            compteur_id = 'e_conn_reset';
        }

        if (compteur_id && sleep_id) {
            StatsController.register_stat_COMPTEUR(func_name, 'error', compteur_id);
            ConsoleHandler.error(error + ' - retrying in 100 ms');

            return new Promise(async (resolve, reject) => {

                await ThreadHandler.sleep(100, sleep_id, true);
                if (DBDisconnectionManager.instance) {
                    await DBDisconnectionManager.instance.wait_for_reconnection();
                }

                try {
                    const res_ = await retry_hook_func.call(this, ...retry_hook_func_params);
                    resolve(res_);
                } catch (error2) {
                    ConsoleHandler.error(error2 + ' - retry failed - ' + error2);
                    reject(error2);
                }
            });
        }

        ConsoleHandler.error(error);
        StatsController.register_stat_COMPTEUR(func_name, 'error', 'others');
        // On ne résoud rien donc on throw l'erreur
        throw error;
    }

    public async create_modules_base_structure_in_db(db: IDatabase<any>) {
        // On vérifie que la table des modules est disponible, sinon on la crée
        await db.none('CREATE SCHEMA IF NOT EXISTS admin;');
        await db.none("CREATE TABLE IF NOT EXISTS admin.modules (id bigserial NOT NULL, name varchar(255) not null, actif bool default false, CONSTRAINT modules_pkey PRIMARY KEY (id));");
        await db.none('GRANT ALL ON TABLE admin.modules TO ' + this.bdd_owner + ';');
    }

    protected getLoginChildModules(): Module[] {
        return [];
    }

    private async install_modules() {

        const queries_to_try_after_creation: string[] = [];
        for (const i in this.registered_modules) {
            const registered_module = this.registered_modules[i];

            try {
                await ModuleDBService.getInstance().module_install(
                    registered_module,
                    queries_to_try_after_creation,
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

        for (const i in queries_to_try_after_creation) {
            const query = queries_to_try_after_creation[i];
            try {
                ConsoleHandler.log('Executing query after modules installation : ' + query);
                await this.db_.none(query);
            } catch (e) {
                console.error(
                    "Erreur lors de l'exécution de la requête après l'installation des modules."
                );
                console.log(e);
                process.exit(0);
            }
        }

        console.log("Tous les modules ont été installés");
        return true;
    }

    private async configure_modules() {
        for (const i in this.registered_modules) {
            const registered_module = this.registered_modules[i];

            try {
                if (registered_module.actif) {
                    await ModuleDBService.getInstance().module_configure(
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
            ModuleContextFilter.getInstance(),
            ModuleSASSSkinConfigurator.getInstance(),
            ModuleVar.getInstance(),
            ModuleTableFieldTypes.getInstance(),
            ModuleBGThread.getInstance(),
            ModuleParams.getInstance(),
            ModuleAnonymization.getInstance(),
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
            ModuleEnvParam.getInstance(),
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
            ModuleSurvey.getInstance(),
            ModulePopup.getInstance(),
            ModuleRequest.getInstance(),
            ModuleDocument.getInstance(),
            ModuleFork.getInstance(),
            ModuleImageFormat.getInstance(),
            ModuleSupervision.getInstance(),
            ModuleTeamsAPI.getInstance(),
            ModuleAnimation.getInstance(),
            ModuleAnonymization.getInstance(),
            ModuleClockifyAPI.getInstance(),
            ModuleEvolizAPI.getInstance(),
            ModuleFacturationProAPI.getInstance(),
            ModulePowershell.getInstance(),
            ModuleNFCConnect.getInstance(),
            ModuleDashboardBuilder.getInstance(),
            ModuleMenu.getInstance(),
            ModuleStats.getInstance(),
            ModuleExpressDBSessions.getInstance(),
            ModuleUserLogVars.getInstance(),
            ModulePlayWright.getInstance(),
            ModuleActionURL.getInstance(),
            ModuleGPT.getInstance(),
            ModuleAzureMemoryCheck.getInstance(),
            ModuleOselia.getInstance(),
            ModuleSuiviCompetences.getInstance(),
            ModuleAzureConnect.getInstance(),
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
            ModuleTriggerServer.getInstance(),
            ModuleCronServer.getInstance(),
            ModuleEnvParamServer.getInstance(),
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
            ModuleSurveyServer.getInstance(),
            ModulePopupServer.getInstance(),
            ModuleRequestServer.getInstance(),
            ModuleDocumentServer.getInstance(),
            ModuleForkServer.getInstance(),
            ModuleImageFormatServer.getInstance(),
            ModuleSupervisionServer.getInstance(),
            ModuleTeamsAPIServer.getInstance(),
            ModuleAnimationServer.getInstance(),
            ModuleAnonymizationServer.getInstance(),
            ModuleClockifyAPIServer.getInstance(),
            ModuleEvolizAPIServer.getInstance(),
            ModuleFacturationProAPIServer.getInstance(),
            ModulePowershellServer.getInstance(),
            ModuleNFCConnectServer.getInstance(),
            ModuleDashboardBuilderServer.getInstance(),
            ModuleMenuServer.getInstance(),
            ModuleFormatDatesNombresServer.getInstance(),
            ModuleStatsServer.getInstance(),
            ModuleExpressDBSessionServer.getInstance(),
            ModuleUserLogVarsServer.getInstance(),
            ModulePlayWrightServer.getInstance(),
            ModuleActionURLServer.getInstance(),
            ModuleGPTServer.getInstance(),
            ModuleAzureMemoryCheckServer.getInstance(),
            ModuleOseliaServer.getInstance(),
            ModuleSuiviCompetencesServer.getInstance(),
            ModuleAzureConnectServer.getInstance(),
        ];
    }

    private async db_none(query: string, values?: []) {

        const time_in = Dates.now_ms();

        try {
            await this.db_.none(query, values);
        } catch (error) {

            return await this.handle_errors(error, 'db_none', this.db_none, [query, values]);
        }

        const time_out = Dates.now_ms();
        const duration = time_out - time_in;

        this.debug_slow_queries(query, values, duration);

        StatsController.register_stat_COMPTEUR('db_none', 'ok', '-');
        StatsController.register_stat_DUREE('db_none', 'ok', '-', duration);
    }

    private count_union_all_occurrences(query: string): number {
        const matches = query.match(/ union all /gi);
        return matches ? matches.length : 0;
    }

    private async db_query(query: string, values?: []) {

        let res = null;
        const time_in = Dates.now_ms();

        try {

            // On rajoute quelques contrôles de cohérence | des garde-fous simples mais qui protège d'une panne idiote
            // TODO FIXME ASAP : le pb c'est que ça génère potentiellement des vars à 0... donc il faut trouver le moyen de réactiver ces verrous, mais
            //  en les appliquant surtout en amont dans la création de la requete pour bloquer la création d'une requete trop grosse et qui ferait une erreur.
            //  Si la requete ne passe pas sur les vars, c'est pas une var interdite aujourd'hui, c'est un 0. il faut peut-etre réintroduire une var interdite pour les requetes trop grosses

            if (ConfigurationService.node_configuration.max_size_per_query && (query.length > ConfigurationService.node_configuration.max_size_per_query)) {

                // export query to txt file for debug
                const fs = require('fs');
                const path = require('path');
                const filename = path.join(__dirname, 'query_too_big_' + Math.round(Dates.now_ms()) + '.txt');
                fs.writeFile(filename, query);
                ConsoleHandler.error('Query too big (' + query.length + ' > ' + ConfigurationService.node_configuration.max_size_per_query + ') ' + query.substring(0, 1000) + '...');

                //     throw new Error('Query too big (' + query.length + ' > ' + ConfigurationService.node_configuration.max_size_per_query + ')');
            }

            if (ConfigurationService.node_configuration.max_union_all_per_query && (this.count_union_all_occurrences(query) > ConfigurationService.node_configuration.max_union_all_per_query)) {

                // export query to txt file for debug
                const fs = require('fs');
                const path = require('path');
                const filename = path.join(__dirname, 'too_many_union_all_' + Math.round(Dates.now_ms()) + '.txt');
                fs.writeFile(filename, query);
                ConsoleHandler.error('Too many union all (' + this.count_union_all_occurrences(query) + ' > ' + ConfigurationService.node_configuration.max_union_all_per_query + ') ' + query.substring(0, 1000) + '...');

                //     throw new Error('Too many union all (' + this.count_union_all_occurrences(query) + ' > ' + ConfigurationService.node_configuration.max_union_all_per_query + ')');
            }

            res = (values && values.length) ? await this.db_.query(query, values) : await this.db_.query(query);
        } catch (error) {

            return await this.handle_errors(error, 'db_query', this.db_query, [query, values]);
        }

        const time_out = Dates.now_ms();
        const duration = time_out - time_in;

        this.debug_slow_queries(query, values, duration);

        StatsController.register_stat_COMPTEUR('db_query', 'ok', '-');
        StatsController.register_stat_DUREE('db_query', 'time', '-', duration);

        return res;
    }

    private async db_one(query: string, values?: []) {

        /**
         * Handle query cache update
         */
        let res = null;
        const time_in = Dates.now_ms();

        try {
            res = await this.db_.one(query, values);
        } catch (error) {
            return await this.handle_errors(error, 'db_one', this.db_one, [query, values]);
        }

        const time_out = Dates.now_ms();
        const duration = time_out - time_in;

        this.debug_slow_queries(query, values, duration);

        StatsController.register_stat_COMPTEUR('db_one', 'ok', '-');
        StatsController.register_stat_DUREE('db_one', 'time', '-', duration);
        return res;
    }

    private async db_oneOrNone(query: string, values?: []) {

        /**
         * Handle query cache update
         */
        let res = null;
        const time_in = Dates.now_ms();

        try {
            res = await this.db_.oneOrNone(query, values);
        } catch (error) {
            return await this.handle_errors(error, 'db_oneOrNone', this.db_oneOrNone, [query, values]);
        }

        const time_out = Dates.now_ms();
        const duration = time_out - time_in;

        this.debug_slow_queries(query, values, duration);

        StatsController.register_stat_COMPTEUR('db_oneOrNone', 'ok', '-');
        StatsController.register_stat_DUREE('db_oneOrNone', 'time', '-', duration);
        return res;
    }

    private debug_slow_queries(query: string, values: any[], duration: number) {
        duration = Math.round(duration);
        let query_s = query + (values ? ' ------- ' + JSON.stringify(values) : '');
        query_s = (ConfigurationService.node_configuration.debug_db_full_query_perf ? query_s : query_s.substring(0, 1000));

        if (ConfigurationService.node_configuration.debug_slow_queries &&
            (duration > (10 * ConfigurationService.node_configuration.debug_slow_queries_ms_limit))) {
            ConsoleHandler.warn('DEBUG_SLOW_QUERIES;VERYSLOW;' + duration + ' ms;' + query_s);
        } else if (ConfigurationService.node_configuration.debug_slow_queries &&
            (duration > ConfigurationService.node_configuration.debug_slow_queries_ms_limit)) {
            ConsoleHandler.warn('DEBUG_SLOW_QUERIES;SLOW;' + duration + ' ms;' + query_s);
        }
    }

    protected abstract getServerChildModules(): ModuleServerBase[];
    protected abstract getChildModules(): Module[];
}