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
    onOptionClick(option: string) {
        this.$emit('selectOption', option);
    }

    onClose() {
        this.$emit('close');
    }

}
