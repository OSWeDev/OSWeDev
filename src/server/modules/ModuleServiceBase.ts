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

export default abstract class ModuleServiceBase {

    public static getInstance(): ModuleServiceBase {
        return ModuleServiceBase.instance;
    }
    private static instance: ModuleServiceBase;

    private registered_modules: Module[] = [];
    private server_modules: ModuleServerBase[] = [];

    private registered_base_modules: Module[] = [];
    private server_base_modules: ModuleServerBase[] = [];

    protected registered_child_modules: Module[] = [];
    protected server_child_modules: ModuleServerBase[] = [];
    public db: IDatabase<any>;

    protected constructor() {
        ModuleServiceBase.instance = this;
    }

    get sharedModules(): Module[] {
        return this.registered_modules;
    }
    get serverModules(): ModuleServerBase[] {
        return this.server_modules;
    }

    public async register_all_modules(db: IDatabase<any>) {
        this.db = db;

        this.registered_base_modules = this.getBaseModules();
        this.registered_child_modules = this.getChildModules();
        this.registered_modules = [].concat(this.registered_base_modules, this.registered_child_modules);

        this.server_base_modules = this.getServerBaseModules();
        this.server_child_modules = this.getServerChildModules();
        this.server_modules = [].concat(this.server_base_modules, this.server_child_modules);

        await this.create_modules_base_structure_in_db();

        // On lance l'installation des modules.
        await this.install_modules();

        // On lance la configuration des modules, et avant on configure les apis des modules server
        this.configure_server_modules_apis();

        // On appelle le hook de configuration
        await this.configure_modules();
    }

    public configure_server_modules_apis() {
        for (let i in this.server_modules) {
            let server_module: ModuleServerBase = this.server_modules[i];

            if (server_module.actif) {
                server_module.registerApis();
            }
        }
    }

    public configure_server_modules(app: Express) {
        for (let i in this.server_modules) {
            let server_module: ModuleServerBase = this.server_modules[i];

            if (server_module.actif) {
                server_module.registerCrons();
                server_module.registerAccessHooks();
                server_module.registerExpressApis(app);
            }
        }
    }

    public get_modules_infos(env) {
        //  Si on a des sous-modules à définir pour front / admin / server, on peut le faire
        //      et en faisant le lien dans le typescript, on importera que le fichier qui nous est utile.
        return this.registered_modules;
    }
    private async create_modules_base_structure_in_db() {
        // On vérifie que la table des modules est disponible, sinon on la crée
        await this.db.none(
            "CREATE TABLE IF NOT EXISTS admin.modules (id bigserial NOT NULL, name varchar(255) not null, actif bool default false, CONSTRAINT modules_pkey PRIMARY KEY (id));"
        );
        await this.db.none("GRANT ALL ON TABLE admin.modules TO rocher;");
        await this.db.none(
            "GRANT SELECT, UPDATE, INSERT, DELETE ON TABLE admin.modules TO app_users;"
        );

        // On crée ensuite la vue pour NGA
        // console.log('Création de la vue NGA pour modules');
        await this.db.query(
            "CREATE OR REPLACE VIEW admin.view_modules AS \n SELECT v.id, v.name, v.actif FROM admin.modules v;"
        );

        // console.log('Droits de la vue NGA pour modules 1/3');
        await this.db.query("ALTER TABLE admin.view_modules OWNER TO rocher;");

        // console.log('Droits de la vue NGA pour modules 2/3');
        await this.db.query("GRANT ALL ON TABLE admin.view_modules TO rocher;");

        // console.log('Droits de la vue NGA pour modules 3/3');
        await this.db.query(
            "GRANT SELECT, UPDATE, INSERT, DELETE ON TABLE admin.view_modules TO app_users;"
        );

        let query =
            "CREATE OR REPLACE FUNCTION admin.trigger_modules() RETURNS trigger AS \n" +
            "$BODY$\n" +
            "DECLARE\n" +
            "BEGIN\n" +
            "IF TG_OP = 'INSERT'\n" +
            "THEN\n" +
            "INSERT INTO admin.modules (name, actif)\n" +
            "VALUES\n" +
            "(\n" +
            "new.name, new.actif" +
            ")\n" +
            "RETURNING id\n" +
            "INTO new.id;\n" +
            "RETURN new;\n" +
            "ELSIF TG_OP = 'UPDATE'\n" +
            "THEN\n" +
            "UPDATE admin.modules\n" +
            "SET\n" +
            "id   = new.id, " +
            "name = new.name, actif = new.actif\n" +
            "WHERE id = old.id;\n" +
            "RETURN new;\n" +
            "ELSIF TG_OP = 'DELETE'\n" +
            "THEN\n" +
            "DELETE FROM admin.modules\n" +
            "WHERE id = old.id;\n" +
            "RETURN old;\n" +
            "END IF;\n" +
            "RETURN NULL;\n" +
            "END;\n" +
            "$BODY$\n" +
            "LANGUAGE plpgsql VOLATILE\n" +
            "COST 100;";

        await this.db.query(query);
        await this.db.query(
            "ALTER FUNCTION admin.trigger_modules() OWNER TO rocher;\n"
        );

        try {
            await this.db.query(
                "CREATE TRIGGER trigger_modules" +
                " INSTEAD OF INSERT OR UPDATE OR DELETE ON admin.view_modules" +
                " FOR EACH ROW EXECUTE PROCEDURE admin.trigger_modules();"
            );
        } catch (error) {
            // On ignore les erreurs sur cette requetes pour éviter les messages systématiques à chaque démarrage...
        }
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

    private getBaseModules(): Module[] {
        return [
            ModuleAjaxCache.getInstance(),
            ModuleAPI.getInstance(),
            ModuleDAO.getInstance(),
            ModuleAccessPolicy.getInstance(),
            ModuleCron.getInstance(),
            ModuleTranslation.getInstance(),
            ModuleMailer.getInstance(),
            ModuleDataImport.getInstance(),
            ModuleDataExport.getInstance(),
            ModuleDataRender.getInstance()
        ];
    }

    private getServerBaseModules(): ModuleServerBase[] {
        return [
            ModuleAPIServer.getInstance(),
            ModuleDAOServer.getInstance(),
            ModuleAccessPolicyServer.getInstance(),
            ModuleTranslationServer.getInstance(),
            ModuleMailerServer.getInstance(),
            ModuleDataImportServer.getInstance(),
            ModuleDataExportServer.getInstance(),
            ModuleDataRenderServer.getInstance()
        ];
    }


    protected abstract getChildModules(): Module[];
    protected abstract getServerChildModules(): ModuleServerBase[];
}