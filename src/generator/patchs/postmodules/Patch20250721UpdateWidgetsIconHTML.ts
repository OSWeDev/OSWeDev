/* istanbul ignore file: no unit tests on patchs */

import { IDatabase } from 'pg-promise';
import IGeneratorWorker from '../../IGeneratorWorker';

export default class Patch20250721UpdateWidgetsIconHTML implements IGeneratorWorker {


    private static instance: Patch20250721UpdateWidgetsIconHTML = null;
    private constructor() { }

    get uid(): string {
        return 'Patch20250721UpdateWidgetsIconHTML';
    }

    // istanbul ignore next: nothing to test
    public static getInstance(): Patch20250721UpdateWidgetsIconHTML {
        if (!Patch20250721UpdateWidgetsIconHTML.instance) {
            Patch20250721UpdateWidgetsIconHTML.instance = new Patch20250721UpdateWidgetsIconHTML();
        }
        return Patch20250721UpdateWidgetsIconHTML.instance;
    }

    public async work(db: IDatabase<any>) {

        // -- ===================================================
        // -- PATCH UNIFORMISATION ICONES WIDGETS DASHBOARD
        // -- Date: 21 juillet 2025
        // -- Objectif: Standardiser le HTML, les classes et la structure des icônes.
        // -- ===================================================
        //
        // -- Catégorie: Filtres (Bleu)
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-filter fa-stack-2x"></i></div>' WHERE name = 'fieldvaluefilter';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-filter fa-stack-2x"></i><i class="fa-solid fa-check fa-stack-1x icon_overlay_icon" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white;"></i></div>' WHERE name = 'validationfilters';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-filter fa-stack-2x"></i><i class="fa-solid fa-trash fa-stack-1x icon_overlay_icon" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white;"></i></div>' WHERE name = 'resetfilters';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-filter fa-stack-2x"></i><i class="fa-solid fa-floppy-disk fa-stack-1x icon_overlay_icon" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white;"></i></div>' WHERE name = 'savefavoritesfilters';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-filter fa-stack-2x"></i><i class="fa-solid fa-eye fa-stack-1x icon_overlay_icon" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white;"></i></div>' WHERE name = 'showfavoritesfilters';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-bullseye fa-stack-2x"></i></div>' WHERE name = 'var';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-regular fa-calendar fa-stack-2x"></i><strong class="fa-stack-1x icon_text_overlay" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white; margin-top:4px">7</strong></div>' WHERE name = 'dowfilter';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-regular fa-calendar fa-stack-2x"></i><strong class="fa-stack-1x icon_text_overlay" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white; margin-top:4px">31</strong></div>' WHERE name = 'monthfilter';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-regular fa-calendar fa-stack-2x"></i><strong class="fa-stack-1x icon_text_overlay" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white; margin-top:4px">365</strong></div>' WHERE name = 'yearfilter';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-regular fa-calendar fa-stack-2x"></i><strong class="fa-stack-1x icon_text_overlay" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white; margin-top:4px">X</strong></div>' WHERE name = 'advanceddatefilter';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-user fa-stack-2x"></i><i class="fa-solid fa-bullseye fa-stack-1x icon_overlay_icon" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white;"></i></div>' WHERE name = 'currentuserfilter';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-user fa-stack-2x"></i><i class="fa-solid fa-filter fa-stack-1x icon_overlay_icon--br" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white;"></i></div>' WHERE name = 'currentuserfilteredfacrs';`);

        // -- Catégorie: Données & Tableaux (Bleu)
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-table fa-stack-2x"></i><i class="fa-solid fa-pencil fa-stack-1x icon_overlay_icon--bl" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white;"></i></div>' WHERE name = 'datatable';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-file fa-stack-2x"></i><i class="fa-solid fa-arrow-right-from-bracket fa-stack-1x icon_overlay_icon" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white;"></i></div>' WHERE name = 'pageswitch';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-database fa-stack-2x"></i><i class="fa-solid fa-pen fa-stack-1x icon_overlay_icon--tr" style="color: black; margin-left:10px; margin-top: -10px"></i><i class="fa-solid fa-trash fa-stack-1x icon_overlay_icon--br" style="color: #dc3545; margin-left:10px; margin-top: 10px"></i></div>' WHERE  name = 'crudbuttons';`);

        // -- Catégorie: Graphiques (Vert)
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-chart-pie fa-stack-2x"></i></div>' WHERE name = 'varpiechart';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-chart-bar fa-stack-2x"></i></div>' WHERE name = 'varmixedcharts';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-chart-radar fa-stack-2x"></i></div>' WHERE name = 'varradarchart';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-map-location-dot fa-stack-2x"></i></div>' WHERE name = 'varchoroplethchart';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-chart-line fa-stack-2x"></i><i class="fa-solid fa-clock fa-stack-1x icon_overlay_icon--br" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white;"></i></div>' WHERE name = 'perfreportgraph';`);

        // -- Catégorie: Outils & Opérations (Gris)
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-check-circle fa-stack-2x"></i></div>' WHERE name = 'checklist';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-cogs fa-stack-2x"></i></div>' WHERE name = 'bulkops';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-list-check fa-stack-2x"></i></div>' WHERE name = 'supervision';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-list-check fa-stack-2x"></i><i class="fa-solid fa-tag fa-stack-1x icon_overlay_icon--tr" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white;"></i></div>' WHERE name = 'supervision_type';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-comments fa-stack-2x"></i></div>' WHERE name = 'oseliathread';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-tasks fa-stack-2x"></i></div>' WHERE name = 'SuiviCompetences';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-project-diagram fa-stack-2x"></i></div>' WHERE name = 'oseliarungraphwidget';`);

        // -- Catégorie: CMS (Orange)
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-font fa-stack-2x"></i></div>' WHERE name IN ('BlocText', 'cmsbloctext');`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-image fa-stack-2x"></i></div>' WHERE name = 'cmsimage';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-print fa-stack-2x"></i><i class="fa-solid fa-cog fa-stack-1x icon_overlay_icon" style="color: black; margin-left: 0px; margin-top: 0px; text-shadow: 1px 1px white;"></i></div>' WHERE name = 'cmsprintparam';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-link fa-stack-2x"></i></div>' WHERE name = 'cmslinkbutton';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-heart fa-stack-2x"></i></div>' WHERE name = 'cmslikebutton';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-toggle-on fa-stack-2x"></i></div>' WHERE name = 'cmsbooleanbutton';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-file-pdf fa-stack-2x"></i></div>' WHERE name = 'cmsvisionneusepdf';`);

        // -- Catégorie: Template (Violet)
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-link fa-stack-2x"></i></div>' WHERE name = 'templateconsultation_linkbutton';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-database fa-stack-2x"></i><i class="fa-solid fa-pen fa-stack-1x icon_overlay_icon--tr" style="color: black; margin-left:10px; margin-top: -10px"></i><i class="fa-solid fa-trash fa-stack-1x icon_overlay_icon--br" style="color: #dc3545; margin-left:10px; margin-top: 10px"></i></div>' WHERE name = 'templateconsultation_crudbuttons';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-file-pdf fa-stack-2x"></i></div>' WHERE name = 'templateconsultation_visionneusepdf';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-image fa-stack-2x"></i></div>' WHERE name = 'templateconsultation_image';`);
        await db.query(`UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = '<div class="fa-stack fa-fw"><i class="fa-solid fa-font fa-stack-2x"></i></div>' WHERE name = 'templateconsultation_bloctext';`);
    }
}