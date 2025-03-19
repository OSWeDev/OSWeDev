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

interface LinkDrawInfo {
    sourceItemId: string;
    targetItemId: string;
    pathPoints: { x: number; y: number }[];
}

interface AgentLayoutInfo {
    childrenIds: string[];
    plusId: string;
}

@Component({
    template: require('./CanvasDiagram.pug'),
})
export default class CanvasDiagram extends Vue {

    @Prop()
    readonly items!: { [id: string]: OseliaRunTemplateVO };

    @Prop({ default: null })
    private selectedItem!: string | null;

    @Prop({ default: null })
    private updatedItem!: OseliaRunTemplateVO | null;

    @ModuleDashboardPageGetter
    private get_Crudcreatemodalcomponent!: CRUDCreateModalComponent;

    @ModuleDAOAction
    private storeDatas!: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    private isDraggingCanvas = false;
    private lastPanX = 0;
    private lastPanY = 0;

    // -------------------------------------------------------------------------
    // CANVAS
    private ctx: CanvasRenderingContext2D | null = null;
    private scale: number = 1;
    private offsetX: number = 0;
    private offsetY: number = 0;

    // -------------------------------------------------------------------------
    // POSITIONS
    private blockPositions: {
        [itemId: string]: { x: number; y: number; w: number; h: number };
    } = {};

    private agentLayoutInfos: { [agentId: string]: AgentLayoutInfo } = {};

    // -------------------------------------------------------------------------
    // ADJACENCY
    private adjacency: { [id: string]: string[] } = {};

    // -------------------------------------------------------------------------
    // MENU
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
    // MISC
    private drawnLinks: LinkDrawInfo[] = [];

    @Watch('selectedItem')
    private onSelectedItemChange() {
        this.drawDiagram();
    }

    @Watch('updatedItem')
    private onUpdatedItemChange() {
        if (this.updatedItem) {
            this.items[this.updatedItem.id] = this.updatedItem;
            this.drawDiagram();
        }
    }

    @Watch('items', { deep: true, immediate: true })
    private async onItemsChange() {
        // ... (identique à votre code, reconstruit adjacency, etc.)
        // On ne modifie pas la logique du watch, juste le dessin
        this.adjacency = {};
        for (const itemId of Object.keys(this.items)) {
            this.adjacency[itemId] = [];
        }

        for (const itemId of Object.keys(this.items)) {
            const item = this.items[itemId];
            if (item.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                const addId = 'add_' + itemId;
                if (!this.items[addId]) {
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
                            .select_vos<OseliaRunTemplateVO>();
                        for (const child of _children) {
                            const cid = String(child.id);
                            childrenIds.push(cid);
                            if (!this.items[cid]) {
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

        await this.defineFixedLayout();
        this.drawDiagram();
    }

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

    private initCanvas() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;
        this.ctx = canvas.getContext('2d')!;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.offsetX = canvas.width / 2;
        this.offsetY = canvas.height / 2;
    }

    private onResize() {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        if (!canvas) return;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        this.offsetX = canvas.width / 2;
        this.offsetY = canvas.height / 2;
        this.drawDiagram();
    }

    private async defineFixedLayout() {
        // ... (logique identique pour calculer la position de chaque agent, enfant, plus)
        this.blockPositions = {};
        this.agentLayoutInfos = {};

        let currentY = 0;
        const verticalSpacing = 50;
        const deltaYBetweenAgents = 150;

        const agentW = 200, agentH = 40;
        const childW = 200, childH = 40;
        const plusW = 30, plusH = 30;

        const agentIds = Object.keys(this.items).filter(id => {
            return this.items[id].run_type === OseliaRunVO.RUN_TYPE_AGENT;
        });

        for (const agentId of agentIds) {

            // place l'agent
            this.blockPositions[agentId] = {
                x: -agentW / 2,
                y: currentY,
                w: agentW,
                h: agentH,
            };
            const ax = this.blockPositions[agentId].x + agentW / 2;
            const ay = this.blockPositions[agentId].y + agentH;

            const item = this.items[agentId];
            const childrenIds: string[] = [];
            if (item.children && item.children.length) {
                for (const c of item.children) {
                    const _children = await query(OseliaRunTemplateVO.API_TYPE_ID)
                        .filter_by_ids([c])
                        .select_vos<OseliaRunTemplateVO>();
                    for (const child of _children) {
                        childrenIds.push(String(child.id));
                    }
                }
            }

            const plusId = 'add_' + agentId;
            this.agentLayoutInfos[agentId] = {
                childrenIds,
                plusId
            };

            let i = 0;
            for (const cId of childrenIds) {
                const childTop = ay + (i + 1) * verticalSpacing;
                this.blockPositions[cId] = {
                    x: 200,
                    y: childTop,
                    w: childW,
                    h: childH,
                };
                i++;
            }

            const plusTop = ay + (childrenIds.length + 1) * verticalSpacing;
            this.blockPositions[plusId] = {
                x: ax - plusW / 2,
                y: plusTop,
                w: plusW,
                h: plusH,
            };

            currentY = plusTop + plusH + deltaYBetweenAgents;
        }
    }

    private drawDiagram() {
        if (!this.ctx) return;
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const ctx = this.ctx;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);

        this.drawLinks(ctx);

        // Dessin blocs
        for (const itemId of Object.keys(this.items)) {
            this.drawBlock(ctx, itemId);
        }

        // Menu
        if (this.menuBlock.visible && this.menuBlock.plusItemId) {
            this.drawMenuBlock(ctx);
        }

        ctx.restore();
    }

    /**
     * Renvoie une icône (texte) en fonction de l'état du VO.
     * Vous pouvez adapter ces symboles selon votre convenance.
     */
    private getStateIcon(state: number): string {
        switch (state) {
            case OseliaRunVO.STATE_TODO:
                return '🕗'; // par ex.
            case OseliaRunVO.STATE_SPLITTING:
                return '🔀';
            case OseliaRunVO.STATE_SPLIT_ENDED:
                return '✅';
            case OseliaRunVO.STATE_WAITING_SPLITS_END:
                return '⌛';
            case OseliaRunVO.STATE_WAIT_SPLITS_END_ENDED:
                return '🔚';
            case OseliaRunVO.STATE_RUNNING:
                return '🏃';
            case OseliaRunVO.STATE_RUN_ENDED:
                return '🏁';
            case OseliaRunVO.STATE_VALIDATING:
                return '🔎';
            case OseliaRunVO.STATE_VALIDATION_ENDED:
                return '🔏';
            case OseliaRunVO.STATE_DONE:
                return '✔️';
            case OseliaRunVO.STATE_ERROR:
                return '❌';
            case OseliaRunVO.STATE_CANCELLED:
                return '🚫';
            case OseliaRunVO.STATE_EXPIRED:
                return '⏰';
            case OseliaRunVO.STATE_NEEDS_RERUN:
                return '↩️';
            case OseliaRunVO.STATE_RERUN_ASKED:
                return '🔄';
            default:
                return '❔'; // si état inconnu
        }
    }

    private drawBlock(ctx: CanvasRenderingContext2D, itemId: string) {
        const pos = this.blockPositions[itemId];
        if (!pos) return;

        const item = this.items[itemId];

        // Couleur en fonction du type
        let fillColor = '#E8684A'; // défaut
        if (itemId.startsWith('add_')) {
            fillColor = '#999'; // le "+"
        } else if (item.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
            fillColor = '#5B8FF9';
        } else if (item.run_type === OseliaRunVO.RUN_TYPE_FOREACH_IN_SEPARATED_THREADS) {
            fillColor = '#5AD8A6';
        } else if (item.run_type === OseliaRunVO.RUN_TYPE_ASSISTANT) {
            fillColor = '#F6BD16';
        }

        const isSelected = (this.selectedItem === itemId);

        ctx.save();
        ctx.fillStyle = fillColor;
        ctx.strokeStyle = isSelected ? '#00f' : '#444';
        ctx.lineWidth = isSelected ? 3 : 2;

        ctx.beginPath();
        ctx.rect(pos.x, pos.y, pos.w, pos.h);
        ctx.fill();
        ctx.stroke();

        // Label du bloc
        ctx.fillStyle = '#000';
        ctx.font = '14px sans-serif';
        ctx.fillText(item.name || 'Item', pos.x + 10, pos.y + 24);

        // Icone d'état : on ne l'affiche pas si c'est le bloc "add_..." (qui n'a pas d'état)
        if (!itemId.startsWith('add_')) {
            const icon = this.getStateIcon(item.state);
            // On place l'icône à droite du bloc (par ex. marge de 20px à droite)
            const iconX = pos.x + pos.w - 20;
            const iconY = pos.y + 24; // aligné verticalement avec le texte

            ctx.fillText(icon, iconX, iconY);
        }

        ctx.restore();
    }

    private drawLinks(ctx: CanvasRenderingContext2D) {
        this.drawnLinks = [];

        for (const agentId of Object.keys(this.agentLayoutInfos)) {
            const info = this.agentLayoutInfos[agentId];
            const agentPos = this.blockPositions[agentId];
            if (!agentPos) continue;

            // trait vertical (agent -> plus)
            const ax = agentPos.x + agentPos.w / 2;
            const ay = agentPos.y + agentPos.h;

            const plusPos = this.blockPositions[info.plusId];
            if (!plusPos) continue;
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

            // Pour chaque enfant, un trait horizontal
            for (const childId of info.childrenIds) {
                const childPos = this.blockPositions[childId];
                if (!childPos) continue;

                const childY = childPos.y; // on prend le top du bloc enfant
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

    private onWheel(e: WheelEvent) {
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

        this.drawDiagram();
    }

    private async onMouseDown(e: MouseEvent) {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const diagPos = this.screenToDiag(mx, my);
        let clickOnItem: boolean = false;

        for (const itemId of Object.keys(this.items)) {
            const pos = this.blockPositions[itemId];
            if (!pos) continue;

            if (
                diagPos.x >= pos.x &&
                diagPos.x <= pos.x + pos.w &&
                diagPos.y >= pos.y &&
                diagPos.y <= pos.y + pos.h
            ) {
                clickOnItem = true;
                this.$emit('select_item', itemId);
            }
        }

        // 1) Clic menu ?
        if (this.menuBlock.visible) {
            const clickedIndex = this.checkMenuBlockClick(diagPos.x, diagPos.y);
            if (clickedIndex >= 0) {
                const option = this.menuBlock.options[clickedIndex];
                console.log('Menu clicked on:', option);

                switch (option) {
                    case 'AGENT':
                        // ...
                        break;
                    case 'FOREACH':
                    case 'ASSISTANT':
                        await this.addChild(option);
                        break;
                }
                this.hideMenu();
                if (!clickOnItem) {
                    this.$emit('select_item', null);
                }
                return;
            }
        }

        // 2) Clic sur "+"
        for (const itemId of Object.keys(this.items)) {
            if (!itemId.startsWith('add_')) continue;
            const pos = this.blockPositions[itemId];
            if (!pos) continue;

            if (
                diagPos.x >= pos.x &&
                diagPos.x <= pos.x + pos.w &&
                diagPos.y >= pos.y &&
                diagPos.y <= pos.y + pos.h
            ) {
                const agentId = itemId.substring(4);
                if (this.menuBlock.visible) {
                    this.hideMenu();
                } else {
                    this.showMenu(itemId, agentId);
                }
                if (!clickOnItem) {
                    this.$emit('select_item', null);
                }
                return;
            }
        }

        // 3) Pan
        this.isDraggingCanvas = true;
        this.lastPanX = mx;
        this.lastPanY = my;
        if(!clickOnItem) {
            this.$emit('select_item', null);
        }
    }

    private onMouseMove(e: MouseEvent) {
        const canvas = this.$refs.diagramCanvas as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        const diagPos = this.screenToDiag(mx, my);

        if (this.menuBlock.visible) {
            const hoveredIndex = this.checkMenuBlockClick(diagPos.x, diagPos.y);
            if (hoveredIndex !== this.menuBlock.hoveredIndex) {
                this.menuBlock.hoveredIndex = hoveredIndex;
                this.drawDiagram();
            }
        }

        if (this.isDraggingCanvas) {
            const dx = mx - this.lastPanX;
            const dy = my - this.lastPanY;
            this.offsetX += dx;
            this.offsetY += dy;

            this.lastPanX = mx;
            this.lastPanY = my;
            this.drawDiagram();
        }
    }

    private onMouseUp(e: MouseEvent) {
        this.isDraggingCanvas = false;
    }

    private showMenu(plusId: string, agentId: string) {
        this.menuBlock.visible = true;
        this.menuBlock.plusItemId = plusId;
        this.menuBlock.agentId = agentId;
        this.menuBlock.hoveredIndex = -1;
        this.drawDiagram();
    }

    private hideMenu() {
        this.menuBlock.visible = false;
        this.menuBlock.plusItemId = null;
        this.menuBlock.agentId = null;
        this.menuBlock.hoveredIndex = -1;
        this.drawDiagram();
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

            // survol
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

    private async addChild(type: string) {
        const init_vo = new OseliaRunTemplateVO();
        if (type === 'ASSISTANT') {
            init_vo.run_type = OseliaRunVO.RUN_TYPE_ASSISTANT;
        } else if (type === 'FOREACH') {
            init_vo.run_type = OseliaRunVO.RUN_TYPE_FOREACH_IN_SEPARATED_THREADS;
        } else {
            // ex. AGENT
            return;
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
                if (!this.items[parentId].children) {
                    this.items[parentId].children = [];
                }
                this.items[parentId].children.push(
                    RangeHandler.create_single_elt_NumRange(vo.id, NumSegment.TYPE_INT)
                );
                vo.parent_id = parentId;
                this.$set(this.items, vo.id, vo);

                await ModuleDAO.instance.insertOrUpdateVO(this.items[parentId]);
                this.drawDiagram();
                return;
            }
        );
    }

    private screenToDiag(sx: number, sy: number): { x: number; y: number } {
        return {
            x: (sx - this.offsetX) / this.scale,
            y: (sy - this.offsetY) / this.scale,
        };
    }
}
