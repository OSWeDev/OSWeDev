import Vue from 'vue';
import Component from 'vue-class-component';
import { Prop } from 'vue-property-decorator';
import './AddMenu.scss';

@Component({
    template: require('./AddMenu.pug')
})
export default class AddMenu extends Vue {

    @Prop({ default: () => ({ x: 0, y: 0 }) })
        plusPosition!: { x: number; y: number };

    @Prop({ default: () => [] })
        options!: string[];

    // Nouvelle prop : la fonction pour supprimer un item
    @Prop({ type: Function, required: true })
    public selectOption!: (type: string) => void;

    get menuStyle() {
        return {
            position: 'absolute',
            left: `${this.plusPosition.x}px`,
            top: `${this.plusPosition.y}px`,
            width: '120px',
            border: '1px solid #333',
            background: '#fff',
            padding: '8px',
            boxShadow: '2px 2px 8px rgba(0,0,0,0.2)',
            zIndex: 999
        };
    }
    private onOptionClick(option: string) {
        this.selectOption(option);
    }

    private async onClose() {
        await this.$emit('close');
    }

}
