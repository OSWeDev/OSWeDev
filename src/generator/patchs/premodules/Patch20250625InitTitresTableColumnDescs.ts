/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import DashboardBuilderController from '../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import DashboardPageWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import TableColumnDescVO from '../../../shared/modules/DashboardBuilder/vos/TableColumnDescVO';
import TableWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/TableWidgetOptionsVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250625InitTitresTableColumnDescs implements IGeneratorWorker {
    private static instance: Patch20250625InitTitresTableColumnDescs = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250625InitTitresTableColumnDescs';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250625InitTitresTableColumnDescs {
        if (!Patch20250625InitTitresTableColumnDescs.instance) {
            Patch20250625InitTitresTableColumnDescs.instance = new Patch20250625InitTitresTableColumnDescs();
        }
        return Patch20250625InitTitresTableColumnDescs.instance;
    }

    public async work(db: IDatabase<any>) {

        // Cas des nouveaux projets : si la table module_dashboardbuilder_table_column_desc n'existe pas, on ne fait rien
        const tableExists = await db.query("SELECT to_regclass('ref.module_dashboardbuilder_table_column_desc');");

        if (!tableExists || tableExists.length === 0 || !tableExists[0].to_regclass) {
            ConsoleHandler.log('Patch20250625InitTitresTableColumnDescs: Table "module_dashboardbuilder_table_column_desc" does not exist. Skipping patch.');
            return;
        }

        // 0 - Si le champs titre existe déjà, stop
        // 1 - Identifier tous les dashboards et pour chacun le code de trad actuel
        // 2 - Ajouter le champs titre dans la table et initialiser avec le code de trad actuel

        // En fait on checke d'abord l'existence de la colonne titre
        const columnExists = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'module_dashboardbuilder_table_column_desc' AND column_name = 'titre';");

        if (columnExists && columnExists.length > 0) {
            ConsoleHandler.log('Patch20250625InitTitresTableColumnDescs: Column "titre" already exists in "module_dashboardbuilder_table_column_desc". Skipping patch.');
            return;
        }

        // Ensuite, on fait un ajout de la colonne titre (format string tout simple mais non null) et on lui met bien le code de traduction actuel issu de la méthode suivante :
        // titre = 'dashboard.widget.name.' + this.id + '.___titre___';
        // On doit tout faire en une seule requete puisque si not null et actuellement on a des datas en base, on doit avoir une valeur par défaut
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_table_column_desc 
                ADD COLUMN titre TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.___titre___';
            `);

        // Alors pour les tablecolumndecs c'est des options dans un widget, donc on doit charger les widgets qui ont ce type d'options : TableWidgetOptionsVO/DashboardWidgetVO.WIDGET_NAME_datatable
        // On charge le widget DashboardWidgetVO.WIDGET_NAME_datatable, pour avoir son id dans la requete suivante
        const widget = (await db.query(`SELECT id FROM ref.module_dashboardbuilder_dashboard_widget WHERE name = '${DashboardWidgetVO.WIDGET_NAME_datatable}';`))[0];
        // On charge tous les pages_widgets de type DashboardWidgetVO.WIDGET_NAME_datatable
        const page_widgets = await db.query(`SELECT id, json_options FROM ref.module_dashboardbuilder_dashboard_pwidget WHERE widget_id = ${widget.id};`);

        // On boucle sur chaque widget
        for (const page_widget of page_widgets) {

            const current_options: TableWidgetOptionsVO = (page_widget && page_widget.json_options) ? JSON.parse(page_widget.json_options) as TableWidgetOptionsVO : null;
            if (!current_options || !current_options.columns) {
                ConsoleHandler.log(`Patch20250625InitTitresTableColumnDescs: No columns found in widget ${page_widget.id}. Skipping.`);
                continue;
            }

            const updated_columns_json = JSON.stringify(await this.update_titre_of_columns(current_options.columns, page_widget));

            // On met à jour le json_options du widget avec les colonnes mises à jour
            await db.query("UPDATE ref.module_dashboardbuilder_dashboard_pwidget SET json_options = $1 WHERE id = $2;", [updated_columns_json, page_widget.id]);
        }

        ConsoleHandler.log('Patch20250625InitTitresTableColumnDescs: Successfully added "titre" column and initialized existing table_column_desc.');

        // et on supprime la valeur par défaut du champs
        await db.query(`
            ALTER TABLE ref.module_dashboardbuilder_table_column_desc 
            ALTER COLUMN titre DROP DEFAULT;
        `);
    }

    /**
     * On retourne le JSON corrigé Pour réinégration soit dans le .children, soit en base pour les options du widget
     */
    private async update_titre_of_columns(columns: TableColumnDescVO[], page_widget: DashboardPageWidgetVO): Promise<TableColumnDescVO[]> {

        // On boucle sur les colonnes
        for (const column of columns) {
            // On vérifie si la colonne a un titre, sinon on lui met le code de traduction
            if (!column.titre) {

                let titre = null;

                if (column.custom_label) {
                    titre = column.custom_label;
                } else if ((!page_widget.id) || (column.type == null)) {
                    titre = '';
                } else {

                    titre = DashboardBuilderController.TableColumnDesc_NAME_CODE_PREFIX + page_widget.id + '.' + column.type + '.';

                    if (column.type == TableColumnDescVO.TYPE_crud_actions) {
                        titre += "_";
                    }

                    if (column.type == TableColumnDescVO.TYPE_vo_field_ref) {
                        titre += column.api_type_id + '.' + column.field_id;
                    }

                    if (column.type == TableColumnDescVO.TYPE_var_ref) {
                        titre += column.var_id + '.' + column.var_unicity_id;
                    }

                    if (column.type == TableColumnDescVO.TYPE_select_box) {
                        titre += "_";
                    }

                    if (column.type == TableColumnDescVO.TYPE_component) {
                        titre += column.component_name;
                    }

                    if (column.type == TableColumnDescVO.TYPE_header) {
                        titre += column.header_name;
                    }
                }
                column.titre = titre;
            }

            // Sachant que c'est récursif !! .children
            // Si par ailleurs ya des .children, on les traite aussi, récursivement
            if (column.children && column.children.length > 0) {
                column.children = await this.update_titre_of_columns(column.children, page_widget);
            }
        }

        // On retourne les colonnes corrigées
        return columns;
    }
}