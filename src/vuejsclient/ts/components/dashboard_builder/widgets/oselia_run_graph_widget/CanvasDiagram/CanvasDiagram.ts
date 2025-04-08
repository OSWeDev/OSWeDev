import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';

import './CanvasDiagram.scss';

import DiagramDataService from './Services/DiagramDataService';
import DiagramLayout, { BlockPosition, LinkDrawInfo } from './Services/DiagramLayoutService';

import DiagramBlock from './DiagramBlock/DiagramBlock';
import DiagramLink from './DiagramLink/DiagramLink';
import AddMenu from './AddMenu/AddMenu';
import GPTAssistantAPIFunctionVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import OseliaRunTemplateVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../../../../../shared/modules/Oselia/vos/OseliaRunVO';
import VueComponentBase from '../../../../VueComponentBase';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import NumSegment from '../../../../../../../shared/modules/DataRender/vos/NumSegment';
import RangeHandler from '../../../../../../../shared/tools/RangeHandler';
import { ModuleDashboardPageGetter } from '../../../page/DashboardPageStore';
import CRUDCreateModalComponent from '../../table_widget/crud_modals/create/CRUDCreateModalComponent';
import IDistantVOBase from '../../../../../../../shared/modules/IDistantVOBase';
import { ModuleDAOAction } from '../../../../dao/store/DaoStore';
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
    }
})
export default class CanvasDiagram extends VueComponentBase {

    @Prop({ required: true })
        items!: { [id: string]: OseliaRunTemplateVO | OseliaRunVO | GPTAssistantAPIFunctionVO };

    @Prop({ required: true })
        isRunVo!: boolean;

    @ModuleDAOAction
    private storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;

    @ModuleDashboardPageGetter
    private get_Crudcreatemodalcomponent: CRUDCreateModalComponent;
    // Pas de watchers multiples, juste un sur `items`
    private adjacency: { [id: string]: string[] } = {};
    private functionsInfos: {
        [id: string]: {
            gptFunction: GPTAssistantAPIFunctionVO;
            runFunction: any;
        }
    } = {};
    private selectedItem: string | null = null;
    private expandedAgents: { [id: string]: boolean } = {};

    private scale: number = 1;
    private offsetX: number = 0;
    private offsetY: number = 0;
    private isDragging = false;
    private lastPanX = 0;
    private lastPanY = 0;

    private hoveredItemId: string | null = null;
    private hoveredX = 0;
    private hoveredY = 0;
    private menuPlus: {
        visible: boolean,
        x: number,
        y: number,
        agentId: null | string,
        options: string[]
    } = {
            visible: false,
            x: 0,
            y: 0,
            agentId: null,
            options: ['AGENT', 'FOREACH', 'ASSISTANT']
        };

    get blockPositions(): { [id: string]: BlockPosition } {
        if (this.isRunVo) {
            const { blockPositions } = DiagramLayout.layoutRunDiagram(this.items as any, this.adjacency);
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
            const { drawnLinks } = DiagramLayout.layoutRunDiagram(this.items as any, this.adjacency);
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

    get wrapperStyle() {
        return {
            transform: `translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`
        };
    }

    @Watch('items', { immediate: true, deep: false })
    async onItemsChange() {
        await this.prepareData();
    }

    async mounted() {
        const ctn = this.$refs.diagramContainer as HTMLDivElement;
        if (ctn) {
            this.offsetX = ctn.offsetWidth / 2;
            this.offsetY = ctn.offsetHeight / 2;
        }
        window.addEventListener('resize', this.onResize);

        await this.prepareData();
    }

    beforeDestroy() {
        window.removeEventListener('resize', this.onResize);
    }

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

    private async prepareData() {
        if (this.isRunVo) {
            const res = await DiagramDataService.prepareRunData(this.items as any);
            this.adjacency = res.adjacency;
            this.functionsInfos = res.functionsInfos;
            for (const k of Object.keys(res.items)) {
                this.$set(this.items, k, res.items[k]);
            }
        } else {
            const res = await DiagramDataService.prepareTemplateData(this.items as any);
            this.adjacency = res.adjacency;
            for (const k of Object.keys(res.items)) {
                this.$set(this.items, k, res.items[k]);
            }
            // init expanded
            for (const id of Object.keys(this.items)) {
                const vo = this.items[id];
                if ((vo as OseliaRunTemplateVO).run_type === OseliaRunVO.RUN_TYPE_AGENT && this.expandedAgents[id] === undefined) {
                    this.$set(this.expandedAgents, id, true);
                }
            }
        }
        this.$forceUpdate();
    }
    private openPlusMenu(plusItemId: string) {
        // On récupère la position du bloc
        const bp = this.blockPositions[plusItemId];
        if (!bp) return;
        const px = bp.x + bp.w/2;
        const py = bp.y + bp.h/2;
        this.menuPlus.visible = true;
        this.menuPlus.x = px;
        this.menuPlus.y = py;
        // agentId ?
        const agentId = plusItemId.replace('add_', '');
        this.menuPlus.agentId = agentId;
    }

    private closePlusMenu() {
        this.menuPlus.visible = false;
        this.menuPlus.agentId = null;
    }

    // quand on sélectionne un option
    private async onAddChild(type: string) {

        const init_vo = new OseliaRunTemplateVO();
        if (type === 'ASSISTANT') {
            init_vo.run_type = OseliaRunVO.RUN_TYPE_ASSISTANT;
        } else if (type === 'FOREACH') {
            init_vo.run_type = OseliaRunVO.RUN_TYPE_FOREACH_IN_SEPARATED_THREADS;
        } else {
            init_vo.run_type = OseliaRunVO.RUN_TYPE_AGENT;
        }
        init_vo.state = OseliaRunVO.STATE_TODO;
        init_vo.parent_run_id = Number(this.menuPlus.agentId);
        init_vo.parent_id = Number(this.menuPlus.agentId);

        await this.get_Crudcreatemodalcomponent.open_modal(
            OseliaRunTemplateVO.API_TYPE_ID,
            this.storeDatas,
            null,
            init_vo,
            false,
            async (vo: OseliaRunTemplateVO) => {
                // On met à jour la liste des enfants dans le parent
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
        );

        this.menuPlus.visible = false;
        this.menuPlus.agentId = null;
    }

    private onBlockClicked(itemId: string, vo: any) {
        // 1) Sélection
        this.selectedItem = itemId;

        // 2) S’il s’agit d’un agent, toggle expand
        if (!this.isRunVo) {
            // On cast en OseliaRunTemplateVO
            const tpl = vo as OseliaRunTemplateVO;
            if (tpl.run_type === OseliaRunVO.RUN_TYPE_AGENT) {
                // toggle
                this.expandedAgents[itemId] = !this.expandedAgents[itemId];
                this.$forceUpdate();
                this.$emit('select_item', itemId, null /*ou runFunction*/);
                return;
            }
        }

        // 3) S’il s’agit d’un bloc "plus"
        if (String(itemId).startsWith('add_') || (vo.run_type === 9999)) {
            // on peut ouvrir un menu, ex. :
            this.openPlusMenu(vo.name);
            return;
        }

        // 4) GPT function ou Run => rien de spécial
        this.$emit('select_item', itemId, null /*ou runFunction*/);
    }

    private onResize() {
        const ctn = this.$refs.diagramContainer as HTMLDivElement;
        if (!ctn) return;
        this.offsetX = ctn.offsetWidth / 2;
        this.offsetY = ctn.offsetHeight / 2;
        this.$forceUpdate();
    }

    private onWheel(e: WheelEvent) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.scale = Math.max(0.05, this.scale + delta);
        this.$forceUpdate();
    }

    private onMouseDown(e: MouseEvent) {
        const rect = (this.$refs.diagramContainer as HTMLDivElement).getBoundingClientRect();
        this.lastPanX = e.clientX - rect.left;
        this.lastPanY = e.clientY - rect.top;
        this.isDragging = true;
    }

    private onMouseMove(e: MouseEvent) {
        const ctn = this.$refs.diagramContainer as HTMLDivElement;
        if (!ctn) return;
        const rect = ctn.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // hover
        const diagPos = {
            x: (mx - this.offsetX)/this.scale,
            y: (my - this.offsetY)/this.scale
        };
        let found: string | null = null;
        for (const bid of Object.keys(this.blockPositions)) {
            const bp = this.blockPositions[bid];
            if (
                diagPos.x >= bp.x && diagPos.x <= bp.x + bp.w &&
                diagPos.y >= bp.y && diagPos.y <= bp.y + bp.h
            ) {
                if (!bid.startsWith('add_')) {
                    found = bid;
                }
                break;
            }
        }
        this.hoveredItemId = found;
        this.hoveredX = mx;
        this.hoveredY = my;

        if (this.isDragging) {
            const dx = mx - this.lastPanX;
            const dy = my - this.lastPanY;
            this.offsetX += dx;
            this.offsetY += dy;
            this.lastPanX = mx;
            this.lastPanY = my;
            this.$forceUpdate();
        }
    }

    private onMouseUp(e: MouseEvent) {
        this.isDragging = false;
    }
}
