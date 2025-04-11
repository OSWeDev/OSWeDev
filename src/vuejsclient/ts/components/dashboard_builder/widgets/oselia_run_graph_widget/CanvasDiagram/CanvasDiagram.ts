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
        items!: { [id: string]: OseliaRunTemplateVO | OseliaRunVO | GPTAssistantAPIFunctionVO | OseliaRunFunctionCallVO};

    @Prop({ required: true })
        isRunVo!: boolean;

    @Prop({ default: null })
        selectedItem!: string | null;

    @Prop({ default: null })
        updatedItem!: OseliaRunTemplateVO | null;

    @Prop({ default: false })
        reDraw!: boolean;

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
    private draggingGhostPos: { x: number; y: number; w: number;  h:number} | null = null;

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

    // Adjacency & runFunctions info
    private adjacency: { [id: string]: string[] } = {};
    private functionsInfos: {
        [id: string]: {
            gptFunction: GPTAssistantAPIFunctionVO;
            runFunction: OseliaRunFunctionCallVO[];
        }
    } = {};

    // THROTTLE
    private throttle_reRender = ThrottleHelper.declare_throttle_with_stackable_args(
        'CanvasDiagram.reRender',
        () => {
            this.$forceUpdate();
        },
        20
    );
    // --------------------------------------------------------------------------
    // COMPUTED (façon "getter") : blockPositions / drawnLinks
    // --------------------------------------------------------------------------
    get blockPositions(): { [id: string]: BlockPosition } {
        if (this.isRunVo) {
            const { blockPositions } = DiagramLayout.layoutRunDiagram(
                this.items as any,
                this.adjacency
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
                this.adjacency
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
        if (item._type === GPTAssistantAPIFunctionVO.API_TYPE_ID) {
            return '';
        } else {
            if (item._type === OseliaRunTemplateVO.API_TYPE_ID) {
                return '';
            }
            const st = (item as any).state;
            return this.getStateIcon(st).info || 'Inconnu';
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

    @Watch('reDraw')
    onReDrawChange() {
        // On est dans le cas d'un clear
        if (!this.items) {
            this.adjacency = {};
            this.functionsInfos = {};
            this.hoveredItemId = null;
        }
        // On force un simple re-render
        this.throttle_reRender();
    }

    // --------------------------------------------------------------------------
    // TRADUCTION ETAT
    // --------------------------------------------------------------------------
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
    async mounted() {
        const container = this.$refs.diagramContainer as HTMLDivElement;
        if (container) {
            this.offsetX = container.offsetWidth / 2;
            this.offsetY = container.offsetHeight / 2;
        }
        window.addEventListener('resize', this.onResize);

        // Préparation initiale
        await this.prepareData();
    }

    beforeDestroy() {
        window.removeEventListener('resize', this.onResize);
    }


    // --------------------------------------------------------------------------
    // PRÉPARATION DONNÉES
    // --------------------------------------------------------------------------
    private async prepareData() {
        if (this.isRunVo) {
            const res = await DiagramDataService.prepareRunData(this.items as any);
            this.adjacency = res.adjacency;
            this.functionsInfos = res.functionsInfos;
            // MàJ items si ajout de GPT manquants
            for (const k of Object.keys(res.items)) {
                this.$set(this.items, k, res.items[k]);
            }
        } else {
            const res = await DiagramDataService.prepareTemplateData(this.items as any);
            this.adjacency = res.adjacency;
            // Pas de functionsInfos ici
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
        e.preventDefault();
        const delta = (e.deltaY > 0) ? -0.1 : 0.1;
        this.scale = Math.max(0.05, this.scale + delta);
        this.throttle_reRender();
    }

    private onMouseDown(e: MouseEvent) {
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
        const runFunc = this.functionsInfos[clickedBlock]?.runFunction || null;
        this.$emit('select_item', clickedBlock, runFunc);

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
                this.draggingGhostPos = { x: bp.x+bp.w+horizontalSpace, y: bp.y, w: bp.w, h: bp.h };
            } else {
                this.draggingChildId = String(vo.id);
            }
        }
    }

    private onMouseMove(e: MouseEvent) {
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
            this.throttle_reRender();
            return;
        }

        // DRAG reorder
        if (this.possibleDrag && this.draggingChildId) {
            const distX = diagPos.x - this.mouseDownX;
            const distY = diagPos.y - this.mouseDownY;
            const dist = Math.sqrt(distX*distX + distY*distY);
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
                const midY = this.blockPositions[childIds[i]].y + this.blockPositions[childIds[i]].h/2;
                if (ghostY > midY) {
                    insertIndex = i+1;
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
            if (!this.isRunVo && this.draggingChildId) {
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
        // this.throttle_reRender();
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

}