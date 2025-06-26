/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import DashboardWidgetVO from '../../../shared/modules/DashboardBuilder/vos/DashboardWidgetVO';
import FieldValueFilterWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/FieldValueFilterWidgetOptionsVO';
import MonthFilterWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/MonthFilterWidgetOptionsVO';
import VarChartOptionsVO from '../../../shared/modules/DashboardBuilder/vos/VarChartOptionsVO';
import VarMixedChartWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/VarMixedChartWidgetOptionsVO';
import VarPieChartWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/VarPieChartWidgetOptionsVO';
import VarRadarChartWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/VarRadarChartWidgetOptionsVO';
import YearFilterWidgetOptionsVO from '../../../shared/modules/DashboardBuilder/vos/YearFilterWidgetOptionsVO';
import DefaultTranslationVO from '../../../shared/modules/Translation/vos/DefaultTranslationVO';
import ConsoleHandler from '../../../shared/tools/ConsoleHandler';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250625InitAutresTranslatablesDashboardPageWidgets implements IGeneratorWorker {
    private static instance: Patch20250625InitAutresTranslatablesDashboardPageWidgets = null;

    private constructor() { }
    get uid(): string {
        return 'Patch20250625InitAutresTranslatablesDashboardPageWidgets';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250625InitAutresTranslatablesDashboardPageWidgets {
        if (!Patch20250625InitAutresTranslatablesDashboardPageWidgets.instance) {
            Patch20250625InitAutresTranslatablesDashboardPageWidgets.instance = new Patch20250625InitAutresTranslatablesDashboardPageWidgets();
        }
        return Patch20250625InitAutresTranslatablesDashboardPageWidgets.instance;
    }

    public async work(db: IDatabase<any>) {

        // Cas des nouveaux projets : si la table module_dashboardbuilder_dashboard_pwidget n'existe pas, on ne fait rien
        const tableExists = await db.query("SELECT to_regclass('ref.module_dashboardbuilder_dashboard_pwidget');");

        if (!tableExists || tableExists.length === 0 || !tableExists[0].to_regclass) {
            ConsoleHandler.log('Patch20250625InitAutresTranslatablesDashboardPageWidgets: Table "module_dashboardbuilder_dashboard_pwidget" does not exist. Skipping patch.');
            return;
        }

        // 0 - Si le champs placeholder existe déjà, stop
        // 1 - Identifier tous les dashboards et pour chacun le code de trad actuel
        // 2 - Ajouter le champs placeholder dans la table et initialiser avec le code de trad actuel

        // En fait on checke d'abord l'existence de la colonne placeholder
        const columnExists = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'module_dashboardbuilder_dashboard_pwidget' AND column_name = 'placeholder';");

        if (columnExists && columnExists.length > 0) {
            ConsoleHandler.log('Patch20250625InitAutresTranslatablesDashboardPageWidgets: Column "placeholder" already exists in "module_dashboardbuilder_dashboard_pwidget". Skipping patch.');
            return;
        }

        // Ensuite, on fait un ajout de la colonne placeholder (format string tout simple mais non null) et on lui met bien le code de traduction actuel issu de la méthode suivante :
        // placeholder = 'dashboard.widget.name.' + this.id + '.___LABEL___';
        // On doit tout faire en une seule requete puisque si not null et actuellement on a des datas en base, on doit avoir une valeur par défaut
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN placeholder TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.___LABEL___';
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN advanced_mode_placeholder TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.___LABEL___';
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN var_1_titre TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.var_1.___LABEL___';
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN var_2_titre TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.var_2.___LABEL___';
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN var_3_titre TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.var_3.___LABEL___';
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN var_4_titre TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.var_4.___LABEL___';
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN var_5_titre TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.var_5.___LABEL___';
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN var_6_titre TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.var_6.___LABEL___';
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN var_7_titre TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.var_7.___LABEL___';
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN var_8_titre TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.var_8.___LABEL___';
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN var_9_titre TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.var_9.___LABEL___';
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN var_10_titre TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.var_10.___LABEL___';
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN var_11_titre TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.var_11.___LABEL___';
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ADD COLUMN var_12_titre TEXT NOT NULL DEFAULT 'dashboard.widget.name.0.var_12.___LABEL___';
            `);


        const widgets = await db.query("SELECT id, name FROM ref.module_dashboardbuilder_dashboard_widget;");
        const widgets_name_by_id: { [id: number]: string } = {};

        for (const widget of widgets) {
            widgets_name_by_id[widget.id] = widget.name;
        }


        // Maintenant on met à jour les placeholders des dashboards existants
        const pwidgets = await db.query("SELECT id, widget_id, page_id, json_options FROM ref.module_dashboardbuilder_dashboard_pwidget;");

        if (pwidgets && pwidgets.length > 0) {
            for (const pwidget of pwidgets) {
                const id = pwidget.id;

                // Petite subtilité fun, les placeholders de widgets étaient pas uniformisés ou centralisés, donc on doit différencier par type de widget
                const widget_name = widgets_name_by_id[pwidget.widget_id] || 'unknown_widget';
                let placeholder = null;
                let advanced_mode_placeholder = null;

                const var_titres: string[] = [
                ];

                switch (widget_name) {
                    case DashboardWidgetVO.WIDGET_NAME_savefavoritesfilters:
                    case DashboardWidgetVO.WIDGET_NAME_showfavoritesfilters:
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_supervision_type:
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_supervision:
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_datatable:
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_varmixedcharts:

                        const var_mixed_options: VarMixedChartWidgetOptionsVO = pwidget.json_options ? JSON.parse(pwidget.json_options) as VarMixedChartWidgetOptionsVO : null;
                        if ((!var_mixed_options) || (!var_mixed_options.var_charts_options) || (!var_mixed_options.var_charts_options.length)) {
                            break;
                        }

                        let var_mixed_options___var_charts_options = var_mixed_options.var_charts_options;
                        try {
                            if (typeof var_mixed_options___var_charts_options === 'string') {
                                var_mixed_options___var_charts_options = JSON.parse(var_mixed_options___var_charts_options) as VarChartOptionsVO[];
                            }
                        } catch (error) {
                            ConsoleHandler.error(`Error parsing var_charts_options for widget ${pwidget.id}:`, error);
                            throw new Error(`Invalid var_charts_options format for widget ${pwidget.id}.`);
                        }

                        for (const key in var_mixed_options___var_charts_options) {
                            const var_chart_options = var_mixed_options___var_charts_options[key];

                            var_titres.push(VarMixedChartWidgetOptionsVO.TITLE_CODE_PREFIX + var_chart_options.var_id + '.' + id + '.' + var_chart_options.chart_id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION);
                        }
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_varpiechart:
                        const VarPieChartWidgetOptionsVO_: VarPieChartWidgetOptionsVO = pwidget.json_options ? JSON.parse(pwidget.json_options) as VarPieChartWidgetOptionsVO : null;
                        if (!VarPieChartWidgetOptionsVO_) {
                            break;
                        }

                        var_titres.push(VarPieChartWidgetOptionsVO.TITLE_CODE_PREFIX + (VarPieChartWidgetOptionsVO_.var_id_1 ? VarPieChartWidgetOptionsVO_.var_id_1 : '1') + '.' + id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION);
                        var_titres.push(VarPieChartWidgetOptionsVO.TITLE_CODE_PREFIX + (VarPieChartWidgetOptionsVO_.var_id_2 ? VarPieChartWidgetOptionsVO_.var_id_2 : '2') + '.' + id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION);
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_varradarchart:
                        const VarRadarChartWidgetOptionsVO_: VarRadarChartWidgetOptionsVO = pwidget.json_options ? JSON.parse(pwidget.json_options) as VarRadarChartWidgetOptionsVO : null;
                        if (!VarRadarChartWidgetOptionsVO_) {
                            break;
                        }

                        var_titres.push(VarRadarChartWidgetOptionsVO.TITLE_CODE_PREFIX + (VarRadarChartWidgetOptionsVO_.var_id_1 ? VarRadarChartWidgetOptionsVO_.var_id_1 : '1') + '.' + id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION);
                        var_titres.push(VarRadarChartWidgetOptionsVO.TITLE_CODE_PREFIX + (VarRadarChartWidgetOptionsVO_.var_id_2 ? VarRadarChartWidgetOptionsVO_.var_id_2 : '2') + '.' + id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION);
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_var:
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_bulkops:
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_checklist:
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_oseliathread:
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_pageswitch:
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_resetfilters:
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_validationfilters:
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_varchoroplethchart:
                        const VarChoroplethChartWidgetOptions_ = pwidget.json_options ? JSON.parse(pwidget.json_options) : null;
                        if (!VarChoroplethChartWidgetOptions_) {
                            break;
                        }

                        var_titres.push('VarChoroplethChartWidgetOptions.title.' + (VarChoroplethChartWidgetOptions_.var_id_1 ? VarChoroplethChartWidgetOptions_.var_id_1 : '1') + '.' + id + DefaultTranslationVO.DEFAULT_LABEL_EXTENSION);
                        break;


                    case DashboardWidgetVO.WIDGET_NAME_perfreportgraph:
                    case DashboardWidgetVO.WIDGET_NAME_oseliarungraphwidget:
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_fieldvaluefilter:
                        const FieldValueFilterWidgetOptionsVO_: FieldValueFilterWidgetOptionsVO = pwidget.json_options ? JSON.parse(pwidget.json_options) : null;
                        if ((!FieldValueFilterWidgetOptionsVO_) || (!FieldValueFilterWidgetOptionsVO_.vo_field_ref) || (!FieldValueFilterWidgetOptionsVO_.vo_field_ref.api_type_id) || (!FieldValueFilterWidgetOptionsVO_.vo_field_ref.field_id)) {
                            break;
                        }

                        placeholder = FieldValueFilterWidgetOptionsVO.VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX + id + '.' + FieldValueFilterWidgetOptionsVO_.vo_field_ref.api_type_id + '.' + FieldValueFilterWidgetOptionsVO_.vo_field_ref.field_id;
                        advanced_mode_placeholder = FieldValueFilterWidgetOptionsVO.VO_FIELD_REF_ADVANCED_MODE_PLACEHOLDER_CODE_PREFIX + id + '.' + FieldValueFilterWidgetOptionsVO_.vo_field_ref.api_type_id + '.' + FieldValueFilterWidgetOptionsVO_.vo_field_ref.field_id;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_dowfilter:
                        const DOWFilterWidgetOptions_ = pwidget.json_options ? JSON.parse(pwidget.json_options) : null;
                        if ((!DOWFilterWidgetOptions_) || (!DOWFilterWidgetOptions_.vo_field_ref) || (!DOWFilterWidgetOptions_.vo_field_ref.api_type_id) || (!DOWFilterWidgetOptions_.vo_field_ref.field_id)) {
                            break;
                        }

                        placeholder = 'DOWFilterWidgetOptions.vo_field_ref.placeholder.' + id + '.' + DOWFilterWidgetOptions_.vo_field_ref.api_type_id + '.' + DOWFilterWidgetOptions_.vo_field_ref.field_id;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_monthfilter:
                        const MonthFilterWidgetOptionsVO_: MonthFilterWidgetOptionsVO = pwidget.json_options ? JSON.parse(pwidget.json_options) : null;
                        if ((!MonthFilterWidgetOptionsVO_) || (!MonthFilterWidgetOptionsVO_.vo_field_ref) || (!MonthFilterWidgetOptionsVO_.vo_field_ref.api_type_id) || (!MonthFilterWidgetOptionsVO_.vo_field_ref.field_id)) {
                            break;
                        }

                        placeholder = MonthFilterWidgetOptionsVO.VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX + id + '.' + MonthFilterWidgetOptionsVO_.vo_field_ref.api_type_id + '.' + MonthFilterWidgetOptionsVO_.vo_field_ref.field_id;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_advanceddatefilter:
                        const AdvancedDateFilterWidgetOptions_ = pwidget.json_options ? JSON.parse(pwidget.json_options) : null;
                        if ((!AdvancedDateFilterWidgetOptions_) || (!AdvancedDateFilterWidgetOptions_.vo_field_ref) || (!AdvancedDateFilterWidgetOptions_.vo_field_ref.api_type_id) || (!AdvancedDateFilterWidgetOptions_.vo_field_ref.field_id)) {
                            break;
                        }

                        placeholder = 'AdvancedDateFilterWidgetOptions.vo_field_ref.placeholder.' + id + '.' + AdvancedDateFilterWidgetOptions_.vo_field_ref.api_type_id + '.' + AdvancedDateFilterWidgetOptions_.vo_field_ref.field_id;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_yearfilter:
                        const YearFilterWidgetOptionsVO_: YearFilterWidgetOptionsVO = pwidget.json_options ? JSON.parse(pwidget.json_options) : null;
                        if ((!YearFilterWidgetOptionsVO_) || (!YearFilterWidgetOptionsVO_.vo_field_ref) || (!YearFilterWidgetOptionsVO_.vo_field_ref.api_type_id) || (!YearFilterWidgetOptionsVO_.vo_field_ref.field_id)) {
                            break;
                        }

                        placeholder = YearFilterWidgetOptionsVO.VO_FIELD_REF_PLACEHOLDER_CODE_PREFIX + id + '.' + YearFilterWidgetOptionsVO_.vo_field_ref.api_type_id + '.' + YearFilterWidgetOptionsVO_.vo_field_ref.field_id;
                        break;

                    case DashboardWidgetVO.WIDGET_NAME_currentuserfilter:
                        break;



                    default:
                        throw new Error(`Widget name "${widget_name}" is not supported for patching titles in DashboardPageWidgets.`);
                }

                if (placeholder) {
                    await db.query("UPDATE ref.module_dashboardbuilder_dashboard_pwidget SET placeholder = $1 WHERE id = $2;", [placeholder, id]);
                }

                if (advanced_mode_placeholder) {
                    await db.query("UPDATE ref.module_dashboardbuilder_dashboard_pwidget SET advanced_mode_placeholder = $1 WHERE id = $2;", [advanced_mode_placeholder, id]);
                }

                // On ajoute les titres des vars
                if (var_titres && var_titres.length > 0) {
                    for (const i in var_titres) {
                        const var_titre = var_titres[i];
                        if (!var_titre) {
                            continue;
                        }
                        await db.query("UPDATE ref.module_dashboardbuilder_dashboard_pwidget SET " + 'var_' + (parseInt(i) + 1) + '_titre' + " = $1 WHERE id = $2;", [var_titre, id]);
                    }
                }
            }
        }

        ConsoleHandler.log('Patch20250625InitAutresTranslatablesDashboardPageWidgets: Successfully added "placeholder" and other columns and initialized existing dashboard_pwidget.');

        // et on supprime la valeur par défaut du champs
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN placeholder DROP DEFAULT;
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN advanced_mode_placeholder DROP DEFAULT;
            `);

        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN var_1_titre DROP DEFAULT;
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN var_2_titre DROP DEFAULT;
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN var_3_titre DROP DEFAULT;
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN var_4_titre DROP DEFAULT;
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN var_5_titre DROP DEFAULT;
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN var_6_titre DROP DEFAULT;
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN var_7_titre DROP DEFAULT;
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN var_8_titre DROP DEFAULT;
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN var_9_titre DROP DEFAULT;
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN var_10_titre DROP DEFAULT;
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN var_11_titre DROP DEFAULT;
            `);
        await db.query(`
                ALTER TABLE ref.module_dashboardbuilder_dashboard_pwidget 
                ALTER COLUMN var_12_titre DROP DEFAULT;
            `);

    }
}