import { query } from "../../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import GPTAssistantAPIFunctionVO from "../../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO";
import OseliaRunFunctionCallVO from "../../../../../../../../shared/modules/Oselia/vos/OseliaRunFunctionCallVO";
import OseliaRunTemplateVO from "../../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO";
import OseliaRunVO from "../../../../../../../../shared/modules/Oselia/vos/OseliaRunVO";
import { field_names } from "../../../../../../../../shared/tools/ObjectHandler";

export interface DiagramDataResult {
    /**
     * Le graphe d'adjacence : chaque clé = ID d'un item,
     * la valeur est la liste des items enfants (ou liés).
     */
    adjacency: { [id: string]: string[] };

    /**
     * Items potentiellement modifiés (par ex. ajout de faux "+").
     */
    items: { [id: string]: OseliaRunTemplateVO | OseliaRunVO | GPTAssistantAPIFunctionVO | OseliaRunFunctionCallVO };
}
export default class DiagramDataService {

    public static async prepareTemplateData(
        currentItems: { [id: string]: OseliaRunTemplateVO }
    ): Promise<DiagramDataResult> {

        // Préparer l'adjacence : un tableau vide pour chaque item initial
        const adjacency: { [id: string]: string[] } = {};
        for (const id of Object.keys(currentItems)) {
            adjacency[id] = [];
        }

        // Fonction récursive pour "expand" un agent,
        // fetcher ses enfants, et si l'enfant est agent => on descend également.
        const expandedAgents = new Set<string>();

        async function expandAgent(agentId: string) {

            // Pour éviter boucle infinie si un agent se référence lui-même par erreur
            if (expandedAgents.has(agentId)) {
                return;
            }
            expandedAgents.add(agentId);

            // 1) Créer un faux bloc "add_agentId" s’il n’existe pas
            const plusId = `add_${agentId}`;
            if (!currentItems[plusId]) {
                const fakeAdd = new OseliaRunTemplateVO();
                fakeAdd.id = -1;
                fakeAdd.run_type = 9999; // un type fictif
                fakeAdd.name = '+';
                currentItems[plusId] = fakeAdd;
                adjacency[plusId] = [];
            }
            // Lier agent -> plus
            if (!adjacency[agentId].includes(plusId)) {
                adjacency[agentId].push(plusId);
            }

            // 2) Récupérer la liste de NumRange des children
            const agentVo = currentItems[agentId];
            if (!agentVo?.children?.length) {
                return; // pas d'enfants
            }

            // Les ranges potentiels
            const allChildrenRanges = agentVo.children;

            // S'il y a des IDs à chercher
            let fetchedChildren: OseliaRunTemplateVO[] = [];
            if (allChildrenRanges.length > 0) {
                fetchedChildren = await query(OseliaRunTemplateVO.API_TYPE_ID)
                    .filter_by_ids(allChildrenRanges)
                    .select_vos<OseliaRunTemplateVO>();

                // On les met dans currentItems
                for (const child of fetchedChildren) {
                    if (!currentItems[child.id]) {
                        currentItems[child.id] = child;
                        adjacency[String(child.id)] = [];
                    }
                }
            }

            // 4) Maintenant, on connaît tous les enfants (ceux déjà en currentItems, + ceux fetchés).
            //    Construire adjacency : agent -> childId

            for (const child of fetchedChildren) {
                // Évite les doublons
                if (!adjacency[agentId].includes(String(child.id))) {
                    adjacency[agentId].push(String(child.id));
                }
                const childVo = currentItems[String(child.id)];
                if (childVo?.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                    await expandAgent(String(child.id));
                }
            }
        }

        // Lancer l'expansion sur chacun des agents initiaux
        const agentIds = Object.keys(currentItems).filter(id => {
            return currentItems[id].run_type === OseliaRunVO.RUN_TYPE_AGENT;
        });

        for (const agId of agentIds) {
            await expandAgent(agId);
        }

        return {
            adjacency,
            items: currentItems
        };
    }

    /**
     * Prépare un diagramme :
     *   OseliaRunVO -> OseliaRunFunctionCallVO
     *
     * Les appels de fonction sont ordonnés par end_date.
     * On ne crée plus de liaison avec les GPTAssistantAPIFunctionVO.
     *
     * NOUVEAU : On gère aussi la hiérarchie des runs (agents avec enfants)
     */
    public static async prepareRunData(
        currentItems: { [id: string]: OseliaRunVO | GPTAssistantAPIFunctionVO | OseliaRunFunctionCallVO }
    ): Promise<DiagramDataResult> {

        // 1) Initialiser adjacency
        const adjacency: { [id: string]: string[] } = {};
        for (const id of Object.keys(currentItems)) {
            adjacency[id] = [];
        }

        // 2) Trouver tous les runs
        const runIds = Object.keys(currentItems).filter(id => {
            return currentItems[id]._type === OseliaRunVO.API_TYPE_ID;
        });
        if (!runIds.length) {
            return { adjacency, items: currentItems };
        }

        // 3) Gestion hiérarchie des runs (agents avec enfants)
        // PROTECTION : On ne cherche la hiérarchie que si on a peu de runs pour éviter les problèmes de performances
        const runItems = currentItems as { [id: string]: OseliaRunVO };

        if (runIds.length < 50) {  // Protection : pas plus de 50 runs pour éviter les boucles
            // Pour chaque run, ajouter ses enfants dans l'adjacence
            for (const runId of runIds) {
                const run = runItems[runId];
                if (!run) continue;

                // Si c'est un agent, chercher ses enfants UNIQUEMENT parmi les runs déjà chargés
                if (run.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                    const runNumId = Number(runId);

                    // Trouver tous les runs enfants de cet agent SEULEMENT parmi ceux déjà dans currentItems
                    const childRuns = Object.values(runItems).filter(r =>
                        r.parent_run_id === runNumId
                    );

                    for (const childRun of childRuns) {
                        const childId = String(childRun.id);
                        if (!adjacency[runId].includes(childId)) {
                            adjacency[runId].push(childId);
                        }
                    }
                }
            }
        } else {
            console.warn(`[DiagramDataService] Trop de runs (${runIds.length}), hiérarchie désactivée pour éviter les problèmes de performances`);
        }

        // 4) Récupérer TOUS les appels de fonction (runFunctionCall) liés aux runs trouvés
        // PROTECTION : On limite le nombre de runs traités pour éviter les boucles infinies
        const runIdsNum = runIds.slice(0, 20).map(rid => Number(rid)); // MAX 20 runs pour éviter les problèmes

        if (runIdsNum.length === 0) {
            console.log('[DiagramDataService] Aucun run à traiter');
            return { adjacency, items: currentItems };
        }

        console.log(`[DiagramDataService] Traitement de ${runIdsNum.length} runs pour les function calls...`);

        const allRunFunctions = await query(OseliaRunFunctionCallVO.API_TYPE_ID)
            .filter_by_num_has(field_names<OseliaRunFunctionCallVO>().oselia_run_id, runIdsNum)
            .select_vos<OseliaRunFunctionCallVO>();  // Pas de exec_as_server pour éviter les problèmes

        console.log(`[DiagramDataService] Trouvé ${allRunFunctions.length} function calls pour ${runIds.length} runs:`,
            allRunFunctions.map(f => `call_${f.id}(run_${f.oselia_run_id})`));

        // 5) GPT Functions associées
        const allGptFunctionIds = allRunFunctions.map(f => f.gpt_function_id);
        const uniqueFunctionIds = [...new Set(allGptFunctionIds)];
        let allGptFunctions: GPTAssistantAPIFunctionVO[] = [];

        if (uniqueFunctionIds.length > 0) {
            allGptFunctions = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
                .filter_by_ids(uniqueFunctionIds)
                .select_vos<GPTAssistantAPIFunctionVO>();
        }

        // On fait un petit map local pour accéder vite aux GPTFunctions
        const mapGpt: { [fid: number]: GPTAssistantAPIFunctionVO } = {};
        for (const gf of allGptFunctions) {
            mapGpt[gf.id] = gf;
        }

        // 6) Pour chaque run, ajouter TOUS ses appels de fonction (même s'il n'y en a pas)
        for (const rid of runIds) {
            const runNum = Number(rid);

            // Filtre des calls pour ce run
            const runCalls = allRunFunctions.filter(rc => rc.oselia_run_id === runNum);

            // IMPORTANT : Tri par ID pour avoir les appels dans l'ordre de création
            // (pas par end_date car on veut voir tous les appels, même en cours)
            runCalls.sort((a, b) => a.id - b.id);

            // 7) Ajouter TOUS les calls de ce run dans le graphe
            for (const callVO of runCalls) {
                const callNodeId = `call_${callVO.id}`;

                // MISE À JOUR FORCÉE : On remplace toujours l'objet pour forcer la réactivité
                // Même si l'ID existe déjà, on met à jour avec les nouvelles données
                currentItems[callNodeId] = callVO;
                if (!adjacency[callNodeId]) {
                    adjacency[callNodeId] = [];
                }

                // Adjacence : run -> ce call
                if (!adjacency[rid].includes(callNodeId)) {
                    adjacency[rid].push(callNodeId);
                }
            }

            // NOUVEAU : Mise à jour forcée du run lui-même pour refléter les changements d'état
            // On s'assure que le run dans currentItems a les dernières données
            const allRunItems = currentItems as { [id: string]: OseliaRunVO };
            const currentRun = allRunItems[rid];
            if (currentRun && currentRun._type === OseliaRunVO.API_TYPE_ID) {
                // Force la mise à jour des propriétés du run (état, dates, etc.)
                currentItems[rid] = { ...currentRun };
            }

            // Si le run n'a pas de function calls, on s'assure qu'il reste visible
            if (runCalls.length === 0) {
                // Le run reste dans items et adjacency même sans function calls
                // adjacency[rid] reste un tableau vide mais le run sera affiché
            }
        }

        // On renvoie le résultat
        return {
            adjacency,
            items: currentItems
        };
    }
}