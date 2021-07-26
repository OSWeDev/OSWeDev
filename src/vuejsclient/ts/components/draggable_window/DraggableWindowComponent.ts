import { Component, Prop, Watch } from 'vue-property-decorator';
import VueComponentBase from '../VueComponentBase';
import './DraggableWindowComponent.scss';

@Component({
    template: require('./DraggableWindowComponent.pug')
})
export default class DraggableWindowComponent extends VueComponentBase {

    public static UID_: number = 0;

    @Prop()
    private initial_x: number;
    @Prop()
    private initial_y: number;
    @Prop({ default: true })
    private initial_opened: boolean;

    @Prop()
    private initial_width: number;
    @Prop()
    private initial_height: number;

    @Prop()
    private opened_width: number;
    @Prop()
    private opened_height: number;

    @Prop()
    private closed_width: number;
    @Prop()
    private closed_height: number;
    @Prop()
    private unusable_height: number;

    @Prop()
    private opened_minh: number;
    @Prop()
    private opened_minw: number;
    @Prop()
    private closed_minh: number;
    @Prop()
    private closed_minw: number;

    private width: number = 0;
    private height: number = 0;

    private minh: number = 0;
    private minw: number = 0;

    private x: number = 0;
    private y: number = 0;
    private opened: boolean = false;

    private initialized: boolean = false;

    private uid: number = DraggableWindowComponent.UID_++;

    @Watch('initial_x', { immediate: true })
    private init() {
        this.x = this.initial_x;
        this.y = this.initial_y;
        this.opened = this.initial_opened;
        this.width = this.initial_width;
        this.height = this.initial_height;
        this.minh = this.opened_minh;
        this.minw = this.opened_minw;

        if (!this.opened_minh) {
            this.opened_minh = this.minh;
        }
        if (!this.opened_minw) {
            this.opened_minw = this.minw;
        }
        if (!this.closed_minh) {
            this.closed_minh = this.minh;
        }
        if (!this.closed_minw) {
            this.closed_minw = this.minw;
        }

        this.initialized = true;
    }

    // v-on:resizing="onResize"
    // private onResize(x, y, width, height) {

    //     if (!this.opened) {
    //         return;
    //     }

    //     if ((this.width == width) && (this.height == height)) {
    //         return;
    //     }

    //     this.width = width ? width : this.width;
    //     this.height = height ? height : this.height;
    //     this.opened_width = this.width;
    //     this.opened_height = this.height;

    //     (this.$refs.wrapper as any).$el.style.maxHeight = "" + (this.height - this.unusable_height) + "px";
    // }

    @Watch('opened')
    private onOpenClose() {
        if (this.opened) {

            this.width = this.opened_width;
            this.height = this.opened_height;

            this.minh = this.opened_minh;
            this.minw = this.opened_minw;

            (this.$refs.wrapper as any).style.maxHeight = "" + (this.height - this.unusable_height) + "px";
        } else {

            this.width = this.closed_width;
            this.height = this.closed_height;

            this.minh = this.closed_minh;
            this.minw = this.closed_minw;

            (this.$refs.wrapper as any).style.maxHeight = "0px";
        }

        (this.$refs.dragsize as any).$el.width = this.width;
        (this.$refs.dragsize as any).$el.height = this.height;

        (this.$refs.dragsize as any).$el.style.width = "" + this.width + "px";
        (this.$refs.dragsize as any).$el.style.height = "" + this.height + "px";

        (this.$refs.dragsize as any).$el.elmH = this.height;
        (this.$refs.dragsize as any).$el.elmW = this.width;
    }
}