import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';

// On importe le template Pug et le style
import './DiagramBlock.scss';

// On accepte une fonction getStateIcon() en prop pour pouvoir l'utiliser
import { StateIconInfo } from '../CanvasDiagram';
import GPTAssistantAPIFunctionVO from '../../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import OseliaRunTemplateVO from '../../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../../../../../../shared/modules/Oselia/vos/OseliaRunVO';

@Component({
    template: require('./DiagramBlock.pug')
})
export default class DiagramBlock extends Vue {

    @Prop({ required: true })
        item!: OseliaRunVO | OseliaRunTemplateVO | GPTAssistantAPIFunctionVO;

    @Prop({ required: true })
        blockPos!: { x: number; y: number; w: number; h: number };

    @Prop({ default: false })
        isSelected!: boolean;

    @Prop({ default: false })
        isRunVo!: boolean;

    @Prop({ default: false })
        ghost!: boolean;

    // Le parent nous donne une fonction pour récupérer l'icône/état
    @Prop({ required: true })
        getStateIcon! : (state: number) => StateIconInfo;

    get displayText(): string {
    // Même logique qu'avant
        if ((this.item as any)._type === OseliaRunVO.API_TYPE_ID) {
            const run = this.item as OseliaRunVO;
            return run.name || 'Run';
        }
        if ((this.item as any)._type === GPTAssistantAPIFunctionVO.API_TYPE_ID) {
            const func = this.item as GPTAssistantAPIFunctionVO;
            return func.gpt_function_name || 'Function';
        }
        const tpl = this.item as OseliaRunTemplateVO;
        if(tpl.name.startsWith('add_')) {
            return '+';
        }
        return tpl.name || '+';
    }

    get iconInfo(): StateIconInfo {
    // On récupère l'état
        if (this.isRunVo) {
            const st = (this.item as any).state || OseliaRunVO.STATE_TODO;
            return this.getStateIcon(st);
        } else {
            return  {
                info: '',
                icon: '',
                color: '',
            };
        }
    }

    get blockStyle() {
        return {
            position: 'absolute',
            left: this.blockPos.x + 'px',
            top: this.blockPos.y + 'px',
            width: this.blockPos.w + 'px',
            height: this.blockPos.h + 'px',
            border: this.resolveBorderColor(),
            backgroundColor: this.resolveFillColor(),
            boxSizing: 'border-box',
            opacity: this.ghost ? 0.8 : 1,
            userSelect: 'none',
            pointerEvents: this.ghost ? 'none' : 'auto'
        };
    }
    /**
     * Quand on clique : on émet un event "clickBlock"
     */
    onClickBlock(e: MouseEvent) {
        e.stopPropagation();
        // On peut émettre l'ID + l'item
        this.$emit('clickBlock', this.item.id, this.item);
    }
    private resolveBorderColor(): string {
        if(String(this.item.id).startsWith("add_")) {
            return '#999';
        }
        if (this.isSelected) {
            return '3px solid blue';
        } else {
            return `2px solid ${this.iconInfo.color || '#999'}`;
        }
    }

    private resolveFillColor(): string {
        if (String(this.item.id).startsWith('add_') || (this.item as any).run_type === 9999) {
            return '#999';
        } else if ((this.item as any).run_type === OseliaRunVO.RUN_TYPE_AGENT) {
            return '#5B8FF9';
        } else if ((this.item as any).run_type === OseliaRunVO.RUN_TYPE_FOREACH_IN_SEPARATED_THREADS) {
            return '#5AD8A6';
        } else if ((this.item as any).run_type === OseliaRunVO.RUN_TYPE_ASSISTANT) {
            return '#F6BD16';
        }
        return '#f2dfda';
    }
}
