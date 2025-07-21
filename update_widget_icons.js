// Script temporaire pour mettre à jour les icônes des widgets dashboard
const { Client } = require('pg');
const fs = require('fs');

// Configuration de connexion - À adapter selon les paramètres DEVPSA
const dbConfig = {
    host: 'localhost', // À remplacer par l'host DEVPSA
    port: 5432,
    database: 'oswedev', // À remplacer par le nom de la base DEVPSA
    user: 'postgres', // À remplacer par l'utilisateur DEVPSA
    password: 'password', // À remplacer par le mot de passe DEVPSA
};

// Nouvelles icônes Font Awesome améliorées
const widgetIconUpdates = [
    {
        name: 'FieldValueFilterWidgetOptions',
        newIcon: '<i class="fas fa-filter"></i>'
    },
    {
        name: 'VarIndicatorWidgetOptions',
        newIcon: '<i class="fas fa-bullseye"></i>'
    },
    {
        name: 'TableWidgetOptions',
        newIcon: '<i class="fas fa-table"></i>'
    },
    {
        name: 'PageSwitchWidgetOptions',
        newIcon: '<i class="fas fa-file-alt"></i>'
    },
    {
        name: 'DOWFilterWidgetOptions',
        newIcon: '<i class="fas fa-calendar-week"></i>'
    },
    {
        name: 'MonthFilterWidgetOptions',
        newIcon: '<i class="fas fa-calendar-day"></i>'
    },
    {
        name: 'YearFilterWidgetOptions',
        newIcon: '<i class="fas fa-calendar-alt"></i>'
    },
    {
        name: 'ChecklistWidgetOptions',
        newIcon: '<i class="fas fa-tasks"></i>'
    },
    {
        name: 'BulkOpsWidgetOptions',
        newIcon: '<i class="fas fa-cogs"></i>'
    },
    {
        name: 'AdvancedDateFilterWidgetOptions',
        newIcon: '<i class="far fa-calendar-plus"></i>'
    },
    {
        name: 'ValidationFiltersWidgetOptions',
        newIcon: '<i class="fas fa-funnel-dollar"></i>'
    },
    {
        name: 'SupervisionWidgetOptions',
        newIcon: '<i class="fas fa-list-ul"></i>'
    },
    {
        name: 'SupervisionTypeWidgetOptions',
        newIcon: '<i class="fas fa-filter"></i>'
    },
    {
        name: 'FavoritesFiltersWidgetOptions',
        newIcon: '<i class="fas fa-filter"></i>'
    },
    {
        name: 'ResetFiltersWidgetOptions',
        newIcon: '<i class="fas fa-filter"></i>'
    },
    {
        name: 'VarPieChartWidgetOptions',
        newIcon: '<i class="fas fa-chart-pie"></i>'
    },
    {
        name: 'UserFilterWidgetOptions',
        newIcon: '<i class="fas fa-user"></i>'
    }
];

async function updateWidgetIcons() {
    const client = new Client(dbConfig);
    const updateLog = [];

    try {
        await client.connect();
        console.log('Connecté à la base de données');

        // Récupérer les widgets existants
        const result = await client.query('SELECT id, name, icon_html FROM ref.module_dashboardbuilder_dashboard_widget ORDER BY name');
        console.log(`Trouvé ${result.rows.length} widgets dans la base`);

        // Log des widgets existants
        console.log('\n=== WIDGETS EXISTANTS ===');
        result.rows.forEach(widget => {
            console.log(`ID: ${widget.id}, Name: ${widget.name}, Icon: ${widget.icon_html || 'NULL'}`);
        });

        // Mettre à jour les icônes
        for (const update of widgetIconUpdates) {
            const widget = result.rows.find(w => w.name === update.name);
            if (widget) {
                const oldIcon = widget.icon_html;
                await client.query(
                    'UPDATE ref.module_dashboardbuilder_dashboard_widget SET icon_html = $1 WHERE id = $2',
                    [update.newIcon, widget.id]
                );

                updateLog.push({
                    id: widget.id,
                    name: widget.name,
                    oldIcon: oldIcon,
                    newIcon: update.newIcon
                });

                console.log(`✅ Mis à jour: ${widget.name} (ID: ${widget.id})`);
                console.log(`   Ancien: ${oldIcon || 'NULL'}`);
                console.log(`   Nouveau: ${update.newIcon}`);
            } else {
                console.log(`❌ Widget non trouvé: ${update.name}`);
            }
        }

        console.log(`\n${updateLog.length} widgets mis à jour avec succès.`);

        // Générer le rapport pour le patch
        const patchContent = generatePatchReport(updateLog);
        fs.writeFileSync('widget_icons_patch_report.sql', patchContent);
        console.log('\n📄 Rapport de patch généré: widget_icons_patch_report.sql');

    } catch (error) {
        console.error('Erreur:', error);
    } finally {
        await client.end();
    }
}

function generatePatchReport(updateLog) {
    let patchSql = `-- Patch: Mise à jour des icônes des widgets dashboard
-- Date: ${new Date().toISOString()}
-- Nombre de modifications: ${updateLog.length}

`;

    updateLog.forEach(update => {
        patchSql += `-- Widget: ${update.name} (ID: ${update.id})
-- Ancien: ${update.oldIcon || 'NULL'}
UPDATE ref.module_dashboardbuilder_dashboard_widget 
SET icon_html = '${update.newIcon}' 
WHERE id = ${update.id};

`;
    });

    return patchSql;
}

// Exécuter le script
updateWidgetIcons().catch(console.error);
