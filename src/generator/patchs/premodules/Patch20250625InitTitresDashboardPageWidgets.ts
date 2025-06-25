/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import DashboardBuilderController from '../../../shared/modules/DashboardBuilder/DashboardBuilderController';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FavoritesFiltersWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/FavoritesFiltersWidgetOptionsVO';
import FieldValueFilterWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/FieldValueFilterWidgetOptionsVO';
import SupervisionTypeWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/SupervisionTypeWidgetOptionsVO';
import SupervisionWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/SupervisionWidgetOptionsVO';
import TableWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/TableWidgetOptionsVO';
import VarMixedChartWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/VarMixedChartWidgetOptionsVO';
import VarPieChartWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/VarPieChartWidgetOptionsVO';
import VarRadarChartWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/VarRadarChartWidgetOptionsVO';
import VarWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/VarWidgetOptionsVO';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250625InitTitresDashboardPageWidgets implements IGeneratorWorker {
    private static instance: Patch20250625InitTitresDashboardPageWidgets = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250625InitTitresDashboardPageWidgets';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250625InitTitresDashboardPageWidgets {
        if (!Patch20250625InitTitresDashboardPageWidgets.instance) {
            Patch20250625InitTitresDashboardPageWidgets.instance = new Patch20250625InitTitresDashboardPageWidgets();
        }
        return Patch20250625InitTitresDashboardPageWidgets.instance;
    }

    public async work(db: IDatabase<any>) {

        // Cas des nouveaux projets : si la table module_dashboardbuilder_dashboard_pwidget n'existe pas, on ne fait rien
        const tableExists = await db.query("SELECT to_regclass('ref.module_dashboardbuilder_dashboard_pwidget');");

        if (!tableExists || tableExists.length === 0 || !tableExists[0].to_regclass) {
            ConsoleHandler.log('Patch20250625InitTitresDashboardPageWidgets: Table "module_dashboardbuilder_dashboard_pwidget" does not exist. Skipping patch.');
            return;
        }

        // 0 - Si le champs titre existe déjà, stop
        // 1 - Identifier tous les dashboards et pour chacun le code de trad actuel
        // 2 - Ajouter le champs titre dans la table et initialiser avec le code de trad actuel

        // En fait on checke d'abord l'existence de la colonne titre
        const columnExists = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'module_dashboardbuilder_dashboard_pwidget' AND column_name = 'titre';");

        if (columnExists && columnExists.length > 0) {
            ConsoleHandler.log('Patch20250625InitTitresDashboardPageWidgets: Column "titre" already exists in "module_dashboardbuilder_dashboard_pwidget". Skipping patch.');
            return;
        }

        // Ensuite, on fait un ajout de la colonne titre (format string tout simple mais non null) et on lui met bien le code de traduction actuel issu de la méthode suivante :
        // titre = 'dashboard.widget.name.' + this.id + '.___LABEL___';
        // On doit tout faire en une seule requete puisque si not null et actuellement on a des datas en base, on doit avoir une valeur par défaut
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN titre TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.___LABEL___';
            `);

        const widgets = await db.query("SELECT id, name FROM ref.module_dashboardbuilder_dashboard_widget;");
        const widgets_name_by_id: { [id: number]: string } = {};

        for (const widget of widgets) {
            widgets_name_by_id[widget.id] = widget.name;
        }


        // Maintenant on met à jour les titres des dashboards existants
        const pwidgets = await db.query("SELECT id, widget_id, page_id FROM ref.module_dashboardbuilder_dashboard_pwidget;");

        if (pwidgets && pwidgets.length > 0) {
            for (const pwidget of pwidgets) {
                const id = pwidget.id;

                // Petite subtilité fun, les titres de widgets étaient pas uniformisés ou centralisés, donc on doit différencier par type de widget
                const widget_name = widgets_name_by_id[pwidget.widget_id] || 'unknown_widget';
                let titre = null;
                switch (widget_name) {
                    case DashboardWidgetVO.WIDGET_NAME_savefavoritesfilters:
                    case DashboardWidgetVO.WIDGET_NAME_showfavoritesfilters:
                        titre = FavoritesFiltersWidgetOptionsVO.TITLE_CODE_PREFIX + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_supervision_type:
                        titre = SupervisionTypeWidgetOptionsVO.TITLE_CODE_PREFIX + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_supervision:
                        titre = SupervisionWidgetOptionsVO.TITLE_CODE_PREFIX + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_datatable:
                        titre = TableWidgetOptionsVO.TITLE_CODE_PREFIX + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_varmixedcharts:
                        titre = VarMixedChartWidgetOptionsVO.TITLE_CODE_PREFIX + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_varpiechart:
                        titre = VarPieChartWidgetOptionsVO.TITLE_CODE_PREFIX + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_varradarchart:
                        titre = VarRadarChartWidgetOptionsVO.TITLE_CODE_PREFIX + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_var:
                        const var_options: VarWidgetOptionsVO = pwidget.json_options ? JSON.parse(pwidget.json_options) as VarWidgetOptionsVO : null;
                        if ((!var_options) || (!var_options.var_id)) {
                            titre = `dashboard.page_widget.name.${id}.___LABEL___`; // Le osef est total en fait dans ce cas puisqu'on a pas de titre à la base
                            break;
                        }
                        titre = VarWidgetOptionsVO.TITLE_CODE_PREFIX + var_options.var_id + '.' + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_bulkops:
                        titre = 'BulkOpsWidgetOptions.title.' + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_checklist:
                        titre = 'ChecklistWidgetOptions.title.' + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_oseliathread:
                        titre = 'OseliaThreadWidgetOptions.title.' + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_pageswitch:
                        titre = 'PageSwitchWidgetOptions.title.' + pwidget.page_id + '.' + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_resetfilters:
                        titre = 'ResetFiltersWidgetOptions.title.' + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_validationfilters:
                        titre = 'ValidationFiltersWidgetOptions.title.' + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_varchoroplethchart:
                        titre = 'VarChoroplethChartWidgetOptions.title.' + pwidget.id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION;
                        break;


                    case DashboardWidgetVO.WIDGET_NAME_perfreportgraph:
                    case DashboardWidgetVO.WIDGET_NAME_oseliarungraphwidget:
                        titre = `dashboard.page_widget.name.${id}.___LABEL___`; // Le osef est total en fait dans ce cas puisqu'on a pas de titre à la base
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_fieldvaluefilter:
                    case DashboardWidgetVO.WIDGET_NAME_dowfilter:
                    case DashboardWidgetVO.WIDGET_NAME_monthfilter:
                    case DashboardWidgetVO.WIDGET_NAME_advanceddatefilter:
                    case DashboardWidgetVO.WIDGET_NAME_yearfilter:
                    case DashboardWidgetVO.WIDGET_NAME_currentuserfilter:
                        // Cas particulier le titre est le vo_filed_ref_vo...
                        const options: FieldValueFilterWidgetOptionsVO = pwidget.json_options ? JSON.parse(pwidget.json_options) as FieldValueFilterWidgetOptionsVO : null;
                        if ((!options) || (!options.vo_field_ref) || (!options.vo_field_ref.api_type_id) || (!options.vo_field_ref.field_id)) {
                            titre = `dashboard.page_widget.name.${id}.___LABEL___`; // Le osef est total en fait dans ce cas puisqu'on a pas de titre à la base
                            break;
                        }
                        titre = DashboardBuilderController.VOFIELDREF_NAME_CODE_PREFIX + id + '.' + options.vo_field_ref.api_type_id + '.' + options.vo_field_ref.field_id;
                        break;



                    default:
                        throw new Error(`Widget name "${widget_name}" is not supported for patching titles in DashboardPageWidgets.`);
                }

                await db.query("UPDATE ref.module_dashboardbuilder_dashboard_pwidget SET titre = $1 WHERE id = $2;", [titre, id]);
            }
        }

        ConsoleHandler.log('Patch20250625InitTitresDashboardPageWidgets: Successfully added "titre" column and initialized existing dashboard_pwidget.');

        // et on supprime la valeur par défaut du champs
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN titre DROP DEFAULT;
            `);
    }
}