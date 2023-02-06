import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ThrottleHelper from '../../../../../../../shared/tools/ThrottleHelper';
import VueComponentBase from '../../../../VueComponentBase';
import './TablePaginationComponent.scss';
import 'vue-slider-component/theme/default.css';
import ModuleSASSSkinConfigurator from '../../../../../../../shared/modules/SASSSkinConfigurator/ModuleSASSSkinConfigurator';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';

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

    @Prop()
    private nbpages_pagination_list: number;

    @Prop()
    private show_limit_selectable: boolean;

    @Prop({ default: true })
    private show_pagination_resumee: boolean;

    @Prop({ default: true })
    private show_pagination_slider: boolean;

    @Prop({ default: true })
    private show_pagination_form: boolean;

    @Prop({ default: false })
    private show_pagination_list: boolean;

    @Prop()
    private limit_selectable: string[];

    @Prop({ default: false })
    private compressed: boolean;

    private throttled_update_slider = ThrottleHelper.getInstance().declare_throttle_without_args(this.update_slider.bind(this), 50, { leading: false, trailing: true });
    private throttled_change_offset = ThrottleHelper.getInstance().declare_throttle_without_args(this.change_offset.bind(this), 400, { leading: false, trailing: true });

    private page: number = 0;

    private max_page: number = 0;

    private new_page: number = 0;
    private new_page_str: string = "0";

    private button_primary_bg_color: string = null;

    private current_page_and_around: { [index: number]: number } = {};

    private all_limit_selectable: number[] = null;
    private selected_limit: number = null;

    get pagination_offset_end_page() {
        let res = this.pagination_offset + this.pagination_pagesize;

        if (res >= this.pagination_count) {
            return this.pagination_count;
        }

        return res;
    }

    private async mounted() {
        this.button_primary_bg_color = await ModuleSASSSkinConfigurator.getInstance().get_sass_param_value('button_primary_bg_color');
        ConsoleHandler.log('button_primary_bg_color', this.button_primary_bg_color);
    }

    @Watch('new_page_str')
    @Watch('max_page')
    private onchange_new_page_str() {
        let new_page_num: number = null;
        let is_specific_change: boolean = false;
        try {
            this.current_page_and_around = {};
            new_page_num = parseInt(this.new_page_str);

            //Init
            if ((!new_page_num) || isNaN(new_page_num)) {
                new_page_num = 1;

                if (this.show_pagination_list) {
                    if (this.max_page <= this.nbpages_pagination_list) {
                        for (let i = 1; i < this.max_page; i++) {
                            this.current_page_and_around[i] = i;
                        }
                    } else {
                        for (let i = 1; i <= this.nbpages_pagination_list; i++) {
                            this.current_page_and_around[i] = i;
                        }
                    }
                    is_specific_change = true;
                }
            }

            // Si current page = last page
            if (new_page_num > this.max_page) {
                new_page_num = this.max_page;
                this.new_page_str = new_page_num.toString();

                if (this.show_pagination_list) {
                    if (this.max_page < this.nbpages_pagination_list) {
                        for (let i = 1; i <= this.max_page; i++) {
                            this.current_page_and_around[i] = i;
                        }
                    } else {
                        for (let i = (this.max_page - (this.nbpages_pagination_list - 1)); i <= this.max_page; i++) {
                            this.current_page_and_around[i] = i;
                        }
                    }
                    is_specific_change = true;
                }
            }

            //Si current page = first page
            if (new_page_num < 1) {
                new_page_num = 1;
                this.new_page_str = new_page_num.toString();

                if (this.show_pagination_list) {
                    if (this.max_page < this.nbpages_pagination_list) {
                        for (let i = 1; i <= this.max_page; i++) {
                            this.current_page_and_around[i] = i;
                        }
                    } else {
                        for (let i = 1; i <= this.nbpages_pagination_list; i++) {
                            this.current_page_and_around[i] = i;
                        }
                    }
                    is_specific_change = true;
                }
            }

            if (this.show_pagination_list && !is_specific_change) {

                if (this.max_page < this.nbpages_pagination_list) {

                    for (let i = 1; i <= this.max_page; i++) {
                        this.current_page_and_around[i] = i;
                    }
                } else if (this.new_page < (Math.trunc(this.nbpages_pagination_list / 2) + 1)) {

                    for (let i = 1; i <= this.nbpages_pagination_list; i++) {
                        this.current_page_and_around[i] = i;
                    }
                } else if (this.new_page > (this.max_page - Math.trunc(this.nbpages_pagination_list / 2))) {

                    for (let i = (this.max_page - (this.nbpages_pagination_list - 1)); i <= this.max_page; i++) {
                        this.current_page_and_around[i] = i;
                    }
                } else {

                    if (this.nbpages_pagination_list % 2 == 0) {
                        // Lorsque le nombre de blocs est pair, le bloc de la page active est au milieu à droite
                        for (let i = (this.new_page - Math.trunc(this.nbpages_pagination_list / 2)); i <= (this.new_page + Math.trunc(this.nbpages_pagination_list / 2) - 1); i++) {
                            this.current_page_and_around[i] = i;
                        }
                    } else {
                        // Lorsque le nombre de blocs est impair, le bloc de la page active est strictement au milieu
                        for (let i = (this.new_page - Math.trunc(this.nbpages_pagination_list / 2)); i <= (this.new_page + Math.trunc(this.nbpages_pagination_list / 2)); i++) {
                            this.current_page_and_around[i] = i;
                        }
                    }
                }
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

    @Watch("selected_limit")
    private onchange_selected_limit() {
        if (!this.selected_limit || (this.selected_limit == this.pagination_pagesize)) {
            return;
        }

        this.$emit('change_limit', this.selected_limit);
    }

    @Watch("limit_selectable", { immediate: true })
    private onchange_limit_selectable() {
        let all_limit_selectable: number[] = [];
        let selected_limit: number = null;

        if (this.limit_selectable && this.limit_selectable.length > 0) {
            for (let i in this.limit_selectable) {
                let val: number = parseInt(this.limit_selectable[i]);

                if (val && !isNaN(val) && (val > 0) && !all_limit_selectable.includes(val)) {
                    all_limit_selectable.push(val);
                }
            }

            if (!all_limit_selectable.includes(this.pagination_pagesize)) {
                all_limit_selectable.push(this.pagination_pagesize);
            }

            selected_limit = this.pagination_pagesize;

            all_limit_selectable.sort((a: number, b: number) => {
                if (a < b) {
                    return -1;
                }
                if (a > b) {
                    return 1;
                }
                return 0;
            });
        }

        this.all_limit_selectable = all_limit_selectable;
        this.selected_limit = selected_limit;
    }

    private update_slider() {
        this.page = Math.floor(this.pagination_offset / this.pagination_pagesize) + 1;
        this.new_page = this.page;
        this.max_page = Math.floor((this.pagination_count ? (this.pagination_count - 1) : 0) / this.pagination_pagesize) + 1;
        if (this.new_page > this.max_page) {
            this.new_page = this.max_page;
            this.page = this.new_page;
        }

        if (this.selected_limit != this.pagination_pagesize) {
            this.selected_limit = this.pagination_pagesize;
        }

        this.throttled_change_offset();
    }

    private goto_next() {
        this.new_page++;
        this.current_page_and_around = {};
        this.throttled_change_offset();
    }

    private goto_previous() {
        if (this.new_page <= 1) {
            return;
        }
        this.current_page_and_around = {};
        this.new_page--;
        this.throttled_change_offset();
    }

    private goto_first() {
        if (this.new_page <= 1) {
            return;
        }
        this.current_page_and_around = {};
        this.new_page = 1;
        this.throttled_change_offset();
    }

    private goto_last() {
        if (this.new_page >= this.max_page) {
            return;
        }
        this.current_page_and_around = {};
        this.new_page = this.max_page;
        this.throttled_change_offset();
    }

    private switch_page_button(num_page: number) {
        this.new_page = num_page;
        this.current_page_and_around = {};
        this.throttled_change_offset();
        return;
    }

    private change_page_str() {
        this.onchange_new_page_str();
        this.throttled_change_offset();
    }

    private change_offset() {
        let offset = (this.new_page - 1) * this.pagination_pagesize;
        offset = (offset >= this.pagination_count) ? Math.floor((this.pagination_count > 0 ? (this.pagination_count - 1) : 0) / this.pagination_pagesize) * this.pagination_pagesize : offset;
        this.$emit("change_offset", offset);
    }
}