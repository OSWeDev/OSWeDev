/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250623InitTitresDashboards implements IGeneratorWorker {
    private static instance: Patch20250623InitTitresDashboards = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250623InitTitresDashboards';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250623InitTitresDashboards {
        if (!Patch20250623InitTitresDashboards.instance) {
            Patch20250623InitTitresDashboards.instance = new Patch20250623InitTitresDashboards();
        }
        return Patch20250623InitTitresDashboards.instance;
    }

    public async work(db: IDatabase<any>) {

        // Cas des nouveaux projets : si la table module_dashboardbuilder_dashboard n'existe pas, on ne fait rien
        const tableExists = await db.query("SELECT to_regclass('ref.module_dashboardbuilder_dashboard');");

        if (!tableExists || tableExists.length === 0 || !tableExists[0].to_regclass) {
            ConsoleHandler.log('Patch20250623InitTitresDashboards: Table "module_dashboardbuilder_dashboard" does not exist. Skipping patch.');
            return;
        }

        // 0 - Si le champs titre existe déjà, stop
        // 1 - Identifier tous les dashboards et pour chacun le code de trad actuel
        // 2 - Ajouter le champs titre dans la table et initialiser avec le code de trad actuel

        // En fait on checke d'abord l'existence de la colonne titre
        const columnExists = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'module_dashboardbuilder_dashboard' AND column_name = 'title';");

        if (columnExists && columnExists.length > 0) {
            ConsoleHandler.log('Patch20250623InitTitresDashboards: Column "title" already exists in "module_dashboardbuilder_dashboard". Skipping patch.');
            return;
        }

        // Ensuite, on fait un ajout de la colonne titre (format string tout simple mais non null) et on lui met bien le code de traduction actuel issu de la méthode suivante :
        // title = 'dashboard.name.' + this.id + '.___LABEL___';
        // On doit tout faire en une seule requete puisque si not null et actuellement on a des datas en base, on doit avoir une valeur par défaut
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard 
                ADD COLUMN title TEXT NOT NULL DEFAULT 'dashboard.name.0.___LABEL___';
            `);
        // Maintenant on met à jour les titres des dashboards existants
        const dashboards = await db.query("SELECT id FROM ref.module_dashboardbuilder_dashboard;");
        if (dashboards && dashboards.length > 0) {
            for (const dashboard of dashboards) {
                const id = dashboard.id;
                const title = `dashboard.name.${id}.___LABEL___`;
                await db.query("UPDATE ref.module_dashboardbuilder_dashboard SET title = $1 WHERE id = $2;", [title, id]);
            }
        }

        ConsoleHandler.log('Patch20250623InitTitresDashboards: Successfully added "title" column and initialized existing dashboards.');

        // et on supprime la valeur par défaut du champs
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard 
                ALTER COLUMN title DROP DEFAULT;
            `);
    }
}