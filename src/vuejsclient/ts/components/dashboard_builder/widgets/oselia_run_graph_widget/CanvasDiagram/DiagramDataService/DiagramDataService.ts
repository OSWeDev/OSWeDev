import { query } from "../../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import NumRange from "../../../../../../../../shared/modules/DataRender/vos/NumRange";
import GPTAssistantAPIFunctionVO from "../../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO";
import OseliaRunFunctionCallVO from "../../../../../../../../shared/modules/Oselia/vos/OseliaRunFunctionCallVO";
import OseliaRunTemplateVO from "../../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO";
import OseliaRunVO from "../../../../../../../../shared/modules/Oselia/vos/OseliaRunVO";
import { field_names } from "../../../../../../../../shared/tools/ObjectHandler";

export interface FunctionsInfo {
    [id: string]: {
        gptFunction: GPTAssistantAPIFunctionVO;
        runFunction: OseliaRunFunctionCallVO[];
    };
}

export interface DiagramDataResult {
    /**
     * Le graphe d'adjacence : chaque clé = ID d'un item,
     * la valeur est la liste des items enfants (ou liés).
     */
    adjacency: { [id: string]: string[] };

    /**
     * Informations pour les fonctions GPT.
     * (Vide si isRunVo = false, ou si pas de GPT.)
     */
    functionsInfos: FunctionsInfo;

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

        // On n’a pas de functionsInfos pour un template
        const functionsInfos: FunctionsInfo = {};

        return {
            adjacency,
            functionsInfos,
            items: currentItems
        };
    }

    /**
     * Prépare un diagramme :
     *   OseliaRunVO -> OseliaRunFunctionCallVO
     *
     * Les appels de fonction sont ordonnés par end_date.
     * On ne crée plus de liaison avec les GPTAssistantAPIFunctionVO.
     */
    public static async prepareRunData(
        currentItems: { [id: string]: OseliaRunVO | GPTAssistantAPIFunctionVO | OseliaRunFunctionCallVO }
    ): Promise<DiagramDataResult> {

        // 1) Initialiser adjacency + functionsInfos
        const adjacency: { [id: string]: string[] } = {};
        for (const id of Object.keys(currentItems)) {
            adjacency[id] = [];
        }
        const functionsInfos: FunctionsInfo = {};

        // 2) Trouver tous les runs
        const runIds = Object.keys(currentItems).filter(id => {
            return currentItems[id]._type === OseliaRunVO.API_TYPE_ID;
        });
        if (!runIds.length) {
            return { adjacency, functionsInfos, items: currentItems };
        }

        // 3) Récupérer tous les appels de fonction (runFunctionCall) liés aux runs trouvés
        const runIdsNum = runIds.map(rid => Number(rid));
        const allRunFunctions = await query(OseliaRunFunctionCallVO.API_TYPE_ID)
            .filter_by_num_has(field_names<OseliaRunFunctionCallVO>().oselia_run_id, runIdsNum)
            .select_vos<OseliaRunFunctionCallVO>();

        // 4) GPT Functions associées
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

        // 4) Pour chaque run, trier les appels sur end_date
        for (const rid of runIds) {
            const runNum = Number(rid);

            // Filtre des calls pour ce run
            const runCalls = allRunFunctions.filter(rc => rc.oselia_run_id === runNum);

            // Tri par end_date (montant ou descendant, à adapter)
            runCalls.sort((a, b) => {
                // Par défaut, on peut traiter l'absence de end_date en bas de liste
                if (!a.end_date && !b.end_date) {
                    return 0;
                } else if (!a.end_date) {
                    return 1;
                } else if (!b.end_date) {
                    return -1;
                }
                // Si end_date est un nombre (timestamp) :
                return a.end_date - b.end_date;

                // Si end_date est un string (format date), on peut faire :
                // return new Date(a.end_date).getTime() - new Date(b.end_date).getTime();
            });

            // Trouver l'ensemble des GPT functions de ce run
            const uniqueFids = new Set(runCalls.map(rc => rc.gpt_function_id));

            // Pour chaque GPT function ID
            for (const fid of uniqueFids) {
                const gfVO = mapGpt[fid];
                if (!gfVO) {
                    continue; // GPT function ID inexistant
                }

                // Alimente la "has many" runFunction
                const callsForThisFunction = runCalls.filter(c => c.gpt_function_id === fid);

                // MàJ du functionsInfos
                // => stocke la liste complète des runFunctionCall
                functionsInfos[rid] = {
                    gptFunction: gfVO,
                    runFunction: callsForThisFunction
                };
            }

            // 5) Ajouter chaque call dans le graphe
            for (const callVO of runCalls) {
                const callNodeId = `call_${callVO.id}`;

                // On stocke dans items si pas déjà présent
                if (!currentItems[callNodeId]) {
                    currentItems[callNodeId] = callVO;
                    adjacency[callNodeId] = [];
                }

                // Adjacence : run -> ce call
                if (!adjacency[rid].includes(callNodeId)) {
                    adjacency[rid].push(callNodeId);
                }
            }
        }

        // On renvoie le résultat
        return {
            adjacency,
            functionsInfos,
            items: currentItems
        };
    }
}