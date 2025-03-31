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

@Component({
    template: require('./CanvasDiagram.pug'),
})
export default class CanvasDiagram extends Vue {

    @Prop()
    readonly items!: { [id: string]: OseliaRunTemplateVO | OseliaRunVO};

    @Prop()
    private isRunVo !: boolean;

    @Prop({ default: null })
    private selectedItem!: string | null;

    @Prop({ default: null })
    private updatedItem!: OseliaRunTemplateVO | null;

    @Prop({ default: false })
    private reDraw!: boolean;

    @ModuleDashboardPageGetter
    private get_Crudcreatemodalcomponent!: CRUDCreateModalComponent;

    @ModuleDAOAction
    private storeDatas!: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    private throttle_drawDiagram = ThrottleHelper.declare_throttle_with_stackable_args(
        'OseliaRunGraphWidgetComponent.drawDiagram',
        this.throttled_drawDiagram.bind(this), 100);
    // -------------------------------------------------------------------------
    // GESTION DU CANVAS (Zoom, pan, etc.)
    private isDraggingCanvas = false;
    private lastPanX = 0;
    private lastPanY = 0;

    private ctx: CanvasRenderingContext2D | null = null;
    private scale: number = 1;
    private offsetX: number = 0;
    private offsetY: number = 0;

    // -------------------------------------------------------------------------
    // POSITIONS DES BLOCS
    private blockPositions: {
        [itemId: string]: { x: number; y: number; w: number; h: number };
    } = {};

    // -------------------------------------------------------------------------
    // INFORMATIONS SPÉCIFIQUES AUX AGENTS
    private agentLayoutInfos: { [agentId: string]: AgentLayoutInfo } = {};

    // -------------------------------------------------------------------------
    // ADJACENCE (pour tracer des liens si besoin)
    private adjacency: { [id: string]: string[] } = {};

    // -------------------------------------------------------------------------
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

    // -------------------------------------------------------------------------
    // DRAG & DROP DE RÉORDONNEMENT DES ENFANTS
    private isReorderingChild: boolean = false; // indique qu'on est en drag effectif
    private draggingChildId: string | null = null;
    private dragParentAgentId: string | null = null;
    private dragOffsetY: number = 0;

    /**
     * Pour mieux distinguer un simple clic d'un drag & drop, on introduit :
     * - possibleDrag: si on a cliqué sur un enfant réordonnable.
     * - mouseDownX, mouseDownY: la position de la souris lors du mousedown.
     * - moveThreshold: distance minimale pour considérer qu'on a vraiment fait un drag.
     */
    private possibleDrag: boolean = false;
    private mouseDownX: number = 0;
    private mouseDownY: number = 0;
    private moveThreshold: number = 5;

    // -------------------------------------------------------------------------
    // MISC
    private drawnLinks: LinkDrawInfo[] = [];

    // =========================================================================
    // PLIAGE / DÉPLIAGE
    // =========================================================================
    private expandedAgents: { [agentId: string]: boolean } = {};

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
            const _items: { [id: string]: OseliaRunVO } = (this.items as { [id: string]: OseliaRunVO });
        } else {
            const _items : {[id:string]: OseliaRunTemplateVO} = (this.items as { [id: string]: OseliaRunTemplateVO });

            // 1) Reconstruire l'adjacence
            this.adjacency = {};
            for (const itemId of Object.keys(_items)) {
                this.adjacency[itemId] = [];
            }

            // insérer les blocs "add_XXX" et remplir adjacency
            for (const itemId of Object.keys(_items)) {
                const item = _items[itemId];
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

                    const childrenIds: string[] = [];
                    if (item.children && item.children.length) {
                        for (const c of item.children) {
                            const _children = await query(OseliaRunTemplateVO.API_TYPE_ID)
                                .filter_by_ids([c])
                                .set_sort(new SortByVO(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().weight, true))
                                .select_vos<OseliaRunTemplateVO>();
                            for (const child of _children) {
                                const cid = String(child.id);
                                childrenIds.push(cid);
                                if (!_items[cid]) {
                                    this.$set(this.items, cid, child);
                                }
                            }
                        }
                    }

                    for (const cid of childrenIds) {
                        this.adjacency[itemId].push(cid);
                        if (!this.adjacency[cid]) {
                            this.adjacency[cid] = [];
                        }
                        this.adjacency[cid].push(itemId);
                    }
                    this.adjacency[itemId].push(addId);
                    this.adjacency[addId].push(itemId);
                }
            }
        }



        // 2) Mettre à jour le layout
        await this.defineFixedLayout();
        // 3) Redessiner
        await this.throttle_drawDiagram();
    }


    // =========================================================================
    // HOOKS
    // =========================================================================
    mounted() {
        this.initCanvas();
        this.onItemsChange();

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

    private async throttled_drawDiagram() {
        if (!this.ctx) return;
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        this.drawLinks(ctx);

        for (const itemId of Object.keys(this.items)) {
            this.drawBlock(ctx, itemId);
        }

        if (this.menuBlock.visible && this.menuBlock.plusItemId) {
            this.drawMenuBlock(ctx);
        }

        ctx.restore();
    }

    // =========================================================================
    // INIT CANVAS
    // =========================================================================
    private initCanvas() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;
        this.ctx = canvas.getContext('2d')!;
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
        await this.throttle_drawDiagram();
    }

    // =========================================================================
    // LAYOUT RÉCURSIF
    // =========================================================================
    private async defineFixedLayout() {
        this.blockPositions = {};
        this.agentLayoutInfos = {};

        // Initialiser expandedAgents pour chaque agent s'il n'existe pas
        for (const itemId of Object.keys(this.items)) {
            const vo = this.items[itemId];
            if (vo.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                if (typeof this.expandedAgents[itemId] === 'undefined') {
                    this.$set(this.expandedAgents, itemId, true); // par défaut : déplié
                }
            }
        }

        // Trouver tous les agents racine (qui n'ont pas de parent agent)
        const agentIds = Object.keys(this.items).filter(id =>
            this.items[id].run_type === OseliaRunVO.RUN_TYPE_AGENT
        );
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

    private async layoutAgentRecursively(agentId: string, startY: number, level: number): Promise<number> {
        const agentW = 200, agentH = 40;
        const plusW = 30, plusH = 30;
        const verticalSpacing = 50;
        const deltaYBetweenAgents = 50;
        const indentX = 300; // décalage horizontal par niveau

        const plusId = 'add_' + agentId;
        this.agentLayoutInfos[agentId] = {
            childrenIds: [],
            plusId,
            expanded: this.expandedAgents[agentId],
        };

        const x = -agentW / 2 + level * indentX;
        this.blockPositions[agentId] = {
            x,
            y: startY,
            w: agentW,
            h: agentH,
        };
        let nextY = startY + agentH;

        // Replié => on n'affiche pas enfants ni "+"
        if (!this.expandedAgents[agentId]) {
            nextY += deltaYBetweenAgents;
            return nextY;
        }

        if (this.isRunVo) {
            const _items: { [id: string]: OseliaRunVO } = (this.items as { [id: string]: OseliaRunVO });
        } else {
            const _items: { [id: string]: OseliaRunTemplateVO } = (this.items as { [id: string]: OseliaRunTemplateVO });
            // Déplié => on récupère enfants et on place
            const item = _items[agentId];
            const childrenIds: string[] = [];
            if (item.children && item.children.length) {
                for (const c of item.children) {
                    const _children = await query(OseliaRunTemplateVO.API_TYPE_ID)
                        .filter_by_ids([c])
                        .set_sort(new SortByVO(OseliaRunTemplateVO.API_TYPE_ID, field_names<OseliaRunTemplateVO>().weight, true))
                        .select_vos<OseliaRunTemplateVO>();
                    for (const child of _children) {
                        const cid = String(child.id);
                        childrenIds.push(cid);
                    }
                }
            }
            this.agentLayoutInfos[agentId].childrenIds = childrenIds;

            for (const cId of childrenIds) {
                const childVo = this.items[cId];
                const childY = nextY + verticalSpacing;

                if (childVo.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                    nextY = await this.layoutAgentRecursively(cId, childY, level + 1);
                } else {
                    const childW = 200;
                    const childH = 40;
                    const cx = x + indentX * (level + 1);
                    this.blockPositions[cId] = {
                        x: cx,
                        y: childY,
                        w: childW,
                        h: childH,
                    };
                    nextY = childY + childH;
                }
            }

            // Place le bloc "+"
            const plusY = nextY + verticalSpacing;
            this.blockPositions[plusId] = {
                x: x + agentW / 2 - plusW / 2,
                y: plusY,
                w: plusW,
                h: plusH,
            };
            nextY = plusY + plusH + deltaYBetweenAgents;

            return nextY;
        }
    }

    // =========================================================================
    // DESSIN
    // =========================================================================

    private drawBlock(ctx: CanvasRenderingContext2D, itemId: string) {
        const pos = this.blockPositions[itemId];
        if (!pos) return;

        const item = this.items[itemId];
        let fillColor = '#E8684A'; // défaut
        if (itemId.startsWith('add_')) {
            fillColor = '#999'; // bloc "+"
        } else if (item.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
            fillColor = '#5B8FF9';
        } else if (item.run_type === OseliaRunVO.RUN_TYPE_FOREACH_IN_SEPARATED_THREADS) {
            fillColor = '#5AD8A6';
        } else if (item.run_type === OseliaRunVO.RUN_TYPE_ASSISTANT) {
            fillColor = '#F6BD16';
        }

        const isSelected = (this.selectedItem === itemId);
        const beingDragged = (this.draggingChildId === itemId);
        if (beingDragged) {
            ctx.globalAlpha = 0.7;
        }

        ctx.save();
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = isSelected ? '#00f' : '#444';
        ctx.lineWidth = isSelected ? 3 : 2;

        ctx.beginPath();
        ctx.rect(pos.x, pos.y, pos.w, pos.h);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#000';
        ctx.font = '14px sans-serif';
        ctx.fillText(item.name || 'Item', pos.x + 10, pos.y + 24);

        if (!itemId.startsWith('add_')) {
            const icon = this.getStateIcon(item.state);
            const iconX = pos.x + pos.w - 20;
            const iconY = pos.y + 24;
            ctx.fillText(icon, iconX, iconY);
        }

        ctx.restore();
        ctx.globalAlpha = 1;
    }

    private getStateIcon(state: number): string {
        switch (state) {
            case OseliaRunVO.STATE_TODO: return '🕗';
            case OseliaRunVO.STATE_SPLITTING: return '🔀';
            case OseliaRunVO.STATE_SPLIT_ENDED: return '✅';
            case OseliaRunVO.STATE_WAITING_SPLITS_END: return '⌛';
            case OseliaRunVO.STATE_WAIT_SPLITS_END_ENDED: return '🔚';
            case OseliaRunVO.STATE_RUNNING: return '🏃';
            case OseliaRunVO.STATE_RUN_ENDED: return '🏁';
            case OseliaRunVO.STATE_VALIDATING: return '🔎';
            case OseliaRunVO.STATE_VALIDATION_ENDED: return '🔏';
            case OseliaRunVO.STATE_DONE: return '✔️';
            case OseliaRunVO.STATE_ERROR: return '❌';
            case OseliaRunVO.STATE_CANCELLED: return '🚫';
            case OseliaRunVO.STATE_EXPIRED: return '⏰';
            case OseliaRunVO.STATE_NEEDS_RERUN: return '↩️';
            case OseliaRunVO.STATE_RERUN_ASKED: return '🔄';
            default: return '❔';
        }
    }

    private drawLinks(ctx: CanvasRenderingContext2D) {
        this.drawnLinks = [];

        for (const agentId of Object.keys(this.agentLayoutInfos)) {
            const info = this.agentLayoutInfos[agentId];
            const agentPos = this.blockPositions[agentId];
            if (!agentPos) continue;

            const ax = agentPos.x + agentPos.w / 2;
            const ay = agentPos.y + agentPos.h;

            if (!info.expanded) {
                continue;
            }

            // Lien agent -> plus
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

            // Pour chaque enfant
            for (const childId of info.childrenIds) {
                const childPos = this.blockPositions[childId];
                if (!childPos) continue;

                const childY = childPos.y;
                const childXLeft = childPos.x;

                ctx.save();
                ctx.strokeStyle = 'gray';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(ax, childY);
                ctx.lineTo(childXLeft, childY);
                ctx.stroke();
                ctx.restore();

                this.drawnLinks.push({
                    sourceItemId: agentId,
                    targetItemId: childId,
                    pathPoints: [
                        { x: ax, y: childY },
                        { x: childXLeft, y: childY },
                    ],
                });
            }
        }
    }

    // =========================================================================
    // EVENTS SOURIS (Pan, Zoom, Drag & Drop)
    // =========================================================================

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

        await this.throttle_drawDiagram();
    }

    private onMouseDown(e: MouseEvent) {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const diagPos = this.screenToDiag(mx, my);

        let clickedOnAnyBlock: string | null = null;

        // On commence par fermer un menu potentiel si on clique hors du menu
        if (this.menuBlock.visible) {
            const clickedIndex = this.checkMenuBlockClick(diagPos.x, diagPos.y);
            if (clickedIndex >= 0) {
                const option = this.menuBlock.options[clickedIndex];
                // On lance directement addChild
                this.addChild(option);
                this.hideMenu();
                return;
            }
            this.hideMenu();
        }

        // On vérifie si on clique sur un bloc
        for (const itemId of Object.keys(this.items)) {
            const pos = this.blockPositions[itemId];
            if (!pos) continue;
            if (
                diagPos.x >= pos.x &&
                diagPos.x <= pos.x + pos.w &&
                diagPos.y >= pos.y &&
                diagPos.y <= pos.y + pos.h
            ) {
                clickedOnAnyBlock = itemId;
                break;
            }
        }

        if (!clickedOnAnyBlock) {
            // -> Pan du canvas
            this.isDraggingCanvas = true;
            this.lastPanX = mx;
            this.lastPanY = my;
            this.$emit('select_item', null);
            return;
        }

        // Sinon, on a cliqué sur un bloc
        const itemId = clickedOnAnyBlock;
        // Bloc "+"
        if (itemId.startsWith('add_')) {
            const agentId = itemId.substring(4);
            this.menuBlock.visible ? this.hideMenu() : this.showMenu(itemId, agentId);
            return;
        }
        this.$emit('select_item', itemId);

        // Stocker la position initiale de la souris pour distinguer clic / drag
        this.mouseDownX = diagPos.x;
        this.mouseDownY = diagPos.y;
        this.possibleDrag = false; // on l’activera si on détecte que c’est un enfant réordonnable


        // Vérif si c'est un enfant potentiellement reorder
        const vo = this.items[itemId];
        const parentId = vo.parent_run_id ? String(vo.parent_run_id) : null;
        if (parentId && this.items[parentId]?.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
            // On prépare un drag, mais on n'enclenche pas encore
            this.possibleDrag = true;
            this.draggingChildId = itemId;
            this.dragParentAgentId = parentId;
            const pos = this.blockPositions[itemId];
            this.dragOffsetY = diagPos.y - pos.y;
        } else {
            this.draggingChildId = itemId;
        }

        // Si on n'a pas de parent agent, ce bloc n'est pas reorderable
        // => dans onMouseUp, on fera potentiellement un pliage/dépliage si c'est un agent
        // ou juste rien s'il est assistant / foreach top-level.
    }

    private async onMouseMove(e: MouseEvent) {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const diagPos = this.screenToDiag(mx, my);

        // Survol du menu
        if (this.menuBlock.visible) {
            const hoveredIndex = this.checkMenuBlockClick(diagPos.x, diagPos.y);
            if (hoveredIndex !== this.menuBlock.hoveredIndex) {
                this.menuBlock.hoveredIndex = hoveredIndex;
                await this.throttle_drawDiagram();
            }
        }

        // Drag du canvas
        if (this.isDraggingCanvas) {
            const dx = mx - this.lastPanX;
            const dy = my - this.lastPanY;
            this.offsetX += dx;
            this.offsetY += dy;

            this.lastPanX = mx;
            this.lastPanY = my;
            await this.throttle_drawDiagram();
            return;
        }

        // Gestion du drag & drop sur un enfant
        if (this.possibleDrag && this.draggingChildId) {
            // Vérifier si on a dépassé le threshold de 5px
            const distX = diagPos.x - this.mouseDownX;
            const distY = diagPos.y - this.mouseDownY;
            const dist = Math.sqrt(distX * distX + distY * distY);
            if (dist > this.moveThreshold) {
                // => on enclenche le drag effectif
                this.isReorderingChild = true;
                this.possibleDrag = false;
            }
        }

        if (this.isReorderingChild && this.draggingChildId) {
            const itemId = this.draggingChildId;
            const pos = this.blockPositions[itemId];
            if (!pos) return;

            const newY = diagPos.y - this.dragOffsetY;
            this.blockPositions[itemId].y = newY;
            await this.throttle_drawDiagram();
        }
    }

    private async onMouseUp(e: MouseEvent) {
        // Fin du drag du canvas
        this.isDraggingCanvas = false;

        // Si on avait enclenché un reorder effectif
        if (this.isReorderingChild && this.draggingChildId && this.dragParentAgentId) {
            this.isReorderingChild = false;

            const draggedChildId = this.draggingChildId;
            const parentId = this.dragParentAgentId;

            // Tri par position Y
            const childrenIds = [...this.agentLayoutInfos[parentId].childrenIds];
            childrenIds.sort((a, b) => {
                const ay = this.blockPositions[a]?.y ?? 0;
                const by = this.blockPositions[b]?.y ?? 0;
                return ay - by;
            });

            // On appelle la fonction
            this.onChildReordered(parentId, childrenIds);

            // On relance le layout
            this.defineFixedLayout().then(async () => {
                await this.throttle_drawDiagram();
            });
        } else {
            // Sinon, c'était un clic (ou un drag insuffisant pour reorder)
            if (this.draggingChildId) {
                // cas d’un bloc cliqué (enfant ou agent)
                const itemId = this.draggingChildId;
                const vo = this.items[itemId];

                // Si c'est un agent => toggler expanded
                // Mais UNIQUEMENT si ce n'est pas un reorder
                if (vo.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                    // Inverse expanded
                    this.expandedAgents[itemId] = !this.expandedAgents[itemId];
                    this.defineFixedLayout().then(async () => {
                        await this.throttle_drawDiagram();
                    });
                }
            }
        }

        // Réinitialiser drag
        this.draggingChildId = null;
        this.dragParentAgentId = null;
        this.possibleDrag = false;
    }

    // =========================================================================
    // MENU "+"
    // =========================================================================
    private async showMenu(plusId: string, agentId: string) {
        this.menuBlock.visible = true;
        this.menuBlock.plusItemId = plusId;
        this.menuBlock.agentId = agentId;
        this.menuBlock.hoveredIndex = -1;
        await this.throttle_drawDiagram();
    }

    private async hideMenu() {
        this.menuBlock.visible = false;
        this.menuBlock.plusItemId = null;
        this.menuBlock.agentId = null;
        this.menuBlock.hoveredIndex = -1;
        await this.throttle_drawDiagram();
    }

    private drawMenuBlock(ctx: CanvasRenderingContext2D) {
        const mb = this.menuBlock;
        if (!mb.visible || !mb.plusItemId) return;
        const plusPos = this.blockPositions[mb.plusItemId];
        if (!plusPos) return;

        const menuX = plusPos.x + mb.offsetX;
        const menuY = plusPos.y + mb.offsetY;
        const w = mb.width;
        const h = mb.height;

        ctx.save();
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;

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
    // AJOUT D'ENFANT
    // =========================================================================
    private async addChild(type: string) {
        const init_vo = new OseliaRunTemplateVO();
        if (type === 'ASSISTANT') {
            init_vo.run_type = OseliaRunVO.RUN_TYPE_ASSISTANT;
        } else if (type === 'FOREACH') {
            init_vo.run_type = OseliaRunVO.RUN_TYPE_FOREACH_IN_SEPARATED_THREADS;
        } else {
            init_vo.run_type = OseliaRunVO.RUN_TYPE_AGENT; // ex. AGENT
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
                const parentId = vo.parent_run_id;
                if (this.isRunVo) {
                    const _items: { [id: string]: OseliaRunVO } = (this.items as { [id: string]: OseliaRunVO });
                } else {
                    const _items: { [id: string]: OseliaRunTemplateVO } = (this.items as { [id: string]: OseliaRunTemplateVO });
                    if (!_items[parentId].children) {
                        _items[parentId].children = [];
                    }
                    _items[parentId].children.push(
                        RangeHandler.create_single_elt_NumRange(vo.id, NumSegment.TYPE_INT)
                    );
                    vo.parent_id = parentId;
                    this.$set(this.items, vo.id, vo);

                    await ModuleDAO.instance.insertOrUpdateVO(this.items[parentId]);
                    return;
                }
            }
        );
    }

    // =========================================================================
    // GESTION DU RÉORDONNANCEMENT
    // =========================================================================
    private async onChildReordered(parentId: string, newChildrenOrder: string[]) {
        if (this.isRunVo) {
            const _items: { [id: string]: OseliaRunVO } = (this.items as { [id: string]: OseliaRunVO });
        } else {
            const _items: { [id: string]: OseliaRunTemplateVO } = (this.items as { [id: string]: OseliaRunTemplateVO });
            const parentVO = _items[parentId];
            parentVO.children = [];
            let weight = 0;
            for (const childId of newChildrenOrder) {
                this.items[childId].weight = weight;
                await ModuleDAO.instance.insertOrUpdateVO(this.items[childId]);
                parentVO.children.push(
                    RangeHandler.create_single_elt_NumRange(Number(childId), NumSegment.TYPE_INT)
                );
                weight++;
            }
            this.$set(this.items, parentId, parentVO);
        }
    }

    // =========================================================================
    // CONVERSION COORDONNÉES
    // =========================================================================
    private screenToDiag(sx: number, sy: number): { x: number; y: number } {
        return {
            x: (sx - this.offsetX) / this.scale,
            y: (sy - this.offsetY) / this.scale,
        };
    }
}
