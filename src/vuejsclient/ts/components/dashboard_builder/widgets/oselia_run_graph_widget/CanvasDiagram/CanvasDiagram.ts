import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';

import './CanvasDiagram.scss';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import NumSegment from '../../../../../../../shared/modules/DataRender/vos/NumSegment';
import GPTAssistantAPIFunctionVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import IDistantVOBase from '../../../../../../../shared/modules/IDistantVOBase';
import OseliaRunFunctionCallVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunFunctionCallVO';
import OseliaRunTemplateVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunVO';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import { ModuleDAOAction } from '../../../../dao/store/DaoStore';
import { ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import CRUDCreateModalComponent from '../../table_widget/crud_modals/create/CRUDCreateModalComponent';
import AddMenu from './AddMenu/AddMenu';
import DiagramBlock from './DiagramBlock/DiagramBlock';
import DiagramDataService from './DiagramDataService/DiagramDataService';
import DiagramLayout, { BlockPosition, LinkDrawInfo } from './DiagramLayout/DiagramLayout';
import DiagramLink from './DiagramLink/DiagramLink';
import VueComponentBase from '../../../../VueComponentBase';

/**
 * Structure pour le menu "+"
 */
interface MenuBlockState {
    visible: boolean;
    plusItemId: string | null;
    agentId: string | null;
    width: number;
    height: number;
    hoveredIndex: number;
    options: string[];
    offsetX: number;
    offsetY: number;
}

/**
 * Structure pour l'info d'état (icône, couleur, etc.)
 */
export interface StateIconInfo {
    info: string;
    icon: string;
    color?: string;
}

/**
 * Le composant principal (pas de .vue, on utilise template: require('...pug'))
 */
@Component({
    template: require('./CanvasDiagram.pug'),
    components: {
        DiagramBlock,
        DiagramLink,
        AddMenu,
    }
})
export default class CanvasDiagram extends VueComponentBase {

    // --------------------------------------------------------------------------
    // PROPS
    // --------------------------------------------------------------------------
    @Prop({ required: true })
    private items!: { [id: string]: OseliaRunTemplateVO | OseliaRunVO | GPTAssistantAPIFunctionVO | OseliaRunFunctionCallVO };

    @Prop({ required: true })
    private isRunVo!: boolean;

    @Prop({ default: null })
    private selectedItem!: string | null;

    @Prop({ default: null })
    private updatedItem!: OseliaRunTemplateVO | null;

    @Prop({ default: false })
    private reDraw!: boolean;

    @Prop({ default: false })
    private executeAutofit!: boolean;

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
    private isDraggingCanvas: boolean = false;
    private lastPanX: number = 0;
    private lastPanY: number = 0;

    // DRAG & DROP REORDER
    private isReorderingChild: boolean = false;
    private draggingChildId: string | null = null;
    private dragParentAgentId: string | null = null;
    private dragOffsetY: number = 0;
    private possibleDrag: boolean = false;
    private mouseDownX: number = 0;
    private mouseDownY: number = 0;
    private moveThreshold: number = 5;
    private draggingGhostPos: { x: number; y: number; w: number; h: number } | null = null;

    // MENU "+"
    private menuBlock: MenuBlockState = {
        visible: false,
        plusItemId: null,
        agentId: null,
        width: 120,
        height: 90,
        hoveredIndex: -1,
        options: ['AGENT', 'FOREACH', 'ASSISTANT'],
        offsetX: 50,
        offsetY: 0,
    };

    // HOVER (tooltip)
    private hoveredItemId: string | null = null;
    private hoveredX: number = 0;
    private hoveredY: number = 0;

    // Agents (template) : pliage/dépliage
    private expandedAgents: { [agentId: string]: boolean } = {};

    private expandedRuns: { [runId: string]: boolean } = {};
    // Adjacency & runFunctions info
    private adjacency: { [id: string]: string[] } = {};

    // THROTTLE
    private throttle_reRender = ThrottleHelper.declare_throttle_with_stackable_args(
        'CanvasDiagram.reRender',
        () => {
            this.$forceUpdate();
        },
        20
    );

    // --------------------------------------------------------------------------
    // COMPUTED
    // --------------------------------------------------------------------------

    /**
     * [MODIF] Indique s'il y a des données ou non.
     * S'il n'y a pas de données, on désactive les interactions (zoom, drag, etc.).
     */
    get hasData(): boolean {
        return !!this.items && Object.keys(this.items).length > 0;
    }

    get blockPositions(): { [id: string]: BlockPosition } {
        if (this.isRunVo) {
            const { blockPositions } = DiagramLayout.layoutRunDiagram(
                this.items as any,
                this.adjacency,
                this.expandedRuns
            );
            return blockPositions;
        } else {
            const { blockPositions } = DiagramLayout.layoutTemplateDiagram(
                this.items as any,
                this.adjacency,
                this.expandedAgents
            );
            return blockPositions;
        }
    }

    get drawnLinks(): LinkDrawInfo[] {
        if (this.isRunVo) {
            const { drawnLinks } = DiagramLayout.layoutRunDiagram(
                this.items as any,
                this.adjacency,
                this.expandedRuns
            );
            return drawnLinks;
        } else {
            const { drawnLinks } = DiagramLayout.layoutTemplateDiagram(
                this.items as any,
                this.adjacency,
                this.expandedAgents
            );
            return drawnLinks;
        }
    }

    // --------------------------------------------------------------------------
    // STYLE / GETTERS
    // --------------------------------------------------------------------------
    public get wrapperStyle() {
        return {
            transform: `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`
        };
    }

    public get ghostBlockStyle() {
        if (!this.draggingGhostPos || !this.draggingChildId) {
            return { display: 'none' };
        }
        const bp = this.blockPositions[this.draggingChildId];
        if (!bp) {
            return { display: 'none' };
        }
        return {
            position: 'absolute',
            left: bp.x + 'px',
            top: bp.y + 'px',
            width: bp.w + 'px',
            height: bp.h + 'px',
            opacity: 0.8,
            pointerEvents: 'none',
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
            left: (this.hoveredX + 10) + 'px',
            top: (this.hoveredY + 10) + 'px',
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
        switch (item._type) {
            case GPTAssistantAPIFunctionVO.API_TYPE_ID:
            case OseliaRunTemplateVO.API_TYPE_ID:
                return '';
            case OseliaRunFunctionCallVO.API_TYPE_ID:
            case OseliaRunVO.API_TYPE_ID:
            default:
                const st = (item as any).state;
                return this.getStateIcon(st, item._type).info || 'Inconnu';
        }
    }

    // --------------------------------------------------------------------------
    // WATCHERS
    // --------------------------------------------------------------------------
    @Watch('items', { immediate: true, deep: true })
    async onItemsChange() {
        await this.prepareData();
        this.throttle_reRender();
    }

    @Watch('updatedItem')
    onUpdatedItemChange() {
        if (this.updatedItem) {
            this.items[this.updatedItem.id] = this.updatedItem;
            this.throttle_reRender();
        }
    }

    @Watch('reDraw', { immediate: true })
    async onReDrawChange() {
        // On est dans le cas d'un clear
        if (!this.items) {
            this.adjacency = {};
            this.hoveredItemId = null;
        }
        // On force un simple re-render
        await this.prepareData();
        this.throttle_reRender();
    }

    @Watch('executeAutofit', { immediate: true })
    async onExecuteAutofitChange() {
        if (this.executeAutofit) {
            this.autoFit();
        }
    }

    // --------------------------------------------------------------------------
    // TRADUCTION ETAT
    // --------------------------------------------------------------------------
    public getStateIcon(state: number, item_type: string): StateIconInfo {
        switch (item_type) {
            case OseliaRunFunctionCallVO.API_TYPE_ID:
                switch (state) {
                    case OseliaRunFunctionCallVO.STATE_TODO:
                        return { info: this.t(OseliaRunFunctionCallVO.STATE_LABELS[state]), icon: '🕗', color: '#B0BEC5' };
                    case OseliaRunFunctionCallVO.STATE_RUNNING:
                        return { info: this.t(OseliaRunFunctionCallVO.STATE_LABELS[state]), icon: '🏃', color: '#81C784' };
                    case OseliaRunFunctionCallVO.STATE_DONE:
                        return { info: this.t(OseliaRunFunctionCallVO.STATE_LABELS[state]), icon: '✔️', color: '#4CAF50' };
                    case OseliaRunFunctionCallVO.STATE_ERROR:
                        return { info: this.t(OseliaRunFunctionCallVO.STATE_LABELS[state]), icon: '❌', color: '#E57373' };
                    default:
                        return { info: this.t(OseliaRunFunctionCallVO.STATE_LABELS[state]), icon: '❔' };
                }

            case OseliaRunVO.API_TYPE_ID:
                switch (state) {
                    case OseliaRunVO.STATE_TODO:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🕗', color: '#B0BEC5' };
                    case OseliaRunVO.STATE_SPLITTING:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🔀', color: '#64B5F6' };
                    case OseliaRunVO.STATE_SPLIT_ENDED:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '✅', color: '#42A5F5' };
                    case OseliaRunVO.STATE_WAITING_SPLITS_END:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '⌛', color: '#4FC3F7' };
                    case OseliaRunVO.STATE_WAIT_SPLITS_END_ENDED:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🔚', color: '#29B6F6' };
                    case OseliaRunVO.STATE_RUNNING:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🏃', color: '#81C784' };
                    case OseliaRunVO.STATE_RUN_ENDED:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🏁', color: '#66BB6A' };
                    case OseliaRunVO.STATE_VALIDATING:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🔎', color: '#FFD54F' };
                    case OseliaRunVO.STATE_VALIDATION_ENDED:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🔏', color: '#FFCA28' };
                    case OseliaRunVO.STATE_DONE:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '✔️', color: '#4CAF50' };
                    case OseliaRunVO.STATE_ERROR:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '❌', color: '#E57373' };
                    case OseliaRunVO.STATE_CANCELLED:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🚫', color: '#9E9E9E' };
                    case OseliaRunVO.STATE_EXPIRED:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '⏰', color: '#FF8A65' };
                    case OseliaRunVO.STATE_NEEDS_RERUN:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '↩️', color: '#BA68C8' };
                    case OseliaRunVO.STATE_RERUN_ASKED:
                        return { info: this.t(OseliaRunVO.STATE_LABELS[state]), icon: '🔄', color: '#AB47BC' };
                    default:
                        return { info: 'Inconnu', icon: '❔' };
                }

            case GPTAssistantAPIFunctionVO.API_TYPE_ID:
            case OseliaRunTemplateVO.API_TYPE_ID:
            default:
                return { info: null, icon: null, color: null };
        }
    }

    // --------------------------------------------------------------------------
    // HOOKS
    // --------------------------------------------------------------------------
    async mounted() {
        const container = this.$refs.diagramContainer as HTMLDivElement;
        if (container) {
            this.offsetX = container.offsetWidth / 2;
            this.offsetY = container.offsetHeight / 2;

            // [MODIF] On écoute l'événement mouseleave : si la souris sort du container,
            // on arrête tout drag.
            container.addEventListener('mouseleave', this.onMouseLeave);
        }
        window.addEventListener('resize', this.onResize);

        // Préparation initiale
        await this.prepareData();
    }

    beforeDestroy() {
        window.removeEventListener('resize', this.onResize);

        // [MODIF] Ne pas oublier de désabonner l'événement mouseleave
        const container = this.$refs.diagramContainer as HTMLDivElement;
        if (container) {
            container.removeEventListener('mouseleave', this.onMouseLeave);
        }
    }

    // --------------------------------------------------------------------------
    // PRÉPARATION DONNÉES
    // --------------------------------------------------------------------------
    private async prepareData() {
        if (this.isRunVo) {
            const res = await DiagramDataService.prepareRunData(this.items as any);
            this.adjacency = res.adjacency;
            // MàJ items si ajout de GPT manquants
            for (const k of Object.keys(res.items)) {
                this.$set(this.items, k, res.items[k]);
            }
            // init expandedRuns
            for (const id of Object.keys(this.items)) {
                const vo = this.items[id] as OseliaRunVO | OseliaRunFunctionCallVO;
                if (vo._type === OseliaRunVO.API_TYPE_ID && typeof this.expandedRuns[id] === 'undefined') {
                    this.$set(this.expandedRuns, id, true);
                }
            }
        } else {
            const res = await DiagramDataService.prepareTemplateData(this.items as any);
            this.adjacency = res.adjacency;
            for (const k of Object.keys(res.items)) {
                this.$set(this.items, k, res.items[k]);
            }

            // init expandedAgents
            for (const id of Object.keys(this.items)) {
                const vo = this.items[id] as OseliaRunTemplateVO;
                if (vo.run_type === OseliaRunVO.RUN_TYPE_AGENT && typeof this.expandedAgents[id] === 'undefined') {
                    this.$set(this.expandedAgents, id, true);
                }
            }
        }
    }

    // --------------------------------------------------------------------------
    // EVENTS
    // --------------------------------------------------------------------------
    private onResize() {
        const container = this.$refs.diagramContainer as HTMLDivElement;
        if (!container) return;
        this.offsetX = container.offsetWidth / 2;
        this.offsetY = container.offsetHeight / 2;
        this.throttle_reRender();
    }

    private screenToDiag(sx: number, sy: number): { x: number; y: number } {
        return {
            x: (sx - this.offsetX) / this.scale,
            y: (sy - this.offsetY) / this.scale,
        };
    }

    private onWheel(e: WheelEvent) {
        // [MODIF] Désactiver le zoom si pas de data
        if (!this.hasData) {
            return;
        }

        e.preventDefault();
        const delta = (e.deltaY > 0) ? -0.1 : 0.1;
        this.scale = Math.max(0.05, this.scale + delta);
        this.$emit('canAutofit', true);
        this.throttle_reRender();
    }

    private onMouseDown(e: MouseEvent) {
        // [MODIF] Désactiver si pas de data
        if (!this.hasData) {
            return;
        }

        const container = this.$refs.diagramContainer as HTMLDivElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const diagPos = this.screenToDiag(mx, my);

        // Cherche un bloc
        let clickedBlock: string | null = null;
        for (const itemId of Object.keys(this.blockPositions)) {
            const pos = this.blockPositions[itemId];
            if (
                diagPos.x >= pos.x && diagPos.x <= pos.x + pos.w &&
                diagPos.y >= pos.y && diagPos.y <= pos.y + pos.h
            ) {
                clickedBlock = itemId;
                break;
            }
        }

        if (!clickedBlock) {
            this.isDraggingCanvas = true;
            this.lastPanX = mx;
            this.lastPanY = my;
            this.$emit('select_item', null);
            return;
        }

        // bloc "+"
        if (clickedBlock.startsWith('add_')) {
            const agentId = clickedBlock.substring(4);
            if (this.menuBlock.visible) {
                this.hideMenu();
            } else {
                this.showMenu(clickedBlock, agentId);
            }
            return;
        }

        // Sélection
        const selected_item = this.items[clickedBlock];
        if (selected_item._type == OseliaRunFunctionCallVO.API_TYPE_ID) {
            this.$emit('select_item', clickedBlock, this.items[clickedBlock]);
        } else {
            this.$emit('select_item', clickedBlock);
        }

        // Possibilité de drag reorder en template
        this.mouseDownX = diagPos.x;
        this.mouseDownY = diagPos.y;
        this.possibleDrag = false;

        if (!this.isRunVo) {
            // si c’est un agent => toggle expand sur mouseUp
            // si c’est un enfant => reorder possible
            const vo = this.items[clickedBlock] as OseliaRunTemplateVO;
            const parentId = vo.parent_run_id ? String(vo.parent_run_id) : null;
            if (
                parentId &&
                this.items[parentId] &&
                (this.items[parentId] as OseliaRunTemplateVO).run_type === OseliaRunVO.RUN_TYPE_AGENT
            ) {
                this.possibleDrag = true;
                this.draggingChildId = clickedBlock;
                this.dragParentAgentId = parentId;
                const bp = this.blockPositions[clickedBlock];
                this.dragOffsetY = diagPos.y - bp.y;
                const horizontalSpace = 20;
                this.draggingGhostPos = { x: bp.x + bp.w + horizontalSpace, y: bp.y, w: bp.w, h: bp.h };
            } else {
                this.draggingChildId = String(vo.id);
            }
        } else {
            // En mode run, on mémorise juste le run cliqué pour le toggle
            this.draggingChildId = clickedBlock;
        }
    }

    private onMouseMove(e: MouseEvent) {
        // [MODIF] Désactiver si pas de data
        if (!this.hasData) {
            return;
        }

        const container = this.$refs.diagramContainer as HTMLDivElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const diagPos = this.screenToDiag(mx, my);

        // Hover
        this.updateHoveredItem(diagPos.x, diagPos.y, mx, my);

        // Pan
        if (this.isDraggingCanvas) {
            const dx = mx - this.lastPanX;
            const dy = my - this.lastPanY;
            this.offsetX += dx;
            this.offsetY += dy;
            this.lastPanX = mx;
            this.lastPanY = my;
            this.$emit('canAutofit', true);
            this.throttle_reRender();
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
            const horizontalSpace = 20;
            this.draggingGhostPos.x = defaultPos.x + defaultPos.w + horizontalSpace;
            this.draggingGhostPos.y = newY;
            this.draggingGhostPos.w = defaultPos.w;
            this.draggingGhostPos.h = defaultPos.h;
            this.throttle_reRender();
        }
    }

    private onMouseUp(e: MouseEvent) {
        // [MODIF] Désactiver si pas de data
        if (!this.hasData) {
            return;
        }

        this.isDraggingCanvas = false;

        if (this.isReorderingChild && this.draggingChildId && this.dragParentAgentId) {
            this.isReorderingChild = false;
            const draggedId = this.draggingChildId;
            const parentId = this.dragParentAgentId;

            // reorder
            const baseChildIds = (this.adjacency[parentId] || [])
                .filter(cid => !cid.startsWith('add_') && (this.items[cid] as OseliaRunTemplateVO)?.id !== -1);
            baseChildIds.sort((a, b) => {
                const aWeight = (this.items[a] as OseliaRunTemplateVO).weight || 0;
                const bWeight = (this.items[b] as OseliaRunTemplateVO).weight || 0;
                return aWeight - bWeight;
            });
            const childIds = [...baseChildIds];
            const ghostY = (this.draggingGhostPos?.y || 0) + (this.blockPositions[draggedId].h / 2);

            childIds.splice(childIds.indexOf(draggedId), 1);
            let insertIndex = 0;
            for (let i = 0; i < childIds.length; i++) {
                const midY = this.blockPositions[childIds[i]].y + this.blockPositions[childIds[i]].h / 2;
                if (ghostY > midY) {
                    insertIndex = i + 1;
                } else {
                    break;
                }
            }
            childIds.splice(insertIndex, 0, draggedId);
            if (!(baseChildIds.length === childIds.length && baseChildIds.every((val, index) => val === childIds[index]))) {
                this.onChildReordered(parentId, childIds);
            }
        } else {
            // Clique sur un agent => toggle expand
            if (this.isRunVo && this.draggingChildId) {
                const vo = this.items[this.draggingChildId] as OseliaRunVO;
                if (vo._type === OseliaRunVO.API_TYPE_ID) {
                    this.expandedRuns[this.draggingChildId] = !this.expandedRuns[this.draggingChildId];
                    this.throttle_reRender();
                }
            } else if (!this.isRunVo && this.draggingChildId) {
                // Clique sur un agent => toggle expand pour template
                const vo = this.items[this.draggingChildId] as OseliaRunTemplateVO;
                if (vo.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                    this.expandedAgents[this.draggingChildId] = !this.expandedAgents[this.draggingChildId];
                    this.throttle_reRender();
                }
            }
        }

        this.isReorderingChild = false;
        this.draggingChildId = null;
        this.dragParentAgentId = null;
        this.draggingGhostPos = null;
        this.possibleDrag = false;
    }

    /**
     * [MODIF]
     * Si la souris sort du conteneur (mouseleave),
     * on arrête tout drag en cours (canvas ou reorder).
     */
    private onMouseLeave() {
        if (this.isDraggingCanvas) {
            this.isDraggingCanvas = false;
        }
        if (this.isReorderingChild) {
            this.isReorderingChild = false;
            this.draggingChildId = null;
            this.dragParentAgentId = null;
            this.draggingGhostPos = null;
            this.possibleDrag = false;
        }
    }

    private updateHoveredItem(dx: number, dy: number, sx: number, sy: number) {
        let found: string | null = null;
        for (const itemId of Object.keys(this.blockPositions)) {
            const pos = this.blockPositions[itemId];
            if (
                dx >= pos.x && dx <= pos.x + pos.w &&
                dy >= pos.y && dy <= pos.y + pos.h
            ) {
                if (!itemId.startsWith('add_')) {
                    found = itemId;
                }
                break;
            }
        }
        this.hoveredItemId = found;
        this.hoveredX = sx;
        this.hoveredY = sy;
    }

    // --------------------------------------------------------------------------
    // MENU "+"
    // --------------------------------------------------------------------------
    private showMenu(plusId: string, agentId: string) {
        this.menuBlock.visible = true;
        this.menuBlock.plusItemId = plusId;
        this.menuBlock.agentId = agentId;
        this.menuBlock.hoveredIndex = -1;
        this.throttle_reRender();
    }

    private hideMenu() {
        this.menuBlock.visible = false;
        this.menuBlock.plusItemId = null;
        this.menuBlock.agentId = null;
        this.menuBlock.hoveredIndex = -1;
        this.throttle_reRender();
    }

    // --------------------------------------------------------------------------
    // AUTO-FIT
    // --------------------------------------------------------------------------
    private autoFit() {
        const container = this.$refs.diagramContainer as HTMLDivElement;
        if (!container) {
            return;
        }

        const containerWidth = container.offsetWidth;
        const containerHeight = container.offsetHeight;

        const itemIds = Object.keys(this.blockPositions);
        if (!itemIds.length) {
            return;
        }

        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        for (const id of itemIds) {
            const bp = this.blockPositions[id];
            if (!bp) {
                continue;
            }
            minX = Math.min(minX, bp.x);
            maxX = Math.max(maxX, bp.x + bp.w);
            minY = Math.min(minY, bp.y);
            maxY = Math.max(maxY, bp.y + bp.h);
        }

        if (minX === Infinity) {
            return;
        }

        const margin = 20;
        const diagWidth = maxX - minX + margin * 2;
        const diagHeight = maxY - minY + margin * 2;

        const scaleX = containerWidth / diagWidth;
        const scaleY = containerHeight / diagHeight;
        let newScale = Math.min(scaleX, scaleY);

        const MIN_SCALE = 0.05;
        const MAX_SCALE = 2;
        newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));

        const diagCenterX = (minX + maxX) / 2;
        const diagCenterY = (minY + maxY) / 2;

        const containerCenterX = containerWidth / 2;
        const containerCenterY = containerHeight / 2;

        this.scale = newScale;
        this.offsetX = containerCenterX - (this.scale * diagCenterX);
        this.offsetY = containerCenterY - (this.scale * diagCenterY);

        this.$emit('canAutofit', false);
        this.throttle_reRender();
    }

    // --------------------------------------------------------------------------
    // REORDER
    // --------------------------------------------------------------------------
    private async onChildReordered(parentId: string, newChildrenOrder: string[]) {
        if (this.isRunVo) return;

        const parentVO = this.items[parentId] as OseliaRunTemplateVO;
        parentVO.children = [];
        let weight = 0;

        for (const cid of newChildrenOrder) {
            const cvo = this.items[cid] as OseliaRunTemplateVO;
            cvo.weight = weight;
            await ModuleDAO.instance.insertOrUpdateVO(cvo);

            parentVO.children.push(
                RangeHandler.create_single_elt_NumRange(cvo.id, NumSegment.TYPE_INT)
            );
            weight++;
        }
        await ModuleDAO.instance.insertOrUpdateVO(parentVO);
    }

    // --------------------------------------------------------------------------
    // CRÉATION D'ENFANT
    // --------------------------------------------------------------------------
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
