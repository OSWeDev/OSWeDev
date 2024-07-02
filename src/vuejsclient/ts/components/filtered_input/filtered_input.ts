import { Component, Vue, Watch, Prop } from 'vue-property-decorator';
import VueComponentBase from '../VueComponentBase';

@Component({
    template: require('./filtered_input.pug')
})
export default class VueFilteredInputComponent extends VueComponentBase {

    @Prop({
        default: false
    })
    private isreadonly: boolean;
    @Prop({
        default: false
    })
    private istextarea: boolean;
    @Prop({
        default: "text"
    })
    private type: string;
    @Prop({
        default: "div"
    })
    private wrapper: string;
    @Prop([String, Number])
    private value: string | number;
    @Prop()
    private filters;
    @Prop({
        default: function () { }
    })
    private onchange;

    get input_class() {
        if (this.isreadonly) {
            return "form-control";
        }

        return "";
    }

    private mounted() {
        const self = this;
        this.$nextTick(function () {
            self.formatValue();
        });
    }

    private async onChangeHandler() {
        this.updateValue(event.target['value']);
        if (this.onchange) {
            await this.onchange();
        }
    }

    private updateValue(value) {
        if (this.filters) {
            value = this.filters.applyWrite(value);
        }

        this.$emit('update_editable_td', value);
    }

    private formatValue() {

        let value = this.value;

        if (this.filters) {
            value = this.filters.applyRead(value);
        }

        if (this.$refs.input) {
            this.$refs.input['value'] = value;
        }
        //      this.is_focused = false;
    }
}