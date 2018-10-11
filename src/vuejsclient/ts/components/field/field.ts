import { Component, Prop } from 'vue-property-decorator';
import VueFilteredInputComponent from '../filtered_input/filtered_input';
import VueComponentBase from '../VueComponentBase';

@Component({
    template: require('./field.pug'),
    components: { 'filtered-input': VueFilteredInputComponent }
})
export default class VueFieldComponent extends VueComponentBase {

    @Prop()
    private name: string;
    @Prop([String, Number])
    private value: string | number;
    @Prop()
    private subname: string;
    @Prop()
    private field_id: string;
    @Prop()
    private icon: string;
    @Prop({
        default: null
    })
    private filters;
    @Prop({
        default: false
    })
    private isreadonly: boolean;
    @Prop({
        default: false
    })
    private istextarea: boolean;

    private on_update_field(value) {
        console.log('EVENT - FIELD - ' + value);
        this.$emit('updated_field', value);
    }
}