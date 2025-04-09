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
            const ayBottom = agPos.y + agPos.h / 2;

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
                const childCenterY = cPos.y;

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
        items: { [id: string]: OseliaRunVO | GPTAssistantAPIFunctionVO | OseliaRunFunctionCallVO },
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

        // On parcourt chaque run, on le place, puis on place ses fonctions GPT, puis leurs calls
        let currentY = 0;
        for (const runId of runIds) {
            currentY = this.layoutOneRunHierarchy(
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
     * Place un RUN, puis ses Fonctions GPT, puis leurs Calls (OseliaRunFunctionCallVO).
     * Retourne le Y final pour chaîner plusieurs runs verticalement.
     */
    private static layoutOneRunHierarchy(
        runId: string,
        startY: number,
        adjacency: { [id: string]: string[] },
        items: { [id: string]: any },
        positions: { [id: string]: BlockPosition },
        links: LinkDrawInfo[]
    ): number {
        // Dimensions basiques
        const w = 200, h = 40;
        const indentX = 300;
        const verticalSpacing = 30;

        // 1) On place le run
        //    disons qu'on le place dans la "colonne 0", centré en x = 0
        const xRun = 0;
        positions[runId] = {
            x: xRun - w / 2,
            y: startY,
            w,
            h
        };

        // Invoquons "niveau" pour enchaîner verticalement
        // => On démarre le prochain bloc en dessous
        let localY = startY + h + verticalSpacing;

        // 2) Retrouver ses enfants = les Fonctions GPT
        //    (vous pouvez filtrer : items[cid]._type === GPTAssistantAPIFunctionVO.API_TYPE_ID
        //     ou reconnaître "call_XX" si vous utilisez un ID préfixé)
        const functionIds = (adjacency[runId] || []).filter(cid =>
            items[cid]?._type === GPTAssistantAPIFunctionVO.API_TYPE_ID
        );

        // Coordonnées pour tracer les liens : le run sortira "par le milieu"
        const runCenterX = (xRun - w / 2) + w / 2;
        const runCenterY = startY + h / 2;

        // Pour éviter que les fonctions se chevauchent, on se contente de placer
        // chaque fonction GPT en-dessous de la précédente.
        for (const fId of functionIds) {

            // 2a) Placer la fonction GPT dans une colonne "x = indentX"
            const fX = xRun + indentX;
            positions[fId] = {
                x: fX,
                y: localY,
                w,
                h
            };

            // On trace un lien "run -> fonction"
            const fCenterX = fX + w / 2;
            const fCenterY = localY + h / 2;
            links.push({
                sourceItemId: runId,
                targetItemId: fId,
                pathPoints: this.createElbowPoints(
                    runCenterX, runCenterY,
                    fCenterX,   fCenterY
                )
            });

            // On stocke la coordonnée "bas" de la fonction pour enchaîner
            let nextY = localY + h + verticalSpacing;

            // 3) Les "calls" de cette fonction
            //    (On va chercher adjacency[fId], et on filtre "call_XXX")
            const callIds = (adjacency[fId] || []).filter(cid => cid.startsWith('call_'));

            // On place chaque call dans une colonne "indentX * 2"
            for (const cId of callIds) {
                const cX = xRun + (indentX * 2);
                positions[cId] = {
                    x: cX,
                    y: nextY,
                    w,
                    h
                };

                // Lien fonction -> call
                const cCenterX = cX + w / 2;
                const cCenterY = nextY + h / 2;
                links.push({
                    sourceItemId: fId,
                    targetItemId: cId,
                    pathPoints: this.createElbowPoints(
                        fCenterX, fCenterY,
                        cCenterX, cCenterY
                    )
                });

                // On descend encore
                nextY += h + verticalSpacing;
            }

            // Au final, on met localY = la position sous le dernier call (ou la fonction s'il n'y a pas de calls)
            localY = Math.max(localY, nextY);
        }

        // 4) On renvoie la position en Y où on s'est arrêté pour que le "run suivant"
        //    se place plus bas
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