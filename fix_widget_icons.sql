-- ===================================================
-- PATCH AMELIORATION ICONES WIDGETS DASHBOARD
-- Date: 21 juillet 2025
-- Objectif: Corriger et améliorer les icônes des widgets
-- ===================================================

-- 1. Correction Widget ID 12 (checklist) - Erreur de syntaxe CSS
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <i class="fa-lg fa-fw fa fa-check-circle" aria-hidden="true"></i>
        '
WHERE id = 12;

-- 2. Ajout icône pour Widget ID 17 (supervision_type)
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <div class="fa-stack fa-lg fa-fw" aria-hidden="true">
            <i class="fa-solid fa-list-check fa-stack-2x"></i>
            <i class="fa-solid fa-tag fa-stack-1x" style="position: absolute; right: -2px; top: -2px; font-size: 0.6em; color: #007BFF;"></i>
        </div>
        '
WHERE id = 17;

-- 3. Ajout icône pour Widget ID 32 (perfreportgraph)
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <div class="fa-stack fa-lg fa-fw" aria-hidden="true">
            <i class="fa-solid fa-chart-line fa-stack-2x"></i>
            <i class="fa-solid fa-clock fa-stack-1x" style="position: absolute; right: -2px; bottom: -2px; font-size: 0.6em; color: #28a745;"></i>
        </div>
        '
WHERE id = 32;

-- 4. Amélioration Widget ID 16 (supervision) - Standardisation des classes
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <i class="fa-lg fa-fw fa-solid fa-list-check" aria-hidden="true"></i>
        '
WHERE id = 16;

-- 5. Amélioration Widget ID 19 (varpiechart) - Standardisation
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <i class="fa-lg fa-fw fa-solid fa-chart-pie" aria-hidden="true"></i>
        '
WHERE id = 19;

-- 6. Amélioration Widget ID 23 (oseliathread) - Standardisation et ajout de classes manquantes
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <i class="fa-lg fa-fw fa-solid fa-comments" aria-hidden="true"></i>
        '
WHERE id = 23;

-- 7. Amélioration Widget ID 28 (varmixedcharts) - Standardisation
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <i class="fa-lg fa-fw fa-solid fa-chart-mixed" aria-hidden="true"></i>
        '
WHERE id = 28;

-- 8. Amélioration Widget ID 30 (varradarchart) - Standardisation
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <i class="fa-lg fa-fw fa-solid fa-chart-radar" aria-hidden="true"></i>
        '
WHERE id = 30;

-- 9. Amélioration Widget ID 31 (varchoroplethchart) - Standardisation
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <i class="fa-lg fa-fw fa-solid fa-map-location-dot" aria-hidden="true"></i>
        '
WHERE id = 31;

-- 10. Amélioration Widget ID 33 (oseliarungraphwidget) - Correction classe inexistante
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <i class="fa-lg fa-fw fa-solid fa-project-diagram" aria-hidden="true"></i>
        '
WHERE id = 33;

-- 11. Amélioration superposition Widget ID 9 (dowfilter) - Positionnement plus propre
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <div class="fa-stack fa-lg fa-fw" aria-hidden="true">
            <i class="fa-regular fa-calendar fa-stack-2x"></i>
            <span class="fa-stack-1x" style="position: absolute; bottom: 2px; font-size: 0.5em; font-weight: bold; color: #007BFF;">7</span>
        </div>
        '
WHERE id = 9;

-- 12. Amélioration superposition Widget ID 10 (monthfilter) - Positionnement plus propre
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <div class="fa-stack fa-lg fa-fw" aria-hidden="true">
            <i class="fa-regular fa-calendar fa-stack-2x"></i>
            <span class="fa-stack-1x" style="position: absolute; bottom: 2px; font-size: 0.5em; font-weight: bold; color: #007BFF;">31</span>
        </div>
        '
WHERE id = 10;

-- 13. Amélioration superposition Widget ID 11 (yearfilter) - Positionnement plus propre
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <div class="fa-stack fa-lg fa-fw" aria-hidden="true">
            <i class="fa-regular fa-calendar fa-stack-2x"></i>
            <span class="fa-stack-1x" style="position: absolute; bottom: 2px; font-size: 0.4em; font-weight: bold; color: #007BFF;">365</span>
        </div>
        '
WHERE id = 11;

-- 14. Amélioration superposition Widget ID 14 (advanceddatefilter) - Positionnement plus propre
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <div class="fa-stack fa-lg fa-fw" aria-hidden="true">
            <i class="fa-regular fa-calendar fa-stack-2x"></i>
            <span class="fa-stack-1x" style="position: absolute; bottom: 2px; font-size: 0.5em; font-weight: bold; color: #007BFF;">X</span>
        </div>
        '
WHERE id = 14;

-- 15. Amélioration Widget ID 24 - Simplification du positionnement
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <div class="fa-stack fa-lg fa-fw" aria-hidden="true">
            <i class="fa-solid fa-user fa-stack-2x"></i>
            <i class="fa-solid fa-filter fa-stack-1x" style="position: absolute; right: -2px; bottom: -2px; font-size: 0.6em; color: #007BFF;"></i>
        </div>
        '
WHERE id = 24;

-- 16. Amélioration Widget ID 37 (crudbuttons) - Simplification du positionnement
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <div class="fa-stack fa-lg fa-fw" aria-hidden="true">
            <i class="fa-solid fa-database fa-stack-2x"></i>
            <i class="fa-solid fa-pen fa-stack-1x" style="position: absolute; right: 2px; top: 2px; font-size: 0.6em; color: #007BFF;"></i>
            <i class="fa-solid fa-trash fa-stack-1x" style="position: absolute; right: 2px; bottom: 2px; font-size: 0.6em; color: #dc3545;"></i>
        </div>
        '
WHERE id = 37;

-- 17. Amélioration Widget ID 43 (templateconsultation_crudbuttons) - Simplification du positionnement
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '
        <div class="fa-stack fa-lg fa-fw" aria-hidden="true" style="filter: invert(100%);">
            <i class="fa-solid fa-database fa-stack-2x"></i>
            <i class="fa-solid fa-pen fa-stack-1x" style="position: absolute; right: 2px; top: 2px; font-size: 0.6em; color: #007BFF;"></i>
            <i class="fa-solid fa-trash fa-stack-1x" style="position: absolute; right: 2px; bottom: 2px; font-size: 0.6em; color: #dc3545;"></i>
        </div>
        '
WHERE id = 43;

-- ===================================================
-- VERIFICATION DES MODIFICATIONS
-- ===================================================
-- Requête pour vérifier les modifications :
-- SELECT id, name, label, icon_html FROM ref.module_dashboardbuilder_dashboard_widget WHERE id IN (9,10,11,12,14,16,17,19,23,24,28,30,31,32,33,37,43) ORDER BY id;
