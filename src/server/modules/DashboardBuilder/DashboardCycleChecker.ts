import Throttle from "../../../shared/annotations/Throttle";
import { query } from "../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import ModuleTableController from "../../../shared/modules/DAO/ModuleTableController";
import ModuleTableFieldController from "../../../shared/modules/DAO/ModuleTableFieldController";
import ModuleTableFieldVO from "../../../shared/modules/DAO/vos/ModuleTableFieldVO";
import DashboardGraphVORefVO from "../../../shared/modules/DashboardBuilder/vos/DashboardGraphVORefVO";
import DashboardVO from "../../../shared/modules/DashboardBuilder/vos/DashboardVO";
import EventifyEventListenerConfVO from "../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO";
import TeamsWebhookContentActionOpenUrlVO from "../../../shared/modules/TeamsAPI/vos/TeamsWebhookContentActionOpenUrlVO";
import ConsoleHandler from "../../../shared/tools/ConsoleHandler";
import LocaleManager from "../../../shared/tools/LocaleManager";
import ObjectHandler from "../../../shared/tools/ObjectHandler";
import ThreadHandler from "../../../shared/tools/ThreadHandler";
import ConfigurationService from "../../env/ConfigurationService";
import ModuleDAOServer from "../DAO/ModuleDAOServer";
import TeamsAPIServerController from "../TeamsAPI/TeamsAPIServerController";

export default class DashboardCycleChecker {

    public static async detectCyclesForDashboard(dashboard_id: number) {

        // Chargement des références du Dashboard
        const dashboard = await query(DashboardVO.API_TYPE_ID)
            .filter_by_id(dashboard_id)
            .exec_as_server()
            .select_vo<DashboardVO>();

        // Chargement des références du Dashboard
        const dashboard_refs = await query(DashboardGraphVORefVO.API_TYPE_ID)
            .filter_by_id(dashboard_id, DashboardVO.API_TYPE_ID)
            .exec_as_server()
            .select_vos<DashboardGraphVORefVO>();

        // On récupère tous les vo_type présents dans ce dashboard
        const voTypes = new Set<string>();
        for (const ref of dashboard_refs) {
            voTypes.add(ref.vo_type);
        }

        // Préparation des structures d'adjacence
        const adjacency: { [voType: string]: string[] } = {};
        const adjacency_full: { [voType: string]: { [fieldName: string]: string } } = {};

        for (const voType of voTypes) {
            adjacency[voType] = [];
            adjacency_full[voType] = {};
        }

        // Construction de l'adjacence en fonction des foreign_keys
        for (const voType of voTypes) {
            const module_table = ModuleTableController.module_tables_by_vo_type[voType];
            if (!module_table) {
                continue;
            }

            const fieldsMap = ModuleTableFieldController.module_table_fields_by_vo_type_and_field_name[voType];
            if (!fieldsMap) {
                continue;
            }

            // Regroupe tous les champs exclus pour ce voType dans ce dashboard
            const excludes = new Set<string>();
            for (const ref of dashboard_refs.filter(r => r.vo_type === voType)) {
                if (ref.values_to_exclude) {
                    for (const excludedField of ref.values_to_exclude) {
                        excludes.add(excludedField);
                    }
                }
            }

            // Parcours des champs pour construire les liens
            for (const fieldName of Object.keys(fieldsMap)) {
                if (excludes.has(fieldName)) {
                    continue; // On saute les champs à exclure
                }

                const field = fieldsMap[fieldName];
                if (field.field_type === ModuleTableFieldVO.FIELD_TYPE_foreign_key && field.foreign_ref_vo_type) {
                    const refType = field.foreign_ref_vo_type;
                    // On ne crée le lien que si la table référencée est aussi dans le Dashboard
                    if (refType !== voType && voTypes.has(refType)) {
                        adjacency[voType].push(refType);
                        adjacency[refType].push(voType);
                        adjacency_full[voType][fieldName] = refType;
                    }
                }
            }
        }

        // Détection des cycles
        const visited = new Set<string>();
        const parent: { [voType: string]: string | null } = {};

        // On remplace les sets par des tableaux
        let cycle_tables: string[] = [];
        let cycle_fields: { [voType: string]: string[] } = {};
        let cycle_links: { [voType: string]: string[] } = {};

        // Helper pour ajouter un élément unique dans un tableau
        const addUnique = (arr: string[], val: string) => {
            if (!arr.includes(val)) {
                arr.push(val);
            }
        };

        const dfsCycle = (current: string, par: string | null) => {
            visited.add(current);

            for (const neighbor of adjacency[current] || []) {
                if (neighbor === par) {
                    continue;
                }

                if (!visited.has(neighbor)) {
                    parent[neighbor] = current;
                    dfsCycle(neighbor, current);
                } else if (neighbor !== par) {
                    // On a trouvé un cycle
                    const cycleNodes: string[] = [];
                    let x: string | null = current;
                    while (x !== null && x !== neighbor && x in parent) {
                        cycleNodes.push(x);
                        x = parent[x] || null;
                    }
                    cycleNodes.push(neighbor);

                    // Marque les tables du cycle
                    for (const node of cycleNodes) {
                        addUnique(cycle_tables, node);
                    }

                    // Marque les champs qui participent au cycle
                    for (let i = 0; i < cycleNodes.length; i++) {
                        const A = cycleNodes[i];
                        const B = cycleNodes[(i + 1) % cycleNodes.length];

                        // Liens A -> B
                        for (const [fName, refType] of Object.entries(adjacency_full[A] || {})) {
                            if (refType === B) {
                                if (!cycle_fields[A]) cycle_fields[A] = [];
                                if (!cycle_links[A]) cycle_links[A] = [];
                                addUnique(cycle_fields[A], fName);
                                addUnique(cycle_links[A], fName);
                            }
                        }

                        // Liens B -> A
                        for (const [fName, refType] of Object.entries(adjacency_full[B] || {})) {
                            if (refType === A) {
                                if (!cycle_fields[B]) cycle_fields[B] = [];
                                if (!cycle_links[B]) cycle_links[B] = [];
                                addUnique(cycle_fields[B], fName);
                                addUnique(cycle_links[B], fName);
                            }
                        }
                    }
                }
            }
        };

        // Parcours DFS de chaque voType pour trouver les cycles
        for (const voType of Object.keys(adjacency)) {
            if (!visited.has(voType)) {
                parent[voType] = null;
                dfsCycle(voType, null);
            }
        }

        if (!cycle_tables.length) {
            cycle_tables = null;
        }

        if (!Object.keys(cycle_fields).length) {
            cycle_fields = null;
        }

        if (!Object.keys(cycle_links).length) {
            cycle_links = null;
        }

        const does_not_need_update = !DashboardCycleChecker.needs_update(dashboard, cycle_tables, cycle_fields, cycle_links);

        if ((!dashboard.has_cycle) && (cycle_tables && cycle_tables.length)) {
            await DashboardCycleChecker.notif_teams_cycle_detected(dashboard, cycle_tables);
        }

        if (dashboard.has_cycle && ((!cycle_tables) || (!cycle_tables.length))) {
            await DashboardCycleChecker.notif_teams_cycle_solved(dashboard);
        }

        if (does_not_need_update) {
            return;
        }

        dashboard.cycle_tables = cycle_tables;
        dashboard.cycle_fields = cycle_fields;
        dashboard.cycle_links = cycle_links;
        dashboard.has_cycle = !!(cycle_tables && (cycle_tables.length > 0));

        await ModuleDAOServer.getInstance().insertOrUpdateVO_as_server(dashboard);
    }

    public static needs_update(dashboard: DashboardVO, cycle_tables: string[], cycle_fields: { [voType: string]: string[] }, cycle_links: { [voType: string]: string[] }): boolean {

        return !(ObjectHandler.are_equal(
            dashboard.cycle_tables,
            cycle_tables
        ) && ObjectHandler.are_equal(
            dashboard.cycle_fields,
            cycle_fields
        ) && ObjectHandler.are_equal(
            dashboard.cycle_links,
            cycle_links
        ) && (dashboard.has_cycle === (cycle_tables && (cycle_tables.length > 0))));
    }

    private static async notif_teams_cycle_detected(dashboard: DashboardVO, cycle_tables: string[]) {

        const dashboard_title = await LocaleManager.t(dashboard.title);

        const actions = [
            new TeamsWebhookContentActionOpenUrlVO().set_url(ConfigurationService.node_configuration.base_url + 'admin#/dashboard_builder/' + dashboard.id).set_title('Editer le dashboard')
        ];

        await TeamsAPIServerController.send_teams_error(
            'Dashboard Cycle Checker - Cycle détecté',
            'Cycle détecté dans le dashboard "<b>' + dashboard_title + '</b>" [' + dashboard.id + '] : <ul>' +
            cycle_tables.map((table) => '<li>' + table + '</li>').join('') +
            '</ul>',
            actions
        );
    }

    private static async notif_teams_cycle_solved(dashboard: DashboardVO) {

        const dashboard_title = await LocaleManager.t(dashboard.title);

        const actions = [
            new TeamsWebhookContentActionOpenUrlVO().set_url(ConfigurationService.node_configuration.base_url + 'admin#/dashboard_builder/' + dashboard.id).set_title('Editer le dashboard')
        ];

        await TeamsAPIServerController.send_teams_success(
            'Dashboard Cycle Checker - Résolu',
            'Il n\'y a plus de cycle dans le dashboard "<b>' + dashboard_title + '</b>" [' + dashboard.id + '] !',
            actions
        );
    }

    @Throttle(
        {
            param_type: EventifyEventListenerConfVO.PARAM_TYPE_MAP,
            throttle_ms: 10000,
        },
    )
    public static async detectCyclesForDashboards(dashboard_ids: { [id: number]: boolean }) {

        if (!dashboard_ids || !Object.keys(dashboard_ids).length) {
            return;
        }

        for (const dashboard_id of Object.keys(dashboard_ids)) {
            ConsoleHandler.log('DashboardCycleChecker.detectCyclesForDashboards - ' + dashboard_id);
            await DashboardCycleChecker.detectCyclesForDashboard(parseInt(dashboard_id));
            await ThreadHandler.sleep(100, 'DashboardCycleChecker.detectCyclesForDashboard'); // On laisse un peu de temps au reste du monde, ya pas urgence sur ce truc
        }
    }
}
