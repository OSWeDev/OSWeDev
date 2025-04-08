import GPTAssistantAPIFunctionVO from "../../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO";
import OseliaRunTemplateVO from "../../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO";
import OseliaRunVO from "../../../../../../../../shared/modules/Oselia/vos/OseliaRunVO";

// src/layout/DiagramLayout.ts
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
     * Layout d'un RUN :
     * - On place le run au centre
     * - On place ses functions GPT en-dessous
     * - On trace un trait vertical + traits horizontaux
     */
    public static layoutRunDiagram(
        items: { [id: string]: OseliaRunVO | GPTAssistantAPIFunctionVO },
        adjacency: { [id: string]: string[] }
    ): {
            blockPositions: { [id: string]: BlockPosition };
            drawnLinks: LinkDrawInfo[];
        } {
        const blockPositions: { [id: string]: BlockPosition } = {};
        const drawnLinks: LinkDrawInfo[] = [];

        // Trouver tous les run
        const runIds = Object.keys(items).filter(id => items[id]._type === OseliaRunVO.API_TYPE_ID);

        let currentY = 0;
        for (const runId of runIds) {
            const { nextY } = this.layoutOneRun(
                runId, currentY,
                adjacency, items,
                blockPositions, drawnLinks
            );
            currentY = nextY + 40; // espace entre 2 runs
        }

        return { blockPositions, drawnLinks };
    }

    /**
     * Layout pour un Template (agents)
     * - On place chaque agent (récursif)
     * - On trace des "coudes" agent -> enfant + agent -> plus
     */
    public static layoutTemplateDiagram(
        items: { [id: string]: OseliaRunTemplateVO },
        adjacency: { [id: string]: string[] },
        expandedAgents: { [id: string]: boolean }
    ): {
            blockPositions: { [id: string]: BlockPosition };
            drawnLinks: LinkDrawInfo[];
        } {
        const blockPositions: { [id: string]: BlockPosition } = {};
        const drawnLinks: LinkDrawInfo[] = [];

        // trouver agents
        const agentIds = Object.keys(items).filter(id => items[id].run_type === OseliaRunVO.RUN_TYPE_AGENT);
        // trouver les "root"
        const rootAgents = agentIds.filter(aId => {
            const ag = items[aId];
            if (!ag.parent_run_id) return true;
            return !agentIds.includes(String(ag.parent_run_id));
        });

        let currentY = 0;
        // place chaque root
        for (const rootId of rootAgents) {
            currentY = this.layoutAgentRecursively(
                rootId, currentY, 0,
                items, adjacency, expandedAgents,
                blockPositions
            );
        }

        // tracer les liens
        for (const agId of agentIds) {
            if (!expandedAgents[agId]) continue;
            const agPos = blockPositions[agId];
            if (!agPos) continue;

            const ax = agPos.x + agPos.w/2;
            const ay = agPos.y + agPos.h/2;

            // lien agent->plus
            const plusId = 'add_' + agId;
            const plusPos = blockPositions[plusId];
            if (plusPos) {
                const px = plusPos.x + plusPos.w/2;
                const py = plusPos.y - plusPos.h/2;
                // coude
                drawnLinks.push({
                    sourceItemId: agId,
                    targetItemId: plusId,
                    pathPoints: [
                        { x: ax, y: ay },
                        { x: ax, y: py },
                    ]
                });
            }

            // lien agent->enfants
            const childIds = adjacency[agId].filter(cid => !cid.startsWith('add_'));
            for (const cId of childIds) {
                const cPos = blockPositions[cId];
                if (!cPos) continue;
                const cx = cPos.x + cPos.w/2;
                const cy = cPos.y + cPos.h/2;
                drawnLinks.push({
                    sourceItemId: agId,
                    targetItemId: cId,
                    pathPoints: [
                        { x: ax, y: ay },
                        { x: ax, y: cy },
                        { x: cx, y: cy },
                    ]
                });
            }
        }

        return { blockPositions, drawnLinks };
    }

    private static layoutOneRun(
        runId: string,
        startY: number,
        adjacency: { [id: string]: string[] },
        items: { [id: string]: any },
        positions: { [id: string]: BlockPosition },
        drawnLinks: LinkDrawInfo[]
    ): { nextY: number } {
        const runW = 200, runH = 40;
        const indentX = 300;
        const functionW = 180, functionH = 40;
        const spacing = 10;

        // place le run
        const runX = -runW / 2;
        positions[runId] = { x: runX, y: startY, w: runW, h: runH };

        // enfants (GPT Functions)
        const fIds = adjacency[runId] || [];
        let minY = startY;
        let maxY = startY + runH;
        const runCenterX = runX + runW/2;
        const runBottomY = startY + runH;

        // stocker la position
        let nextY = startY + runH;
        const functionCenters: Array<{ id: string; cx: number; cy: number }> = [];
        for (const fid of fIds) {
            const fy = nextY + spacing;
            const fx = runX + indentX;
            positions[fid] = { x: fx, y: fy, w: functionW, h: functionH };

            const fCenterY = fy + functionH/2;
            functionCenters.push({ id: fid, cx: fx, cy: fCenterY });

            if (fCenterY < minY) minY = fCenterY;
            if (fCenterY > maxY) maxY = fCenterY;

            nextY = fy + functionH;
        }

        // On trace 1 trait vertical
        if (functionCenters.length > 0) {
            drawnLinks.push({
                sourceItemId: runId,
                targetItemId: runId + '_vertical',
                pathPoints: [
                    { x: runCenterX, y: runBottomY },
                    { x: runCenterX, y: maxY }
                ]
            });
        }

        // On trace 1 trait horizontal par function
        for (const fc of functionCenters) {
            drawnLinks.push({
                sourceItemId: runId,
                targetItemId: fc.id,
                pathPoints: [
                    { x: runCenterX, y: fc.cy },
                    { x: fc.cx,      y: fc.cy }
                ]
            });
        }

        return { nextY };
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
        const spacing = 20;
        const indentX = 250;

        // place agent
        const ax = -agentW/2 + level * indentX;
        positions[agentId] = { x: ax, y: startY, w: agentW, h: agentH };
        let nextY = startY + agentH;

        // si replié
        if (!expandedAgents[agentId]) {
            return nextY + spacing;
        }

        // enfants
        const childIds = adjacency[agentId].filter(cid => {
            if (cid.startsWith('add_')) return false;
            const cvo = items[cid];
            return (cvo && cvo.id !== -1);
        });
        // tri
        childIds.sort((a, b) => {
            const ca = items[a];
            const cb = items[b];
            return (ca.weight || 0) - (cb.weight || 0);
        });

        for (const cId of childIds) {
            const cvo = items[cId];
            const cy = nextY + spacing;
            if (cvo.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                nextY = this.layoutAgentRecursively(
                    cId, cy, level+1,
                    items, adjacency, expandedAgents, positions
                );
            } else {
                positions[cId] = { x: ax + indentX, y: cy, w: 200, h: 40 };
                nextY = cy + 40;
            }
        }

        // bloc "+"
        const plusId = 'add_' + agentId;
        const plusY = nextY + spacing;
        positions[plusId] = {
            x: ax + agentW/2 - plusW/2,
            y: plusY,
            w: plusW,
            h: plusH
        };
        nextY = plusY + plusH;

        return nextY;
    }
}
