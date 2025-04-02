/**
 * ----------------------------------------------------------------------------
 * CanvasDiagram
 * ----------------------------------------------------------------------------
 * Ce composant Vue/TypeScript/Vue-Class-Component dessine un flow (ou diagramme)
 * de runs (OseliaRunVO) ou de templates de runs (OseliaRunTemplateVO) sur un
 * <canvas>. Il gère :
 *  - Zoom & pan (molette + drag)
 *  - Drag & drop de réordonnancement des enfants (mode Template)
 *  - Blocs "+" pour ajouter des enfants
 *  - Menu contextuel
 *  - Affichage d'un tooltip "hover" (état, avec traduction via this.t())
 *  - Layout vertical ou horizontal (selon qu'on est en run instancié ou template)
 *
 * ----------------------------------------------------------------------------
 * AJUSTEMENTS EXIGÉS :
 * ----------------------------------------------------------------------------
 * 1) En mode Template :
 *    - Au drag & drop pour reorder, on veut VOIR le bloc qu'on déplace en temps réel.
 *    - La position finale ne doit PAS forcer le layout à "s'étendre" ou à figer
 *      le bloc là où on lâche la souris. On veut juste calculer l'ordre final
 *      en se basant sur la position du bloc parmi ses frères/sœurs, puis recalculer
 *      le layout.
 *    - Pour la fluidité, on peut éviter de redessiner tout le diagramme à chaque
 *      pixel de déplacement. On met en place une technique de "snapshot" :
 *      on enregistre l'image de fond, puis on dessine par-dessus le bloc
 *      "en mouvement" seulement.
 *
 * 2) En mode Run instancié :
 *    - On veut voir la ligne verticale (du run jusqu'au plus bas enfant).
 *      Donc, sous forme d'un trait vertical depuis la base du run jusqu'au plus
 *      bas des blocs enfants (en plus du trait horizontal).
 */

import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import OseliaRunTemplateVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunVO';
import './CanvasDiagram.scss';
import { ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import CRUDCreateModalComponent from '../../table_widget/crud_modals/create/CRUDCreateModalComponent';
import IDistantVOBase from '../../../../../../../shared/modules/IDistantVOBase';
import { ModuleDAOAction } from '../../../../dao/store/DaoStore';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import { query } from '../../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import NumSegment from '../../../../../../../shared/modules/DataRender/vos/NumSegment';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import SortByVO from '../../../../../../../shared/modules/ContextFilter/vos/SortByVO';
import { field_names } from '../../../../../../../shared/tools/ObjectHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import OseliaRunFunctionCallVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunFunctionCallVO';
import VueComponentBase from '../../../../VueComponentBase';
import GPTAssistantAPIFunctionVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import NumRange from '../../../../../../../shared/modules/DataRender/vos/NumRange'; // important si on manipule NumRange
import { threadId } from 'worker_threads';

interface LinkDrawInfo {
    sourceItemId: string;
    targetItemId: string;
    pathPoints: { x: number; y: number }[];
}

interface AgentLayoutInfo {
    childrenIds: string[];
    plusId: string;
    expanded: boolean;
}

interface RunLayoutInfo {
    functionIds: string[];
}

@Component({
    template: require('./CanvasDiagram.pug'),
})
export default class CanvasDiagram extends VueComponentBase {

    // --------------------------------------------------------------------------
    // PROPS
    // --------------------------------------------------------------------------
    @Prop()
    readonly items!: { [id: string]: OseliaRunTemplateVO | OseliaRunVO };

    @Prop()
    private isRunVo!: boolean;

    @Prop({ default: null })
    private selectedItem!: string | null;

    @Prop({ default: null })
    private updatedItem!: OseliaRunTemplateVO | null;

    @Prop({ default: false })
    private reDraw!: boolean;

    // --------------------------------------------------------------------------
    // STORE GETTERS / ACTIONS
    // --------------------------------------------------------------------------
    @ModuleDashboardPageGetter
    private get_Crudcreatemodalcomponent!: CRUDCreateModalComponent;

    @ModuleDAOAction
    private storeDatas!: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    // --------------------------------------------------------------------------
    // DONNÉES DE COMPOSANT
    // --------------------------------------------------------------------------
    private throttle_drawDiagram = ThrottleHelper.declare_throttle_with_stackable_args(
        'OseliaRunGraphWidgetComponent.drawDiagram',
        this.throttled_drawDiagram.bind(this),
        50
    );

    // CANVAS
    private ctx: CanvasRenderingContext2D | null = null;
    private scale: number = 1;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private isDraggingCanvas = false;
    private lastPanX = 0;
    private lastPanY = 0;

    // LAYOUT & ADJACENCE
    private blockPositions: { [id: string]: { x: number; y: number; w: number; h: number } } = {};
    private agentLayoutInfos: { [agentId: string]: AgentLayoutInfo } = {};
    private runLayoutInfos: { [runId: string]: RunLayoutInfo } = {};
    private adjacency: { [id: string]: string[] } = {};

    // INFOS FONCTIONS GPT (pour le run instancié)
    private functionsInfos: {
        [id: string]: {
            gptFunction: GPTAssistantAPIFunctionVO;
            runFunction: OseliaRunFunctionCallVO;
        }
    } = {};

    // MENU "+"
    private menuBlock = {
        visible: false,
        plusItemId: null as string | null,
        agentId: null as string | null,
        width: 120,
        height: 90,
        hoveredIndex: -1,
        options: ['AGENT', 'FOREACH', 'ASSISTANT'] as const,
        offsetX: 50,
        offsetY: 0,
    };

    // DRAG & DROP REORDONNANCEMENT
    private isReorderingChild: boolean = false;
    private draggingChildId: string | null = null;
    private dragParentAgentId: string | null = null;
    private dragOffsetY: number = 0;
    private possibleDrag: boolean = false;
    private mouseDownX: number = 0;
    private mouseDownY: number = 0;
    private moveThreshold: number = 5;

    /**
     * Position "fantôme" du bloc en train d'être bougé,
     * pour l'afficher à l'écran SANS casser le layout (on ne bouge pas blockPositions).
     */
    private draggingGhostPos: { x: number; y: number } | null = null;

    // LIENS
    private drawnLinks: LinkDrawInfo[] = [];

    // AGENTS (template) : pliage/dépliage
    private expandedAgents: { [agentId: string]: boolean } = {};

    // GESTION DU HOVER (tooltip)
    private hoveredItemId: string | null = null;
    private hoveredX: number = 0;
    private hoveredY: number = 0;

    // ORDRE D'AFFICHAGE
    private drawingOrder: string[] = [];

    /**
     * Snapshot du diagramme "en fond" pour un drag fluide.
     * Lorsque l'utilisateur drag un bloc, on utilise ce snapshot et on ne
     * redessine que le bloc "fantôme" dessus, évitant de recalculer tout.
     */
    private backgroundImageData: ImageData | null = null;

    // =========================================================================
    // WATCHERS
    // =========================================================================
    @Watch('selectedItem')
    private async onSelectedItemChange() {
        await this.throttle_drawDiagram();
    }

    @Watch('reDraw')
    private async onReDrawChange() {
        await this.throttle_drawDiagram();
    }

    @Watch('updatedItem')
    private async onUpdatedItemChange() {
        if (this.updatedItem) {
            this.items[this.updatedItem.id] = this.updatedItem;
            await this.throttle_drawDiagram();
        }
    }

    @Watch('items', { deep: true, immediate: true })
    private async onItemsChange() {
        if (this.isRunVo) {
            await this.prepareRunData();
        } else {
            await this.prepareTemplateData();
        }
        await this.defineFixedLayout();
        await this.throttle_drawDiagram();
    }

    // --------------------------------------------------------------------------
    // HOOKS
    // --------------------------------------------------------------------------
    mounted() {
        this.initCanvas();

        // Les events canvas
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        canvas.addEventListener('wheel', this.onWheel, { passive: false });
        canvas.addEventListener('mousedown', this.onMouseDown);
        canvas.addEventListener('mouseup', this.onMouseUp);
        canvas.addEventListener('mousemove', this.onMouseMove);

        window.addEventListener('resize', this.onResize);
    }

    beforeDestroy() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (canvas) {
            canvas.removeEventListener('wheel', this.onWheel);
            canvas.removeEventListener('mousedown', this.onMouseDown);
            canvas.removeEventListener('mouseup', this.onMouseUp);
            canvas.removeEventListener('mousemove', this.onMouseMove);
        }
        window.removeEventListener('resize', this.onResize);
    }

    // =========================================================================
    // PRÉPARATION DES DONNÉES (RUN vs TEMPLATE)
    // =========================================================================
    private async prepareRunData() {
        const _items: { [id: string]: OseliaRunVO } = (this.items as { [id: string]: OseliaRunVO });
        // Adjacency
        this.adjacency = {};
        for (const itemId of Object.keys(_items)) {
            this.adjacency[itemId] = [];
        }

        const runIds = Object.keys(_items).filter(id => _items[id]._type === OseliaRunVO.API_TYPE_ID);
        if (!runIds.length) return;

        const allRunIdsNum = runIds.map(rid => Number(rid));
        const allRunFunctions: OseliaRunFunctionCallVO[] = await query(OseliaRunFunctionCallVO.API_TYPE_ID)
            // selon config : filter_by_num_any, filter_by_num_has, etc. Ici on suppose eq ou any
            .filter_by_num_has(field_names<OseliaRunFunctionCallVO>().oselia_run_id, allRunIdsNum)
            .select_vos<OseliaRunFunctionCallVO>();

        // GPT
        const allGptFunctionIds = allRunFunctions.map(f => f.gpt_function_id);
        const uniqueFunctionIds = [...new Set(allGptFunctionIds)];
        let allGptFunctions: GPTAssistantAPIFunctionVO[] = [];
        if (uniqueFunctionIds.length > 0) {
            allGptFunctions = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID)
                .filter_by_ids(uniqueFunctionIds)
                .select_vos<GPTAssistantAPIFunctionVO>();
        }

        const mapGptFunctions: { [fid: number]: GPTAssistantAPIFunctionVO } = {};
        for (const gf of allGptFunctions) {
            mapGptFunctions[gf.id] = gf;
        }

        const runFunctionMap: { [rid: number]: number[] } = {};
        for (const runFunc of allRunFunctions) {
            if (!runFunctionMap[runFunc.oselia_run_id]) {
                runFunctionMap[runFunc.oselia_run_id] = [];
            }
            runFunctionMap[runFunc.oselia_run_id].push(runFunc.gpt_function_id);
        }

        for (const rid of runIds) {
            const runIdNum = Number(rid);
            const runFids = runFunctionMap[runIdNum] || [];

            for (const fId of runFids) {
                const gfVO = mapGptFunctions[fId];
                if (!gfVO) continue;

                const runFunc = allRunFunctions.find(rf => (rf.gpt_function_id === gfVO.id && rf.oselia_run_id === runIdNum));
                if (!runFunc) continue;

                // Mémoriser
                this.$set(this.functionsInfos, String(gfVO.id), {
                    gptFunction: gfVO,
                    runFunction: runFunc,
                });

                if (!this.items[gfVO.id]) {
                    this.$set(this.items, gfVO.id, gfVO);
                }

                this.adjacency[rid].push(String(gfVO.id));
                if (!this.adjacency[gfVO.id]) {
                    this.adjacency[gfVO.id] = [];
                }
                this.adjacency[gfVO.id].push(rid);
            }
        }
    }

    private async prepareTemplateData() {
        const _items: { [id: string]: OseliaRunTemplateVO } = (this.items as { [id: string]: OseliaRunTemplateVO });
        this.adjacency = {};
        for (const itemId of Object.keys(_items)) {
            this.adjacency[itemId] = [];
        }

        const allChildrenRanges: NumRange[] = [];
        for (const itemId of Object.keys(_items)) {
            const item = _items[itemId];
            if (!item) continue;

            if (item.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                const addId = 'add_' + itemId;
                if (!_items[addId]) {
                    const fakeAdd = new OseliaRunTemplateVO();
                    fakeAdd.id = -1;
                    fakeAdd.run_type = 9999;
                    fakeAdd.name = '+';
                    this.$set(this.items, addId, fakeAdd);
                }
                if (!this.adjacency[addId]) {
                    this.adjacency[addId] = [];
                }
                this.adjacency[itemId].push(addId);
                this.adjacency[addId].push(itemId);

                if (item.children && item.children.length) {
                    allChildrenRanges.push(...item.children);
                }
            }
        }

        if (allChildrenRanges.length > 0) {
            const allChildrenFetched: OseliaRunTemplateVO[] = await query(OseliaRunTemplateVO.API_TYPE_ID)
                .filter_by_ids(allChildrenRanges)
                .select_vos<OseliaRunTemplateVO>();

            for (const childVO of allChildrenFetched) {
                if (!this.items[childVO.id]) {
                    this.$set(this.items, childVO.id, childVO);
                }
            }

            for (const itemId of Object.keys(_items)) {
                const item = _items[itemId];
                if (!item || item.run_type !== OseliaRunVO.RUN_TYPE_AGENT) continue;

                if (item.children && item.children.length) {
                    for (const nr of item.children) {
                        // Filtrage simple : on cherche les VOs correspondants
                        const childVoArray = allChildrenFetched.filter(c => c.id >= nr.min && c.id <= nr.max);
                        for (const childVo of childVoArray) {
                            const cid = String(childVo.id);
                            this.adjacency[itemId].push(cid);
                            if (!this.adjacency[cid]) {
                                this.adjacency[cid] = [];
                            }
                            this.adjacency[cid].push(itemId);
                        }
                    }
                }
            }
        }
    }

    // =========================================================================
    // CALCUL DE LAYOUT
    // =========================================================================
    private async defineFixedLayout() {
        this.blockPositions = {};
        this.agentLayoutInfos = {};
        this.runLayoutInfos = {};
        this.drawingOrder = [];

        if (this.isRunVo) {
            const runIds = Object.keys(this.items).filter(id => this.items[id]._type === OseliaRunVO.API_TYPE_ID);
            if (!runIds.length) return;

            // Suppose un seul run principal
            const mainRunId = runIds[0];
            await this.layoutRunAndFunctions(mainRunId, 0, 0);
            return;
        }

        // Template
        for (const itemId of Object.keys(this.items)) {
            const vo = this.items[itemId];
            if (vo.run_type === OseliaRunVO.RUN_TYPE_AGENT && typeof this.expandedAgents[itemId] === 'undefined') {
                this.$set(this.expandedAgents, itemId, true);
            }
        }

        const agentIds = Object.keys(this.items).filter(id => this.items[id].run_type === OseliaRunVO.RUN_TYPE_AGENT);
        const rootAgents = agentIds.filter(agentId => {
            const parentId = this.items[agentId].parent_run_id;
            if (!parentId) return true;
            return !agentIds.includes(String(parentId));
        });

        let currentY = 0;
        for (const rootId of rootAgents) {
            currentY = await this.layoutAgentRecursively(rootId, currentY, 0);
        }
    }

    private async layoutRunAndFunctions(runId: string, startY: number, level: number): Promise<number> {
        const w = 200, h = 40;
        const verticalSpacing = 1;
        const indentX = 300;

        const x = -w / 2 + level * indentX;
        this.blockPositions[runId] = { x, y: startY, w, h };
        this.drawingOrder.push(runId);

        let nextY = startY + h;

        // On récupère les fonctions => adjacency
        const functionIds: string[] = [];
        const possibleChildren = this.adjacency[runId] || [];
        for (const cId of possibleChildren) {
            if (this.items[cId]._type === GPTAssistantAPIFunctionVO.API_TYPE_ID) {
                functionIds.push(cId);
            }
        }
        this.runLayoutInfos[runId] = { functionIds };

        for (const fId of functionIds) {
            const childY = nextY + verticalSpacing;
            const cx = x + indentX * (level + 1);
            this.blockPositions[fId] = { x: cx, y: childY, w, h };
            this.drawingOrder.push(fId);
            nextY = childY + h;
        }

        return nextY;
    }

    private async layoutAgentRecursively(agentId: string, startY: number, level: number): Promise<number> {
        const agentW = 200, agentH = 40;
        const plusW = 30, plusH = 30;
        const verticalSpacing = 1;
        const deltaYBetweenAgents = 1;
        const indentX = 300;

        const plusId = 'add_' + agentId;
        this.agentLayoutInfos[agentId] = {
            childrenIds: [],
            plusId,
            expanded: this.expandedAgents[agentId],
        };

        // Place l'agent
        const x = -agentW / 2 + level * indentX;
        this.blockPositions[agentId] = { x, y: startY, w: agentW, h: agentH };
        this.drawingOrder.push(agentId);

        let nextY = startY + agentH;

        if (!this.expandedAgents[agentId]) {
            nextY += deltaYBetweenAgents;
            return nextY;
        }

        // Récup enfants
        const vo = this.items[agentId] as OseliaRunTemplateVO;
        let childIds: string[] = [];
        if (vo.children && vo.children.length) {
            childIds = (this.adjacency[agentId] || []).filter(cid => {
                return !cid.startsWith('add_') && this.items[cid].id !== -1;
            });
            childIds.sort((a, b) => {
                const cA = this.items[a] as OseliaRunTemplateVO;
                const cB = this.items[b] as OseliaRunTemplateVO;
                return (cA.weight || 0) - (cB.weight || 0);
            });
        }
        this.agentLayoutInfos[agentId].childrenIds = childIds;

        for (const cId of childIds) {
            const cVo = this.items[cId] as OseliaRunTemplateVO;
            const childY = nextY + verticalSpacing;
            if (cVo.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                nextY = await this.layoutAgentRecursively(cId, childY, level + 1);
            } else {
                const w = 200, h = 40;
                const cx = x + indentX * (level + 1);
                this.blockPositions[cId] = { x: cx, y: childY, w, h };
                this.drawingOrder.push(cId);
                nextY = childY + h;
            }
        }

        // bloc "+"
        const plusY = nextY + verticalSpacing;
        this.blockPositions[plusId] = { x: x + agentW / 2 - plusW / 2, y: plusY, w: plusW, h: plusH };
        this.drawingOrder.push(plusId);
        nextY = plusY + plusH + deltaYBetweenAgents;

        return nextY;
    }

    // =========================================================================
    // DESSIN + BACKGROUND SNAPSHOT
    // =========================================================================
    private async throttled_drawDiagram(forceFullRedraw: boolean = true) {
        if (!this.ctx) return;
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const ctx = this.ctx;

        // S'il faut forcer un redraw global (ex: on vient de recalc le layout ou on n'est pas en drag)
        if (forceFullRedraw) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.translate(this.offsetX, this.offsetY);
            ctx.scale(this.scale, this.scale);

            // Liens derrière
            this.drawLinks(ctx);

            // Blocs
            for (const itemId of this.drawingOrder) {
                this.drawBlock(ctx, itemId);
            }

            // Menu "+"
            if (this.menuBlock.visible && this.menuBlock.plusItemId) {
                this.drawMenuBlock(ctx);
            }

            ctx.restore();

            // Tooltip
            if (this.hoveredItemId) {
                this.drawTooltip(ctx, this.hoveredItemId);
            }

            // On stocke un snapshot pour fluidifier le drag
            this.backgroundImageData = ctx.getImageData(0, 0, canvas.width, canvas.height, {});
            return;
        }

        // Sinon, on est en drag => on réutilise le snapshot
        if (this.backgroundImageData) {
            // On remet le fond
            ctx.putImageData(this.backgroundImageData, 0, 0);
        } else {
            // Au cas où pas de snapshot => on force un full redraw
            await this.throttle_drawDiagram(true);
            return;
        }

        // Dessiner le bloc "fantôme" (celui qui est en drag) s'il y en a un
        if (this.draggingChildId && this.isReorderingChild && this.draggingGhostPos) {
            ctx.save();
            ctx.translate(this.offsetX, this.offsetY);
            ctx.scale(this.scale, this.scale);

            this.drawBlockAtPos(ctx, this.draggingChildId, this.draggingGhostPos);

            ctx.restore();

            // Tooltip éventuel
            if (this.hoveredItemId) {
                this.drawTooltip(ctx, this.hoveredItemId);
            }
        }
    }

    /**
     * Dessine un bloc donné à une position explicite (ne modifie pas blockPositions).
     */
    private drawBlockAtPos(ctx: CanvasRenderingContext2D, itemId: string, posOverride: { x: number; y: number }) {
        const item = this.items[itemId];
        const defaultPos = this.blockPositions[itemId];
        if (!defaultPos) return;

        let fillColor = '#f2dfda';
        if (itemId.startsWith('add_')) {
            fillColor = '#999';
        } else if (item.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
            fillColor = '#5B8FF9';
        } else if (item.run_type === OseliaRunVO.RUN_TYPE_FOREACH_IN_SEPARATED_THREADS) {
            fillColor = '#5AD8A6';
        } else if (item.run_type === OseliaRunVO.RUN_TYPE_ASSISTANT) {
            fillColor = '#F6BD16';
        }

        const isSelected = (this.selectedItem === itemId);
        const iconInfo = (item._type == GPTAssistantAPIFunctionVO.API_TYPE_ID ? this.getStateIcon(this.functionsInfos[item.id].runFunction.state) : this.getStateIcon(item.state));

        ctx.save();
        ctx.globalAlpha = 0.8; // un peu transparent pour un "ghost" effect
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = isSelected ? '#00f' : (iconInfo.color ? iconInfo.color : '#4A90E2');
        ctx.lineWidth = isSelected ? 3 : 2;

        // On garde la largeur/hauteur d'origine
        ctx.beginPath();
        ctx.rect(posOverride.x, posOverride.y, defaultPos.w, defaultPos.h);
        ctx.fill();
        ctx.stroke();

        // texte
        ctx.fillStyle = '#000';
        ctx.font = '14px sans-serif';
        if (this.isRunVo) {
            if (item._type === OseliaRunVO.API_TYPE_ID) {
                const run = item as OseliaRunVO;
                const textToDraw = run.name || 'Item';
                ctx.fillText(textToDraw, posOverride.x + 10, posOverride.y + 24);

                ctx.fillText(iconInfo.icon, posOverride.x + defaultPos.w - 20, posOverride.y + 24);
            } else if (item._type === GPTAssistantAPIFunctionVO.API_TYPE_ID) {
                const info = this.functionsInfos[item.id];
                if (info && info.gptFunction) {
                    const fVo = info.gptFunction;
                    const textToDraw = fVo.gpt_function_name || 'Function';
                    ctx.fillText(textToDraw, posOverride.x + 10, posOverride.y + 24);
                }
                if (info && info.runFunction) {
                    ctx.fillText(iconInfo.icon, posOverride.x + defaultPos.w - 20, posOverride.y + 24);
                }
            }
        } else {
            if (itemId.startsWith('add_')) {
                ctx.fillText('+', posOverride.x + 10, posOverride.y + 24);
            } else {
                ctx.fillText(item.name || 'Item', posOverride.x + 10, posOverride.y + 24);
                ctx.fillText(iconInfo.icon, posOverride.x + defaultPos.w - 20, posOverride.y + 24);
            }
        }
        ctx.restore();
    }

    private drawBlock(ctx: CanvasRenderingContext2D, itemId: string) {
        // On ne dessine pas le bloc en question si on est en train de le dragger (puisqu'on dessine un ghost)
        if (this.draggingChildId === itemId && this.isReorderingChild && this.draggingGhostPos) {
            return;
        }

        const pos = this.blockPositions[itemId];
        if (!pos) return;

        const item = this.items[itemId];
        let fillColor = '#f2dfda';

        if (itemId.startsWith('add_')) {
            fillColor = '#999';
        } else if (item.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
            fillColor = '#5B8FF9';
        } else if (item.run_type === OseliaRunVO.RUN_TYPE_FOREACH_IN_SEPARATED_THREADS) {
            fillColor = '#5AD8A6';
        } else if (item.run_type === OseliaRunVO.RUN_TYPE_ASSISTANT) {
            fillColor = '#F6BD16';
        }

        const isSelected = (this.selectedItem === itemId);
        const iconInfo = (item._type == GPTAssistantAPIFunctionVO.API_TYPE_ID ? this.getStateIcon(this.functionsInfos[item.id].runFunction.state) : this.getStateIcon(item.state));

        ctx.save();
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = isSelected ? '#00f' : (iconInfo.color ? iconInfo.color : '#4A90E2');
        ctx.lineWidth = isSelected ? 4 : 3;
        ctx.beginPath();
        ctx.rect(pos.x, pos.y, pos.w, pos.h);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.font = '14px sans-serif';

        if (this.isRunVo) {
            if (item._type === OseliaRunVO.API_TYPE_ID) {
                const run = item as OseliaRunVO;
                const textToDraw = run.name || 'Item';
                ctx.fillText(textToDraw, pos.x + 10, pos.y + 24);
                ctx.fillText(iconInfo.icon, pos.x + pos.w - 20, pos.y + 24);
            } else if (item._type === GPTAssistantAPIFunctionVO.API_TYPE_ID) {
                const info = this.functionsInfos[item.id];
                if (info && info.gptFunction) {
                    const fVo = info.gptFunction;
                    const textToDraw = fVo.gpt_function_name || 'Function';
                    ctx.fillText(textToDraw, pos.x + 10, pos.y + 24);
                }
                if (info && info.runFunction) {
                    ctx.fillText(iconInfo.icon, pos.x + pos.w - 20, pos.y + 24);
                }
            }
        } else {
            if (itemId.startsWith('add_')) {
                ctx.fillText('+', pos.x + 10, pos.y + 24);
            } else {
                ctx.fillText(item.name || 'Item', pos.x + 10, pos.y + 24);
                ctx.fillText(iconInfo.icon, pos.x + pos.w - 20, pos.y + 24);
            }
        }
        ctx.restore();
    }

    private drawLinks(ctx: CanvasRenderingContext2D) {
        this.drawnLinks = [];

        if (this.isRunVo) {
            // run -> functions + trait vertical
            for (const runId of Object.keys(this.runLayoutInfos)) {
                const info = this.runLayoutInfos[runId];
                const runPos = this.blockPositions[runId];
                if (!runPos) continue;

                const runCenterX = runPos.x + runPos.w / 2;
                const runBottomY = runPos.y + runPos.h;
                let minY: number | null = null; // on veut tracer un trait vertical du bas du run à la "hauteur" des enfants
                let maxY: number | null = null;

                for (const fId of info.functionIds) {
                    const fPos = this.blockPositions[fId];
                    if (!fPos) continue;

                    const fyCenter = fPos.y + fPos.h / 2;
                    const fxLeft = fPos.x;

                    // trait horizontal run->function
                    ctx.save();
                    ctx.strokeStyle = 'gray';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(runCenterX, fyCenter);
                    ctx.lineTo(fxLeft, fyCenter);
                    ctx.stroke();
                    ctx.restore();

                    this.drawnLinks.push({
                        sourceItemId: runId,
                        targetItemId: fId,
                        pathPoints: [
                            { x: runCenterX, y: fyCenter },
                            { x: fxLeft, y: fyCenter },
                        ],
                    });

                    // on repère minY / maxY
                    if (minY === null || fyCenter < minY) {
                        minY = fyCenter;
                    }
                    if (maxY === null || fyCenter > maxY) {
                        maxY = fyCenter;
                    }
                }

                // tracer un trait vertical depuis runBottomY jusqu'à minY/maxY
                if (minY != null && maxY != null) {
                    ctx.save();
                    ctx.strokeStyle = 'gray';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(runCenterX, runBottomY);
                    ctx.lineTo(runCenterX, maxY );
                    ctx.stroke();
                    ctx.restore();
                }
            }
        } else {
            // Template
            for (const agentId of Object.keys(this.agentLayoutInfos)) {
                const info = this.agentLayoutInfos[agentId];
                const agentPos = this.blockPositions[agentId];
                if (!agentPos) continue;

                const ax = agentPos.x + agentPos.w / 2;
                const ay = agentPos.y + agentPos.h;

                if (info.expanded) {
                    // Lien agent->plus
                    const plusPos = this.blockPositions[info.plusId];
                    if (plusPos) {
                        const px = plusPos.x + plusPos.w / 2;
                        const py = plusPos.y + plusPos.h / 2;

                        ctx.save();
                        ctx.strokeStyle = 'gray';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(ax, ay);
                        ctx.lineTo(ax, py);
                        ctx.stroke();
                        ctx.restore();

                        this.drawnLinks.push({
                            sourceItemId: agentId,
                            targetItemId: info.plusId,
                            pathPoints: [
                                { x: ax, y: ay },
                                { x: ax, y: py },
                            ],
                        });
                    }

                    // Lien agent->enfants
                    for (const cId of info.childrenIds) {
                        const cPos = this.blockPositions[cId];
                        if (!cPos) continue;

                        const cy = cPos.y + cPos.h / 2;
                        const cxLeft = cPos.x;
                        ctx.save();
                        ctx.strokeStyle = 'gray';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(ax, cy);
                        ctx.lineTo(cxLeft, cy);
                        ctx.stroke();
                        ctx.restore();

                        this.drawnLinks.push({
                            sourceItemId: agentId,
                            targetItemId: cId,
                            pathPoints: [
                                { x: ax, y: cy },
                                { x: cxLeft, y: cy },
                            ],
                        });
                    }
                }
            }
        }
    }

    private drawTooltip(ctx: CanvasRenderingContext2D, itemId: string) {
        const item = this.items[itemId];
        if (!item) return;

        const iconInfo = (item._type == GPTAssistantAPIFunctionVO.API_TYPE_ID ? this.getStateIcon(this.functionsInfos[itemId].runFunction.state) : this.getStateIcon(item.state));

        const text = iconInfo.info || 'Inconnu';

        ctx.save();
        ctx.resetTransform();
        const tx = this.hoveredX + 10;
        const ty = this.hoveredY + 20;

        ctx.font = '14px sans-serif';
        const m = ctx.measureText(text);
        const pad = 6;
        const boxW = m.width + pad * 2;
        const boxH = 24;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(tx, ty, boxW, boxH);

        ctx.fillStyle = '#fff';
        ctx.fillText(text, tx + pad, ty + 16);
        ctx.restore();
    }

    // =========================================================================
    // ÉVÉNEMENTS SOURIS
    // =========================================================================
    private initCanvas() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;
        this.ctx = canvas.getContext('2d',{ willReadFrequently: true })!;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.offsetX = canvas.width / 2;
        this.offsetY = canvas.height / 2;
    }

    private async onResize() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.offsetX = canvas.width / 2;
        this.offsetY = canvas.height / 2;
        await this.throttle_drawDiagram(true);
    }

    private screenToDiag(sx: number, sy: number): { x: number; y: number } {
        return {
            x: (sx - this.offsetX) / this.scale,
            y: (sy - this.offsetY) / this.scale,
        };
    }

    private async onWheel(e: WheelEvent) {
        e.preventDefault();
        if (!this.ctx) return;

        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const before = this.screenToDiag(mx, my);
        const delta = (e.deltaY > 0) ? -0.1 : 0.1;
        this.scale = Math.max(0.05, this.scale + delta);

        const after = this.screenToDiag(mx, my);
        const dx = after.x - before.x;
        const dy = after.y - before.y;
        this.offsetX += dx * this.scale;
        this.offsetY += dy * this.scale;

        await this.throttle_drawDiagram(true);
    }

    private onMouseDown(e: MouseEvent) {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const diagPos = this.screenToDiag(mx, my);

        // Fermer le menu ?
        if (this.menuBlock.visible) {
            const clickedIndex = this.checkMenuBlockClick(diagPos.x, diagPos.y);
            if (clickedIndex >= 0) {
                const option = this.menuBlock.options[clickedIndex];
                this.addChild(option);
                this.hideMenu();
                return;
            }
            this.hideMenu();
        }

        // Vérif bloc cliqué
        let clickedBlock: string | null = null;
        for (const itemId of this.drawingOrder) {
            const pos = this.blockPositions[itemId];
            if (!pos) continue;
            if (
                diagPos.x >= pos.x &&
                diagPos.x <= pos.x + pos.w &&
                diagPos.y >= pos.y &&
                diagPos.y <= pos.y + pos.h
            ) {
                clickedBlock = itemId;
                break;
            }
        }

        if (!clickedBlock) {
            // Pan
            this.isDraggingCanvas = true;
            this.lastPanX = mx;
            this.lastPanY = my;
            this.$emit('select_item', null);
            return;
        }

        // Bloc "+"
        if (clickedBlock.startsWith('add_')) {
            const agentId = clickedBlock.substring(4);
            if (this.menuBlock.visible) this.hideMenu();
            else this.showMenu(clickedBlock, agentId);
            return;
        }

        this.$emit('select_item', clickedBlock, (this.functionsInfos ? (this.functionsInfos[clickedBlock] ? this.functionsInfos[clickedBlock].runFunction : null) : null) || null);

        // DRAG reorder
        this.mouseDownX = diagPos.x;
        this.mouseDownY = diagPos.y;
        this.possibleDrag = false;

        const vo = this.items[clickedBlock];
        const parentId = vo.parent_run_id ? String(vo.parent_run_id) : null;
        if (parentId && this.items[parentId]?.run_type === OseliaRunVO.RUN_TYPE_AGENT && !this.isRunVo) {
            // on est potentiellement en reorder
            this.possibleDrag = true;
            this.draggingChildId = clickedBlock;
            this.dragParentAgentId = parentId;
            const pos = this.blockPositions[clickedBlock];
            this.dragOffsetY = diagPos.y - pos.y;

            // init la position du ghost = position actuelle
            this.draggingGhostPos = { x: pos.x, y: pos.y };
        } else {
            // pas un reorder
            this.draggingChildId = clickedBlock;
            this.draggingGhostPos = null;
        }
    }

    private async onMouseMove(e: MouseEvent) {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const diagPos = this.screenToDiag(mx, my);

        // hover
        this.updateHoveredItem(diagPos.x, diagPos.y, mx, my);

        // Pan
        if (this.isDraggingCanvas) {
            const dx = mx - this.lastPanX;
            const dy = my - this.lastPanY;
            this.offsetX += dx;
            this.offsetY += dy;
            this.lastPanX = mx;
            this.lastPanY = my;

            // full redraw
            await this.throttle_drawDiagram(true);
            return;
        }

        // DRAG reorder
        if (this.possibleDrag && this.draggingChildId) {
            const distX = diagPos.x - this.mouseDownX;
            const distY = diagPos.y - this.mouseDownY;
            const dist = Math.sqrt(distX * distX + distY * distY);
            if (dist > this.moveThreshold) {
                // On enclenche vraiment
                this.isReorderingChild = true;
                this.possibleDrag = false;
            }
        }

        if (this.isReorderingChild && this.draggingChildId && this.draggingGhostPos) {
            // On bouge juste le ghost (on ne touche pas blockPositions)
            const defaultPos = this.blockPositions[this.draggingChildId];
            if (!defaultPos) return;

            // On calcule la nouvelle position fantôme en conservant le x
            // d'origine (si on veut bloquer X) et on bouge Y
            // Ou on peut laisser bouger x,y => au choix
            const newY = diagPos.y - this.dragOffsetY;

            // On peut imposer une zone de clamp si on ne veut pas trop s'écarter
            // Ex: clamp entre defaultPos.y - 50 et defaultPos.y + 500
            // (ici on fait un exemple de clamp vertical simple)
            const minClamp = defaultPos.y - 200; // 200 px au-dessus
            const maxClamp = defaultPos.y + 200; // 200 px en dessous
            const finalY = Math.min(maxClamp, Math.max(minClamp, newY));

            // On laisse X fixe, ou on le clamp
            const newX = defaultPos.x;

            this.draggingGhostPos.x = newX;
            this.draggingGhostPos.y = finalY;

            // On redessine SANS tout recalculer => on réutilise le background + on dessine le ghost
            await this.throttle_drawDiagram(false);
        }
    }

    private async onMouseUp(e: MouseEvent) {
        this.isDraggingCanvas = false;

        if (this.isReorderingChild && this.draggingChildId && this.dragParentAgentId) {
            // On relâche => on reorder
            this.isReorderingChild = false;

            const draggedChildId = this.draggingChildId;
            const parentId = this.dragParentAgentId;

            // Tri local
            const childrenIds = [...this.agentLayoutInfos[parentId].childrenIds];
            // On se base sur la Y de blockPositions pour l'instant
            // pour être cohérent avec le code existant
            // => on recalcule la position qu'on "veut" donner
            // ou on fait un trick : on place le draggedChildId au bon index
            // par rapport à la ghostPos
            const ghostY = this.draggingGhostPos ? this.draggingGhostPos.y : 0;

            // On détermine la place du ghost par rapport aux siblings
            // NB : tous les siblings ont un blockPositions => on compare ghostY + halfHeight
            const halfH = this.blockPositions[draggedChildId].h / 2;
            const pivot = ghostY + halfH;

            childrenIds.sort((a, b) => {
                // On utilise le centre vertical
                const ay = (this.blockPositions[a].y + this.blockPositions[a].h / 2) || 0;
                const by = (this.blockPositions[b].y + this.blockPositions[b].h / 2) || 0;
                return ay - by;
            });

            // On insère draggedChildId dans childrenIds en fonction du pivot
            // => on retire draggedChildId s'il est dedans
            childrenIds.splice(childrenIds.indexOf(draggedChildId), 1);

            // On trouve l'index où l'insérer
            let insertIndex = 0;
            for (let i = 0; i < childrenIds.length; i++) {
                const cy = (this.blockPositions[childrenIds[i]].y + this.blockPositions[childrenIds[i]].h / 2) || 0;
                if (pivot > cy) {
                    insertIndex = i + 1;
                } else {
                    break;
                }
            }
            childrenIds.splice(insertIndex, 0, draggedChildId);

            this.onChildReordered(parentId, childrenIds);

            // Layout + redraw
            this.draggingGhostPos = null;
            await this.defineFixedLayout();
            await this.throttle_drawDiagram(true);
        } else {
            // clic simple
            if (this.draggingChildId && !this.isRunVo) {
                const vo = this.items[this.draggingChildId];
                if (vo.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                    this.expandedAgents[this.draggingChildId] = !this.expandedAgents[this.draggingChildId];
                    await this.defineFixedLayout();
                    await this.throttle_drawDiagram(true);
                }
            }
        }

        this.draggingGhostPos = null;
        this.draggingChildId = null;
        this.dragParentAgentId = null;
        this.possibleDrag = false;
    }

    private async updateHoveredItem(dx: number, dy: number, sx: number, sy: number) {
        let found: string | null = null;
        for (const itemId of this.drawingOrder) {
            const pos = this.blockPositions[itemId];
            if (!pos) continue;
            // si c'est le bloc en train d'être drag, on teste la position "ghost" ?
            // => ou on garde la position d'origine ?
            // Ici on fait simple, on reste sur blockPositions
            if (dx >= pos.x && dx <= pos.x + pos.w && dy >= pos.y && dy <= pos.y + pos.h) {
                found = itemId;
                if (found.startsWith('add_')) {
                    // On ne veut pas hover le "+"
                    found = null;
                }
                break;
            }
        }
        // On a changé de bloc => on redessine le diagramme
        // pour mettre à jour le tooltip
        // ou on peut faire un redraw partiel ?
        this.hoveredItemId = found;
        this.hoveredX = sx;
        this.hoveredY = sy;
        await this.throttle_drawDiagram();
    }

    // =========================================================================
    // MENU "+"
    // =========================================================================
    private async showMenu(plusId: string, agentId: string) {
        this.menuBlock.visible = true;
        this.menuBlock.plusItemId = plusId;
        this.menuBlock.agentId = agentId;
        this.menuBlock.hoveredIndex = -1;
        await this.throttle_drawDiagram(true);
    }

    private async hideMenu() {
        this.menuBlock.visible = false;
        this.menuBlock.plusItemId = null;
        this.menuBlock.agentId = null;
        this.menuBlock.hoveredIndex = -1;
        await this.throttle_drawDiagram(true);
    }

    private drawMenuBlock(ctx: CanvasRenderingContext2D) {
        const mb = this.menuBlock;
        if (!mb.visible || !mb.plusItemId) return;
        const plusPos = this.blockPositions[mb.plusItemId];
        if (!plusPos) return;

        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

        const menuX = plusPos.x + mb.offsetX;
        const menuY = plusPos.y + mb.offsetY;
        const w = mb.width;
        const h = mb.height;

        ctx.beginPath();
        ctx.rect(menuX, menuY, w, h);
        ctx.fill();
        ctx.stroke();

        ctx.font = '14px sans-serif';
        const rowH = h / mb.options.length;

        for (let i = 0; i < mb.options.length; i++) {
            const opt = mb.options[i];
            const rowTop = menuY + i * rowH;

            if (i === mb.hoveredIndex) {
                ctx.fillStyle = '#ddd';
                ctx.fillRect(menuX, rowTop, w, rowH);
                ctx.fillStyle = '#000';
            } else {
                ctx.fillStyle = '#000';
            }
            ctx.fillText(opt, menuX + 10, rowTop + rowH / 2 + 5);
        }

        ctx.restore();
    }

    private checkMenuBlockClick(dx: number, dy: number): number {
        const mb = this.menuBlock;
        if (!mb.visible || !mb.plusItemId) {
            return -1;
        }
        const plusPos = this.blockPositions[mb.plusItemId];
        if (!plusPos) return -1;

        const menuX = plusPos.x + mb.offsetX;
        const menuY = plusPos.y + mb.offsetY;
        const w = mb.width;
        const h = mb.height;

        if (dx < menuX || dx > menuX + w || dy < menuY || dy > menuY + h) {
            return -1;
        }

        const rowH = h / mb.options.length;
        const relY = dy - menuY;
        const index = Math.floor(relY / rowH);

        if (index < 0 || index >= mb.options.length) {
            return -1;
        }
        return index;
    }

    // =========================================================================
    // REORDONNANCEMENT
    // =========================================================================
    private async onChildReordered(parentId: string, newChildrenOrder: string[]) {
        if (this.isRunVo) return;

        const parentVO = this.items[parentId] as OseliaRunTemplateVO;
        parentVO.children = [];
        let weight = 0;

        for (const cid of newChildrenOrder) {
            const childVo = this.items[cid] as OseliaRunTemplateVO;
            childVo.weight = weight;
            await ModuleDAO.instance.insertOrUpdateVO(childVo);

            parentVO.children.push(
                RangeHandler.create_single_elt_NumRange(childVo.id, NumSegment.TYPE_INT)
            );
            weight++;
        }
        this.$set(this.items, parentId, parentVO);
        await ModuleDAO.instance.insertOrUpdateVO(this.items[parentId]);
    }

    // =========================================================================
    // AJOUT D'ENFANT
    // =========================================================================
    private async addChild(type: string) {
        const init_vo = new OseliaRunTemplateVO();
        if (type === 'ASSISTANT') {
            init_vo.run_type = OseliaRunVO.RUN_TYPE_ASSISTANT;
        } else if (type === 'FOREACH') {
            init_vo.run_type = OseliaRunVO.RUN_TYPE_FOREACH_IN_SEPARATED_THREADS;
        } else {
            init_vo.run_type = OseliaRunVO.RUN_TYPE_AGENT;
        }
        init_vo.state = OseliaRunVO.STATE_TODO;
        init_vo.parent_run_id = Number(this.menuBlock.agentId);
        init_vo.parent_id = Number(this.menuBlock.agentId);

        await this.get_Crudcreatemodalcomponent.open_modal(
            OseliaRunTemplateVO.API_TYPE_ID,
            this.storeDatas,
            null,
            init_vo,
            false,
            async (vo: OseliaRunTemplateVO) => {
                if (!this.isRunVo) {
                    const parentId = vo.parent_run_id;
                    const parentVO = this.items[parentId] as OseliaRunTemplateVO;
                    if (!parentVO.children) {
                        parentVO.children = [];
                    }
                    parentVO.children.push(
                        RangeHandler.create_single_elt_NumRange(vo.id, NumSegment.TYPE_INT)
                    );
                    vo.parent_id = parentId;
                    this.$set(this.items, vo.id, vo);

                    await ModuleDAO.instance.insertOrUpdateVO(parentVO);
                }
            }
        );
    }

    // =========================================================================
    // TRADUCTION ÉTAT + ICÔNE
    // =========================================================================
    private getStateIcon(state: number): { info: string; icon: string, color?: string } {
        switch (state) {
            case OseliaRunVO.STATE_TODO:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🕗', color: '#3498DB' };
            case OseliaRunVO.STATE_SPLITTING:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🔀' };
            case OseliaRunVO.STATE_SPLIT_ENDED:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '✅' };
            case OseliaRunVO.STATE_WAITING_SPLITS_END:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '⌛' };
            case OseliaRunVO.STATE_WAIT_SPLITS_END_ENDED:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🔚' };
            case OseliaRunVO.STATE_RUNNING:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🏃', color: '#9B59B6' };
            case OseliaRunVO.STATE_RUN_ENDED:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🏁' };
            case OseliaRunVO.STATE_VALIDATING:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🔎' };
            case OseliaRunVO.STATE_VALIDATION_ENDED:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🔏' };
            case OseliaRunVO.STATE_DONE:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '✔️', color: '#2ECC71' };
            case OseliaRunVO.STATE_ERROR:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '❌', color: '#E74C3C' };
            case OseliaRunVO.STATE_CANCELLED:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🚫', color: '#7F8C8D' };
            case OseliaRunVO.STATE_EXPIRED:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '⏰', color: '#E67E22' };
            case OseliaRunVO.STATE_NEEDS_RERUN:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '↩️', color: '#F1C40F' };
            case OseliaRunVO.STATE_RERUN_ASKED:
                return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🔄' };
            default:
                return { info: 'Inconnu', icon: '❔' };
        }
    }
}
