/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250625InitTitresGroupeFiltresDashboardPages implements IGeneratorWorker {
    private static instance: Patch20250625InitTitresGroupeFiltresDashboardPages = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250625InitTitresGroupeFiltresDashboardPages';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250625InitTitresGroupeFiltresDashboardPages {
        if (!Patch20250625InitTitresGroupeFiltresDashboardPages.instance) {
            Patch20250625InitTitresGroupeFiltresDashboardPages.instance = new Patch20250625InitTitresGroupeFiltresDashboardPages();
        }
        return Patch20250625InitTitresGroupeFiltresDashboardPages.instance;
    }

    public async work(db: IDatabase<any>) {

        // Cas des nouveaux projets : si la table module_dashboardbuilder_dashboard_page n'existe pas, on ne fait rien
        const tableExists = await db.query("SELECT to_regclass('ref.module_dashboardbuilder_dashboard_page');");

        if (!tableExists || tableExists.length === 0 || !tableExists[0].to_regclass) {
            ConsoleHandler.log('Patch20250625InitTitresGroupeFiltresDashboardPages: Table "module_dashboardbuilder_dashboard_page" does not exist. Skipping patch.');
            return;
        }

        // 0 - Si le champs titre existe déjà, stop
        // 1 - Identifier tous les dashboards et pour chacun le code de trad actuel
        // 2 - Ajouter le champs titre dans la table et initialiser avec le code de trad actuel

        // En fait on checke d'abord l'existence de la colonne titre
        const columnExists = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'module_dashboardbuilder_dashboard_page' AND column_name = 'titre_groupe_filtres';");

        if (columnExists && columnExists.length > 0) {
            ConsoleHandler.log('Patch20250625InitTitresGroupeFiltresDashboardPages: Column "titre_groupe_filtres" already exists in "module_dashboardbuilder_dashboard_page". Skipping patch.');
            return;
        }

        // Ensuite, on fait un ajout de la colonne titre (format string tout simple mais non null) et on lui met bien le code de traduction actuel issu de la méthode suivante :
        // titre_groupe_filtres = 'dashboard.page.name.' + this.id + '.group_filters.___LABEL___';
        // On doit tout faire en une seule requete puisque si not null et actuellement on a des datas en base, on doit avoir une valeur par défaut
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_page 
                ADD COLUMN titre_groupe_filtres TEXT NOT NULL DEFAULT 'dashboard.page.name.0.group_filters.___LABEL___';
            `);
        // Maintenant on met à jour les titres des dashboards existants
        const dashboards = await db.query("SELECT id FROM ref.module_dashboardbuilder_dashboard_page;");
        if (dashboards && dashboards.length > 0) {
            for (const dashboard of dashboards) {
                const id = dashboard.id;
                const titre_groupe_filtres = `dashboard.page.name.${id}.group_filters.___LABEL___`;
                await db.query("UPDATE ref.module_dashboardbuilder_dashboard_page SET titre_groupe_filtres = $1 WHERE id = $2;", [titre_groupe_filtres, id]);
            }
        }

        ConsoleHandler.log('Patch20250625InitTitresGroupeFiltresDashboardPages: Successfully added "titre_groupe_filtres" column and initialized existing dashboards.');

        // et on supprime la valeur par défaut du champs
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_page 
                ALTER COLUMN titre_groupe_filtres DROP DEFAULT;
            `);
    }
}