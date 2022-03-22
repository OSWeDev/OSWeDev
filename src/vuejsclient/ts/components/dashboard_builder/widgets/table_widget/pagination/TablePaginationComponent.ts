import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import './TablePaginationComponent.scss';
import 'vue-slider-component/theme/default.css';

@Component({
    template: require('./TablePaginationComponent.pug'),
    components: {
    }
})
export default class TablePaginationComponent extends VueComponentBase {

    @Prop()
    private pagination_count: number;

    @Prop()
    private pagination_offset: number;

    @Prop()
    private pagination_pagesize: number;

    @Prop({ default: false })
    private compressed: boolean;

    private throttled_update_slider = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_slider.bind(this), 50, { leading: false, trailing: true });
    private throttled_change_offset = ThrottleHelper.getInstance().declare_throttle_without_args(this.change_offset.bind(this), 400, { leading: false, trailing: true });

    private page: number = 0;

    private max_page: number = 0;

    private new_page: number = 0;
    private new_page_str: string = "0";

    get pagination_offset_end_page() {
        let res = this.pagination_offset + this.pagination_pagesize;

        if (res >= this.pagination_count) {
            return this.pagination_count;
        }

        return res;
    }

    @Watch('new_page_str')
    private onchange_new_page_str() {
        let new_page_num: number = null;
        try {
            new_page_num = parseInt(this.new_page_str);

            if ((!new_page_num) || isNaN(new_page_num)) {
                new_page_num = 1;
            }

            if (new_page_num > this.max_page) {
                new_page_num = this.max_page;
                this.new_page_str = new_page_num.toString();
            }

            if (new_page_num < 1) {
                new_page_num = 1;
                this.new_page_str = new_page_num.toString();
            }
        } catch (error) {
            this.new_page_str = this.new_page.toString();
            return;
        }

        if (this.new_page != new_page_num) {
            console.log('onchange_new_page_str>new_page=' + new_page_num);
            this.new_page = new_page_num;
        }
    }

    @Watch('new_page')
    private onchange_new_page() {

        if (!this.new_page) {
            return;
        }

        if (this.new_page_str != this.new_page.toString()) {
            console.log('onchange_new_page>new_page_str=' + this.new_page);
            this.new_page_str = this.new_page.toString();
        }
    }

    @Watch("pagination_count", { immediate: true })
    @Watch("pagination_offset", { immediate: true })
    @Watch("pagination_pagesize", { immediate: true })
    private throttle_update_slider() {
        this.throttled_update_slider();
    }

    private update_slider() {
        this.page = Math.floor(this.pagination_offset / this.pagination_pagesize) + 1;
        this.new_page = this.page;
        this.max_page = Math.floor(this.pagination_count / this.pagination_pagesize) + 1;
        if (this.new_page > this.max_page) {
            this.new_page = this.max_page;
            this.page = this.new_page;
        }
        this.throttled_change_offset();
    }

    private goto_next() {
        this.new_page++;
        this.throttled_change_offset();
    }

    private goto_previous() {
        if (this.new_page <= 1) {
            return;
        }
        this.new_page--;
        this.throttled_change_offset();
    }

    private change_page_str() {
        this.onchange_new_page_str();
        this.throttled_change_offset();
    }

    private change_offset() {
        let offset = (this.new_page - 1) * this.pagination_pagesize;
        offset = (offset > this.pagination_count) ? Math.floor(this.pagination_count / this.pagination_pagesize) + 1 : offset;
        this.$emit("change_offset", offset);
    }
}