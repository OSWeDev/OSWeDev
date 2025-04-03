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
import GPTAssistantAPIFunctionVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import NumRange from '../../../../../../../shared/modules/DataRender/vos/NumRange';
import { threadId } from 'worker_threads';

// Nos composants enfants
import DiagramBlock from './DiagramBlock/DiagramBlock';
import DiagramLink from './DiagramLink/DiagramLink';
import AddMenu from './AddMenu/AddMenu';
import VueComponentBase from '../../../../VueComponentBase';

// Interfaces pour la structure d’affichage
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

// On reprend votre code d’origine pour la traduction d’état
// (icône + couleur) => on va l’utiliser dans DiagramBlock
export interface StateIconInfo {
    info: string;
    icon: string;
    color?: string;
}

@Component({
    template: require('./CanvasDiagram.pug'),
    components: {
        DiagramBlock,
        DiagramLink,
        AddMenu,
    },
})
export default class CanvasDiagram extends VueComponentBase {

    // --------------------------------------------------------------------------
    // PROPS
    // --------------------------------------------------------------------------
    @Prop()
    readonly items!: { [id: string]: OseliaRunTemplateVO | OseliaRunVO | GPTAssistantAPIFunctionVO };

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
    // DONNÉES
    // --------------------------------------------------------------------------

    // Panning / Zoom
    private scale: number = 1;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private isDraggingCanvas = false;
    private lastPanX = 0;
    private lastPanY = 0;

    // LAYOUT
    private blockPositions: { [id: string]: { x: number; y: number; w: number; h: number } } = {};
    private agentLayoutInfos: { [agentId: string]: AgentLayoutInfo } = {};
    private runLayoutInfos: { [runId: string]: RunLayoutInfo } = {};
    private adjacency: { [id: string]: string[] } = {};

    // RUN INFOS
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

    // DRAG & DROP REORDER
    private isReorderingChild: boolean = false;
    private draggingChildId: string | null = null;
    private dragParentAgentId: string | null = null;
    private dragOffsetY: number = 0;
    private possibleDrag: boolean = false;
    private mouseDownX: number = 0;
    private mouseDownY: number = 0;
    private moveThreshold: number = 5;

    // Position "fantôme" du bloc en train d'être drag
    private draggingGhostPos: { x: number; y: number } | null = null;

    // LIENS
    private drawnLinks: LinkDrawInfo[] = [];

    // AGENTS (template) : pliage/dépliage
    private expandedAgents: { [agentId: string]: boolean } = {};

    // HOVER (tooltip)
    private hoveredItemId: string | null = null;
    private hoveredX: number = 0;
    private hoveredY: number = 0;

    // ORDRE D’AFFICHAGE
    private drawingOrder: string[] = [];

    // THROTTLE
    private throttle_drawDiagram = ThrottleHelper.declare_throttle_with_stackable_args(
        'OseliaRunGraphWidgetComponent.drawDiagram',
        this.throttled_drawDiagram.bind(this),
        50
    );


    // =========================================================================
    // GETTERS POUR TEMPLATE
    // =========================================================================
    public get wrapperStyle() {
        return {
            transform: `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`
        };
    }

    public get ghostBlockStyle() {
        // Si on a un bloc ghost, on le positionne en absolu
        if (!this.draggingGhostPos || !this.draggingChildId) {
            return { display: 'none' };
        }
        const bp = this.blockPositions[this.draggingChildId];
        if (!bp) {
            return { display: 'none' };
        }
        return {
            position: 'absolute',
            left: (this.draggingGhostPos.x) + 'px',
            top: (this.draggingGhostPos.y) + 'px',
            width: bp.w + 'px',
            height: bp.h + 'px',
            opacity: 0.8,
            pointerEvents: 'none', // pour ne pas bloquer
            transform: `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`
        };
    }

    public get menuBlockPosition() {
        if (!this.menuBlock.plusItemId) {
            return { x: 0, y: 0 };
        }
        const pos = this.blockPositions[this.menuBlock.plusItemId];
        if (!pos) {
            return { x: 0, y: 0 };
        }
        return {
            x: pos.x + this.menuBlock.offsetX,
            y: pos.y + this.menuBlock.offsetY
        };
    }

    public get tooltipStyle() {
        return {
            position: 'absolute',
            left: this.hoveredX + 10 + 'px',
            top: this.hoveredY + 10 + 'px',
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '4px 6px',
            borderRadius: '4px',
            pointerEvents: 'none',
            display: this.hoveredItemId ? 'block' : 'none',
        };
    }

    public get tooltipText() {
        if (!this.hoveredItemId) return '';
        const item = this.items[this.hoveredItemId];
        if (!item) return '';

        // Cas GPT function => state = runFunction.state
        if ((item as any)._type === GPTAssistantAPIFunctionVO.API_TYPE_ID) {
            const fInfo = this.functionsInfos[item.id];
            if (!fInfo) return '???';
            const st = fInfo.runFunction.state;
            return this.getStateIcon(st).info || 'Inconnu';
        } else {
            const st = (item as any).state;
            return this.getStateIcon(st).info || 'Inconnu';
        }
    }

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

    // =========================================================================
    // TRADUCTION ÉTAT
    // =========================================================================
    // On le garde ici, mais on l’utilise plutôt dans DiagramBlock
    public getStateIcon(state: number): { info: string; icon: string, color?: string } {
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


    // --------------------------------------------------------------------------
    // HOOKS
    // --------------------------------------------------------------------------
    mounted() {
        const container = this.$refs.diagramContainer as HTMLDivElement;
        if (container) {
            this.offsetX = container.offsetWidth / 2;
            this.offsetY = container.offsetHeight / 2;
        }
        window.addEventListener('resize', this.onResize);
    }

    beforeDestroy() {
        window.removeEventListener('resize', this.onResize);
    }


    // =========================================================================
    // PRÉPARATION DONNÉES (RUN vs TEMPLATE)
    // =========================================================================
    private async prepareRunData() {
        // On reproduit la logique de votre code : fetch RunFunctionCall, GPT, etc.
        const _items: { [id: string]: OseliaRunVO } = this.items as any;
        this.adjacency = {};
        for (const itemId of Object.keys(_items)) {
            this.adjacency[itemId] = [];
        }

        // Filtre sur run
        const runIds = Object.keys(_items).filter(id => _items[id]._type === OseliaRunVO.API_TYPE_ID);
        if (!runIds.length) return;

        const allRunIdsNum = runIds.map(rid => Number(rid));
        const allRunFunctions: OseliaRunFunctionCallVO[] = await query(OseliaRunFunctionCallVO.API_TYPE_ID)
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

        // Constituer adjacency + functionsInfos
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
        const _items: { [id: string]: OseliaRunTemplateVO } = this.items as any;
        this.adjacency = {};
        for (const itemId of Object.keys(_items)) {
            this.adjacency[itemId] = [];
        }

        const allChildrenRanges: NumRange[] = [];
        // Ajout du bloc + (fakeAdd)
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

        // Fetch des enfants
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
            // On suppose un ou plusieurs run
            const runIds = Object.keys(this.items).filter(id => this.items[id]._type === OseliaRunVO.API_TYPE_ID);
            if (!runIds.length) return;

            // On traite le(s) run
            // Suppose un run principal => on l’aligne
            let currentY = 0;
            for (const runId of runIds) {
                currentY = await this.layoutRunAndFunctions(runId, currentY, 0);
            }
            return;
        }

        // On convertis en local items au type pour éviter les cast
        const _items: { [id: string]: OseliaRunTemplateVO } = this.items as any;
        // Template
        // On init expandedAgents si pas déjà fait
        for (const itemId of Object.keys(_items)) {
            const vo = _items[itemId];
            if (vo.run_type === OseliaRunVO.RUN_TYPE_AGENT && typeof this.expandedAgents[itemId] === 'undefined') {
                this.$set(this.expandedAgents, itemId, true);
            }
        }

        const agentIds = Object.keys(_items).filter(id => _items[id].run_type === OseliaRunVO.RUN_TYPE_AGENT);
        // Trouver les racines (parent_run_id non défini ou parent agent introuvable)
        const rootAgents = agentIds.filter(agentId => {
            const parentId = _items[agentId].parent_run_id;
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

        // Récupère functions => adjacency
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

        // Place agent
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
    // DESSIN (via composants, plus de canvas) - On reconstruit drawnLinks
    // =========================================================================
    private async throttled_drawDiagram(forceFullRedraw: boolean = true) {
        // On reconstruit la liste des liens (drawnLinks)
        this.drawLinks();

        // On n'a plus besoin de "ctx" ou "backgroundImageData".
        // On force la mise à jour de l'UI => Vue réactif

        // Gérer le ghost ? => on le dessine en overlay si isReorderingChild
        // Pour faire simple : on peut laisser la position fantôme pour le bloc
        // dans "draggingGhostPos" ; on l'affichera en <div> absolu par ex.
    }

    private drawLinks() {
        this.drawnLinks = [];

        if (this.isRunVo) {
            // run -> functions + trait vertical
            for (const runId of Object.keys(this.runLayoutInfos)) {
                const info = this.runLayoutInfos[runId];
                const runPos = this.blockPositions[runId];
                if (!runPos) continue;

                const runCenterX = runPos.x + runPos.w / 2;
                const runBottomY = runPos.y + runPos.h;
                let minY: number | null = null;
                let maxY: number | null = null;

                // Pour chaque fonction
                for (const fId of info.functionIds) {
                    const fPos = this.blockPositions[fId];
                    if (!fPos) continue;
                    const fyCenter = fPos.y + fPos.h / 2;
                    const fxLeft = fPos.x;

                    // trait horizontal run->function
                    this.drawnLinks.push({
                        sourceItemId: runId,
                        targetItemId: fId,
                        pathPoints: [
                            { x: runCenterX, y: fyCenter },
                            { x: fxLeft, y: fyCenter },
                        ],
                    });
                    if (minY === null || fyCenter < minY) minY = fyCenter;
                    if (maxY === null || fyCenter > maxY) maxY = fyCenter;
                }

                // trait vertical
                if (minY != null && maxY != null) {
                    this.drawnLinks.push({
                        sourceItemId: runId,
                        targetItemId: runId + '_vertical',
                        pathPoints: [
                            { x: runCenterX, y: runBottomY },
                            { x: runCenterX, y: maxY },
                        ],
                    });
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
                        this.drawnLinks.push({
                            sourceItemId: agentId,
                            targetItemId: info.plusId,
                            pathPoints: [
                                { x: ax, y: py },
                                { x: px, y: py },
                            ],
                        });
                    }

                    // Lien agent->enfants
                    for (const cId of info.childrenIds) {
                        const cPos = this.blockPositions[cId];
                        if (!cPos) continue;

                        const cy = cPos.y + cPos.h / 2;
                        const cxLeft = cPos.x;
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

    // =========================================================================
    // ÉVÉNEMENTS SOURIS
    // =========================================================================
    private onResize() {
        const container = this.$refs.diagramContainer as HTMLDivElement;
        if (!container) return;
        this.offsetX = container.offsetWidth / 2;
        this.offsetY = container.offsetHeight / 2;
        this.throttle_drawDiagram(true);
    }

    private screenToDiag(sx: number, sy: number): { x: number; y: number } {
        return {
            x: (sx - this.offsetX) / this.scale,
            y: (sy - this.offsetY) / this.scale,
        };
    }

    private async onWheel(e: WheelEvent) {
        e.preventDefault();
        const delta = (e.deltaY > 0) ? -0.1 : 0.1;
        this.scale = Math.max(0.05, this.scale + delta);
        await this.throttle_drawDiagram(true);
    }

    private onMouseDown(e: MouseEvent) {
        const container = this.$refs.diagramContainer as HTMLDivElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const diagPos = this.screenToDiag(mx, my);

        // Fermer le menu + ?
        if (this.menuBlock.visible) {
            // On check si clic en-dehors => on le ferme
            this.hideMenu();
        }

        // Cherche un bloc sous la souris ?
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
            if (this.menuBlock.visible) {
                this.hideMenu();
            } else {
                this.showMenu(clickedBlock, agentId);
            }
            return;
        }

        this.$emit('select_item', clickedBlock, (this.functionsInfos ? (this.functionsInfos[clickedBlock] ? this.functionsInfos[clickedBlock].runFunction : null) : null) || null);

        // DRAG reorder possible (si c’est un enfant d’un agent, en mode template)
        this.mouseDownX = diagPos.x;
        this.mouseDownY = diagPos.y;
        this.possibleDrag = false;

        if(this.isRunVo) return; // On ne drag pas les run
        // On ne drag que si c’est un enfant d’un agent (et pas le parent lui-même)
        // On cast ici pour éviter les warnings de TS
        const vo = this.items[clickedBlock] as OseliaRunTemplateVO;
        const parentId = vo.parent_run_id ? String(vo.parent_run_id) : null;
        if (parentId && (this.items[parentId] as OseliaRunTemplateVO).run_type === OseliaRunVO.RUN_TYPE_AGENT && !this.isRunVo) {
            this.possibleDrag = true;
            this.draggingChildId = clickedBlock;
            this.dragParentAgentId = parentId;
            const pos = this.blockPositions[clickedBlock];
            this.dragOffsetY = diagPos.y - pos.y;
            this.draggingGhostPos = { x: pos.x, y: pos.y };
        } else {
            this.draggingChildId = clickedBlock;
            this.draggingGhostPos = null;
        }
    }

    private async onMouseMove(e: MouseEvent) {
        const container = this.$refs.diagramContainer as HTMLDivElement;
        if (!container) return;
        const rect = container.getBoundingClientRect();
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
            await this.throttle_drawDiagram(true);
            return;
        }

        // DRAG reorder
        if (this.possibleDrag && this.draggingChildId) {
            const distX = diagPos.x - this.mouseDownX;
            const distY = diagPos.y - this.mouseDownY;
            const dist = Math.sqrt(distX * distX + distY * distY);
            if (dist > this.moveThreshold) {
                this.isReorderingChild = true;
                this.possibleDrag = false;
            }
        }

        if (this.isReorderingChild && this.draggingChildId && this.draggingGhostPos) {
            const defaultPos = this.blockPositions[this.draggingChildId];
            if (!defaultPos) return;

            const newY = diagPos.y - this.dragOffsetY;
            // clamp simple
            const minClamp = defaultPos.y - 200;
            const maxClamp = defaultPos.y + 200;
            const finalY = Math.min(maxClamp, Math.max(minClamp, newY));

            const newX = defaultPos.x;
            this.draggingGhostPos.x = newX;
            this.draggingGhostPos.y = finalY;

            // On redessine (ici, on réactualise juste => Vue)
            await this.throttle_drawDiagram(false);
        }
    }

    private async onMouseUp(e: MouseEvent) {
        this.isDraggingCanvas = false;

        if (this.isReorderingChild && this.draggingChildId && this.dragParentAgentId) {
            this.isReorderingChild = false;
            const draggedChildId = this.draggingChildId;
            const parentId = this.dragParentAgentId;

            // reorder
            const childrenIds = [...this.agentLayoutInfos[parentId].childrenIds];
            const ghostY = this.draggingGhostPos ? this.draggingGhostPos.y : 0;
            const halfH = this.blockPositions[draggedChildId].h / 2;
            const pivot = ghostY + halfH;

            childrenIds.sort((a, b) => {
                const ay = (this.blockPositions[a].y + this.blockPositions[a].h / 2) || 0;
                const by = (this.blockPositions[b].y + this.blockPositions[b].h / 2) || 0;
                return ay - by;
            });

            childrenIds.splice(childrenIds.indexOf(draggedChildId), 1);

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
            this.draggingGhostPos = null;
            await this.defineFixedLayout();
            await this.throttle_drawDiagram(true);
        } else {
            // clic simple sur un agent
            if (this.draggingChildId && !this.isRunVo) {
                const vo = this.items[this.draggingChildId] as OseliaRunTemplateVO;
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
            if (dx >= pos.x && dx <= pos.x + pos.w && dy >= pos.y && dy <= pos.y + pos.h) {
                found = itemId;
                if (found.startsWith('add_')) {
                    found = null;
                }
                break;
            }
        }
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

    // =========================================================================
    // REORDER
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
    // AJOUT D’ENFANT
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
        this.hideMenu();
    }
}
