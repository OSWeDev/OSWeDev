// src/services/DiagramDataService.ts

import { query } from "../../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO";
import NumRange from "../../../../../../../../shared/modules/DataRender/vos/NumRange";
import GPTAssistantAPIFunctionVO from "../../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO";
import OseliaRunFunctionCallVO from "../../../../../../../../shared/modules/Oselia/vos/OseliaRunFunctionCallVO";
import OseliaRunTemplateVO from "../../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO";
import OseliaRunVO from "../../../../../../../../shared/modules/Oselia/vos/OseliaRunVO";
import { field_names } from "../../../../../../../../shared/tools/ObjectHandler";

export interface DiagramDataResult {
    adjacency: { [id: string]: string[] };
    functionsInfos: {
        [id: string]: {
            gptFunction: GPTAssistantAPIFunctionVO;
            runFunction: OseliaRunFunctionCallVO;
        }
    };
    items: { [id: string]: OseliaRunTemplateVO | OseliaRunVO | GPTAssistantAPIFunctionVO };
}

export default class DiagramDataService {

    /**
     * Prépare les données pour un Run :
     * - Récupérer OseliaRunFunctionCallVO
     * - Récupérer GPTAssistantAPIFunctionVO
     * - Construire adjacency : run -> gptFunction
     */
    public static async prepareRunData(
        currentItems: { [id: string]: OseliaRunVO | GPTAssistantAPIFunctionVO }
    ): Promise<DiagramDataResult> {
        const adjacency: { [id: string]: string[] } = {};
        for (const id of Object.keys(currentItems)) {
            adjacency[id] = [];
        }
        const functionsInfos: DiagramDataResult['functionsInfos'] = {};

        // 1) Trouver tous les runId
        const runIds = Object.keys(currentItems).filter(id => currentItems[id]._type === OseliaRunVO.API_TYPE_ID);
        if (!runIds.length) {
            return { adjacency, functionsInfos, items: currentItems };
        }

        // 2) Récupérer OseliaRunFunctionCallVO
        const runNums = runIds.map(id => +id);
        const allRunFuncs = await query(OseliaRunFunctionCallVO.API_TYPE_ID)
            .filter_by_num_has(field_names<OseliaRunFunctionCallVO>().oselia_run_id, runNums)
            .select_vos<OseliaRunFunctionCallVO>();

        if (!allRunFuncs.length) {
            return { adjacency, functionsInfos, items: currentItems };
        }

        // 3) Récupérer GPTAssistantAPIFunctionVO (unique IDs)
        const gfIds = [...new Set(allRunFuncs.map(rf => rf.gpt_function_id))];
        const gptFunctions = gfIds.length
            ? await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
                .filter_by_ids(gfIds)
                .select_vos<GPTAssistantAPIFunctionVO>()
            : [];
        const mapGpt: { [fid: number]: GPTAssistantAPIFunctionVO } = {};
        for (const gf of gptFunctions) {
            mapGpt[gf.id] = gf;
        }

        // 4) Construire adjacency + infos
        //    run -> gptFunction
        for (const runId of runIds) {
            const runNum = +runId;
            const runCalls = allRunFuncs.filter(rf => rf.oselia_run_id === runNum);
            for (const rc of runCalls) {
                const gfVO = mapGpt[rc.gpt_function_id];
                if (!gfVO) continue;

                // on remplit functionsInfos
                functionsInfos[String(gfVO.id)] = {
                    gptFunction: gfVO,
                    runFunction: rc
                };

                // si gfVO pas encore dans items => on l'ajoute
                if (!currentItems[gfVO.id]) {
                    currentItems[gfVO.id] = gfVO;
                    adjacency[gfVO.id] = [];
                }

                adjacency[runId].push(String(gfVO.id));
            }
        }

        return {
            adjacency,
            functionsInfos,
            items: currentItems
        };
    }

    /**
     * Prépare les données pour un Template (agents) :
     * - Crée un bloc 'add_agentId'
     * - Récupère les enfants => adjacency[agentId].push(childId)
     */
    public static async prepareTemplateData(
        currentItems: { [id: string]: OseliaRunTemplateVO }
    ): Promise<DiagramDataResult> {
        const adjacency: { [id: string]: string[] } = {};
        for (const id of Object.keys(currentItems)) {
            adjacency[id] = [];
        }
        const functionsInfos = {};

        // 1) Créer un bloc '+'
        const allChildrenRanges: NumRange[] = [];
        for (const id of Object.keys(currentItems)) {
            const vo = currentItems[id];
            if (vo.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                const plusId = 'add_' + id;
                if (!currentItems[plusId]) {
                    const fakeAdd = new OseliaRunTemplateVO();
                    fakeAdd.id = -1;
                    fakeAdd.run_type = 9999;
                    fakeAdd.name = plusId;
                    currentItems[plusId] = fakeAdd;
                    adjacency[plusId] = [];
                }
                adjacency[id].push(plusId);

                // si agent a des enfants
                if (vo.children && vo.children.length) {
                    allChildrenRanges.push(...vo.children);
                }
            }
        }

        // 2) Récupérer tous ces enfants
        if (allChildrenRanges.length) {
            const fetched = await query(OseliaRunTemplateVO.API_TYPE_ID)
                .filter_by_ids(allChildrenRanges)
                .select_vos<OseliaRunTemplateVO>();
            for (const child of fetched) {
                if (!currentItems[child.id]) {
                    currentItems[child.id] = child;
                    adjacency[child.id] = [];
                }
            }

            // 3) Construire adjacency agent->child
            for (const id of Object.keys(currentItems)) {
                const vo = currentItems[id];
                if (vo.run_type !== OseliaRunVO.RUN_TYPE_AGENT) continue;
                if (vo.children && vo.children.length) {
                    for (const nr of vo.children) {
                        const childVos = fetched.filter(c => c.id >= nr.min && c.id <= nr.max);
                        for (const cvo of childVos) {
                            adjacency[id].push(String(cvo.id));
                        }
                    }
                }
            }
        }

        return {
            adjacency,
            functionsInfos,
            items: currentItems
        };
    }
}
