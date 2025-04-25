import GPTAssistantAPIFunctionVO from "../../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO";
import OseliaRunFunctionCallVO from "../../../../../../../../shared/modules/Oselia/vos/OseliaRunFunctionCallVO";
import OseliaRunTemplateVO from "../../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO";
import OseliaRunVO from "../../../../../../../../shared/modules/Oselia/vos/OseliaRunVO";

export interface BlockPosition {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface LinkDrawInfo {
    sourceItemId: string;
    targetItemId: string;
    pathPoints: { x: number; y: number }[];
}

export default class DiagramLayout {

    /**
     * Calcule les positions et les liens pour un Template (agents + enfants).
     * On s'appuie sur expandedAgents pour savoir si un agent est plié ou non.
     */
    public static layoutTemplateDiagram(
        items: { [id: string]: OseliaRunTemplateVO },
        adjacency: { [id: string]: string[] },
        expandedAgents: { [agentId: string]: boolean }
    ): {
            blockPositions: { [id: string]: BlockPosition };
            drawnLinks: LinkDrawInfo[];
        } {
        const blockPositions: { [id: string]: BlockPosition } = {};
        const allLinks: LinkDrawInfo[] = [];

        // Trouver les agents "root" (pas de parent agent)
        const agentIds = Object.keys(items).filter(id => items[id].run_type === OseliaRunVO.RUN_TYPE_AGENT);
        const rootAgents = agentIds.filter(aId => {
            const ag = items[aId];
            if (!ag.parent_run_id) return true; // pas de parent => root
            // sinon vérif si son parent_run_id est un agent
            const pid = String(ag.parent_run_id);
            return !agentIds.includes(pid);
        });

        let currentY = 0;
        for (const rootId of rootAgents) {
            currentY = DiagramLayout.layoutAgentRecursively(
                rootId,
                currentY,
                0,
                items,
                adjacency,
                expandedAgents,
                blockPositions
            );
        }

        // Une fois positions calculées, on génère les liens
        for (const agId of agentIds) {
            const agPos = blockPositions[agId];
            if (!agPos) continue;

            // On part du “bas” de l’agent (ou centre, à vous de choisir)
            const axCenter = agPos.x + agPos.w / 2;
            const ayBottom = agPos.y;

            // si agent replié => pas de liens
            if (!expandedAgents[agId]) {
                continue;
            }

            // Lien agent->plus
            const plusId = 'add_' + agId;
            const plusPos = blockPositions[plusId];
            if (plusPos) {
                const plusCenterX = plusPos.x + plusPos.w / 2;
                const plusCenterY = plusPos.y + plusPos.h / 2;
                const pathPoints = DiagramLayout.createElbowPoints(
                    axCenter,
                    ayBottom,
                    plusCenterX,
                    plusCenterY
                );
                allLinks.push({
                    sourceItemId: agId,
                    targetItemId: plusId,
                    pathPoints
                });
            }

            // Lien agent->enfants
            const childIds = adjacency[agId].filter(cid => {
                if (cid.startsWith('add_')) return false;
                const cvo = items[cid];
                return (cvo && cvo.id !== -1);
            });
            for (const cId of childIds) {
                const cPos = blockPositions[cId];
                if (!cPos) continue;

                const childCenterX = cPos.x;
                // ou cPos.x + cPos.w/2 si vous voulez arriver au milieu horizontal
                const childCenterY = cPos.y+ cPos.h / 2;

                const pathPoints = DiagramLayout.createElbowPoints(
                    axCenter,
                    ayBottom,
                    childCenterX,
                    childCenterY
                );
                allLinks.push({
                    sourceItemId: agId,
                    targetItemId: cId,
                    pathPoints
                });
            }
        }

        return {
            blockPositions,
            drawnLinks: allLinks
        };
    }

    public static layoutRunDiagram(
        items: { [id: string]: OseliaRunVO | OseliaRunFunctionCallVO },
        adjacency: { [id: string]: string[] }
    ): {
            blockPositions: { [id: string]: BlockPosition };
            drawnLinks: LinkDrawInfo[];
        } {

        const blockPositions: { [id: string]: BlockPosition } = {};
        const resultsLinks: LinkDrawInfo[] = [];

        // Liste des runs
        const runIds = Object.keys(items).filter(id => {
            return items[id]._type === OseliaRunVO.API_TYPE_ID;
        });

        // On parcourt chaque run, on le place, puis on place directement ses Calls
        let currentY = 0;
        for (const runId of runIds) {
            currentY = this.layoutOneRunWithCalls(
                runId,
                currentY,
                adjacency,
                items,
                blockPositions,
                resultsLinks
            );
        }

        return {
            blockPositions,
            drawnLinks: resultsLinks
        };
    }

    /**
     * Place un RUN et ses Calls dans un diagramme,
     * en triant les Calls par end_date.
     *
     * Retourne le Y final pour enchaîner si on a plusieurs runs à afficher.
     */
    private static layoutOneRunWithCalls(
        runId: string,
        startY: number,
        adjacency: { [id: string]: string[] },
        items: { [id: string]: OseliaRunVO | OseliaRunFunctionCallVO },
        positions: { [id: string]: BlockPosition },
        links: LinkDrawInfo[]
    ): number {
        // Dimensions par bloc
        const w = 200, h = 40;
        const verticalSpacing = 50;

        // On place le RUN
        const runX = 0; // Centré sur x=0 (arbitraire)
        positions[runId] = {
            x: runX - w / 2,
            y: startY,
            w,
            h
        };

        // Coordonnées du milieu du Run (pour le lien)
        const runCenterX = runX;
        const runCenterY = startY;

        // On récupère la liste des Calls pour ce run
        //  => On suppose que l’adjacence donne: adjacency[runId] = ["call_12", "call_13", ...]
        let callIds = adjacency[runId] || [];

        // Filtrer pour ne garder que de vrais appels de fonction
        // (si tu as un préfixe "call_", c’est encore plus sûr)
        callIds = callIds.filter(cid => cid.startsWith("call_"));

        // On veut trier par end_date
        // => Il faut caster l’item en OseliaRunFunctionCallVO
        callIds.sort((a, b) => {
            const callA = items[a] as OseliaRunFunctionCallVO;
            const callB = items[b] as OseliaRunFunctionCallVO;
            if (!callA && !callB) {
                return 0;
            }
            if (!callA) {
                return 1;
            }
            if (!callB) {
                return -1;
            }
            if (!callA.end_date && !callB.end_date) {
                return 0;
            } else if (!callA.end_date) {
                return 1;
            } else if (!callB.end_date) {
                return -1;
            }
            // Si end_date est un timestamp (number)
            return callA.end_date - callB.end_date;
            // ou si c'est un string:
            // return new Date(callA.end_date).getTime() - new Date(callB.end_date).getTime();
        });

        // On place chaque call en-dessous du RUN
        let localY = startY + h + verticalSpacing;
        for (const cId of callIds) {
            // Place le Call à x = 300 par ex, sous le run
            const callX = 100;
            positions[cId] = {
                x: callX,
                y: localY,
                w,
                h
            };

            // Tracer un lien run -> call
            const callCenterX = callX + w / 2;
            const callCenterY = localY + h / 2;
            links.push({
                sourceItemId: runId,
                targetItemId: cId,
                pathPoints: this.createElbowPoints(
                    runCenterX, runCenterY,
                    callCenterX, callCenterY
                )
            });

            // Descendre pour le prochain call
            localY += h + verticalSpacing;
        }

        // On renvoie la position en Y où on s’est arrêté pour empiler d’éventuels autres runs
        return localY;
    }


    /**
     * Crée un chemin "en L" (3 points) allant de (startX, startY) à (endX, endY).
     *  1) On part de (startX, startY)
     *  2) On va verticalement à (startX, endY)
     *  3) On va horizontalement à (endX, endY)
     */
    private static createElbowPoints(
        startX: number,
        startY: number,
        endX: number,
        endY: number
    ): { x: number; y: number }[] {
        return [
            { x: startX, y: startY },
            { x: startX, y: endY },
            { x: endX,  y: endY }
        ];
    }



    private static layoutAgentRecursively(
        agentId: string,
        startY: number,
        level: number,
        items: { [id: string]: OseliaRunTemplateVO },
        adjacency: { [id: string]: string[] },
        expandedAgents: { [id: string]: boolean },
        positions: { [id: string]: BlockPosition }
    ): number {
        const agentW = 200, agentH = 40;
        const plusW = 30, plusH = 30;
        const verticalSpacing = 10;
        const indentX = 300;

        const x = -agentW / 2 + level * indentX;
        positions[agentId] = { x, y: startY, w: agentW, h: agentH };
        let nextY = startY + agentH;

        if (!expandedAgents[agentId]) {
            // agent plié => on saute
            return nextY + verticalSpacing;
        }

        // Récupérer et trier ses enfants par weight
        const childIds = adjacency[agentId].filter(cid => {
            return !cid.startsWith('add_') && items[cid]?.id !== -1;
        });
        childIds.sort((a, b) => {
            const ca = items[a];
            const cb = items[b];
            return (ca.weight || 0) - (cb.weight || 0);
        });

        for (const cId of childIds) {
            const cvo = items[cId];
            const cy = nextY + verticalSpacing;
            if (cvo.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                nextY = DiagramLayout.layoutAgentRecursively(
                    cId, cy, level + 1, items, adjacency, expandedAgents, positions
                );
            } else {
                const w = 200, h = 40;
                const cx = x + indentX;
                positions[cId] = { x: cx, y: cy, w, h };
                nextY = cy + h;
            }
        }

        // bloc "+"
        const plusId = 'add_' + agentId;
        const plusY = nextY + verticalSpacing;
        positions[plusId] = {
            x: x + agentW / 2 - plusW / 2,
            y: plusY,
            w: plusW,
            h: plusH
        };
        nextY = plusY + plusH + verticalSpacing;

        return nextY;
    }
}