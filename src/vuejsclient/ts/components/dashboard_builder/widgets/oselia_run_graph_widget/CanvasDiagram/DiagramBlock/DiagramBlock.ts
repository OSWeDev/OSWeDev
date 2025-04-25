import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';

// On importe le template Pug et le style
import './DiagramBlock.scss';

// On accepte une fonction getStateIcon() en prop pour pouvoir l'utiliser
import { StateIconInfo } from '../CanvasDiagram';
import GPTAssistantAPIFunctionVO from '../../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import OseliaRunTemplateVO from '../../../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';
import OseliaRunVO from '../../../../../../../../shared/modules/Oselia/vos/OseliaRunVO';
import OseliaRunFunctionCallVO from '../../../../../../../../shared/modules/Oselia/vos/OseliaRunFunctionCallVO';
import { fontWeight } from 'html2canvas/dist/types/css/property-descriptors/font-weight';

@Component({
    template: require('./DiagramBlock.pug')
})
export default class DiagramBlock extends Vue {

    @Prop({ required: true })
        item!: OseliaRunVO | OseliaRunTemplateVO | GPTAssistantAPIFunctionVO | OseliaRunFunctionCallVO;

    @Prop({ required: true })
        blockPos!: { x: number; y: number; w: number; h: number };

    @Prop({ default: false })
        isSelected!: boolean;

    @Prop({ default: false })
        isRunVo!: boolean;

    @Prop({ default: false })
        ghost!: boolean;

    @Prop({ default: null })
        functionsInfos!: {
        gptFunction: GPTAssistantAPIFunctionVO;
        runFunction: OseliaRunFunctionCallVO[];
    };

    // Le parent nous donne une fonction pour récupérer l'icône/état
    @Prop({ required: true })
        getStateIcon!: (state: number) => StateIconInfo;

    get displayText(): { time: string, function: string } {
        if (!this.item){
            return { time: '', function: '' };
        }
        // Même logique qu'avant
        if ((this.item as any)._type === OseliaRunVO.API_TYPE_ID) {
            const run = this.item as OseliaRunVO;
            return { time:'', function:run.name || 'Run' };
        }
        if ((this.item as any)._type === GPTAssistantAPIFunctionVO.API_TYPE_ID) {
            const func = this.item as GPTAssistantAPIFunctionVO;
            return { time: '', function: func.gpt_function_name || 'Function' };
        }

        if ((this.item as any)._type === OseliaRunFunctionCallVO.API_TYPE_ID) {
            const func = this.item as OseliaRunFunctionCallVO;
            let toAdd = '';
            if (this.functionsInfos && this.functionsInfos.gptFunction != undefined) {
                toAdd  = this.functionsInfos.gptFunction.gpt_function_name;
            }
            return { time: this.formatUnixTimestamp(func.end_date), function: toAdd  || 'Function Call' };
        }
        const tpl = this.item as OseliaRunTemplateVO;
        if(tpl.name.startsWith('add_')) {
            return { time: '', function: '+' };
        }
        return { time: '', function: tpl.name || '+' };
    }

    get iconInfo(): StateIconInfo {
        if (this.item === undefined) {
            return { icon: '', color: '#4A90E2', info: '' };
        }
        // On récupère l'état
        if (this.isRunVo) {
            if (this.item._type === GPTAssistantAPIFunctionVO.API_TYPE_ID) {
                return {
                    icon: 'function',
                    color: '#f2dfda',
                    info: ''
                };
            }
            const st = (this.item as any).state;
            return this.getStateIcon(st);
        } else {
            return {
                icon: '',
                color: (this.item as any).run_type === 9999 ? '#999' : '#4A90E2',
                info: ''
            };
        }
    }

    get blockStyle() {
        return {
            position: 'absolute',
            left: this.blockPos.x + 'px',
            top: this.blockPos.y + 'px',
            width: this.blockPos.w + 'px',
            height: 'fit-content',
            border: this.resolveBorderColor(),
            backgroundColor: this.resolveFillColor(),
            boxSizing: 'border-box',
            opacity: this.ghost ? 0.8 : 1,
            userSelect: 'none',
            pointerEvents: this.ghost ? 'none' : 'auto',
            fontWeight: this.item?._type==GPTAssistantAPIFunctionVO.API_TYPE_ID ? 'bold' : 'normal',
            'z-index': 25,
            'box-shadow': this.iconInfo.color ? `0 0 8px ${this.iconInfo.color}` : ''
        };
    }

    private mounted() {
        this.$emit("first_autofit");
    }

    private resolveBorderColor(): string {
        if(this.isSelected) {
            return '3px solid blue';
        } else {
            return `2px solid ${this.iconInfo.color || '#4A90E2'}`;
        }
    }

    private formatUnixTimestamp(timestamp: number): string {
        const date = new Date(timestamp * 1000); // convertir en millisecondes

        const pad = (n: number) => n.toString().padStart(2, '0');

        const day = pad(date.getDate());
        const month = pad(date.getMonth() + 1); // mois commence à 0
        const year = date.getFullYear();

        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }

    private resolveFillColor(): string {
        if (!this.item) {
            return '#f2dfda';
        }
        if ((this.item as any)._type === OseliaRunFunctionCallVO.API_TYPE_ID) {
            const func = this.item as OseliaRunFunctionCallVO;
            return this.getStateIcon(func.state).color || '#f2dfda';
        }

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
