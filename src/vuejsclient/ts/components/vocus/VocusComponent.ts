import debounce from 'lodash/debounce';
import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModuleVocus from '../../../../shared/modules/Vocus/ModuleVocus';
import VocusInfoVO from '../../../../shared/modules/Vocus/vos/VocusInfoVO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import VueComponentBase from '../VueComponentBase';
import './VocusComponent.scss';

@Component({
    template: require('./VocusComponent.pug'),
})
export default class VocusComponent extends VueComponentBase {

    @Prop({ default: null })
    public vo_id: number;

    @Prop({ default: null })
    public vo_type: string;

    @Prop({ default: false })
    public limit1000: number;

    private tmp_vo_id: number = null;
    private tmp_vo_type: string = null;

    private vo: IDistantVOBase = null;
    private refvos: VocusInfoVO[] = [];
    private is_loading: boolean = true;
    private debounced_load_vocus = debounce(this.load_vocus, 2000);

    get vo_types(): string[] {
        return Object.keys(VOsTypesManager.getInstance().moduleTables_by_voType);
    }

    get vo_label() {
        if (!this.vo) {
            return null;
        }

        let table = VOsTypesManager.getInstance().moduleTables_by_voType[this.vo._type];
        if (table && table.default_label_field) {
            return this.vo[table.default_label_field.field_id];
        } else if (table && table.table_label_function) {
            return table.table_label_function(this.vo);
        }
    }

    @Watch('vo_id', { immediate: true })
    private async onchange_vo_id() {

        if (this.tmp_vo_id == this.vo_id) {
            return;
        }

        this.tmp_vo_id = this.vo_id;
    }

    @Watch('tmp_vo_id')
    private async onchange_tmp_vo_id() {

        if (this.tmp_vo_id == this.vo_id) {
            return;
        }

        let route = this.getVocusLink(this.tmp_vo_type, ((this.tmp_vo_id && !isNaN(parseInt(this.tmp_vo_id.toString())) ? parseInt(this.tmp_vo_id.toString()) : null)));

        if (!!route) {
            this.$router.push(route);
        }
    }

    @Watch('vo_type', { immediate: true })
    private async onchange_vo_type() {

        if (this.tmp_vo_type == this.vo_type) {
            return;
        }

        this.tmp_vo_type = this.vo_type;
    }

    @Watch('tmp_vo_type')
    private async onchange_tmp_vo_type() {

        if (this.tmp_vo_type == this.vo_type) {
            return;
        }

        let route = this.getVocusLink(this.tmp_vo_type, ((this.tmp_vo_id && !isNaN(parseInt(this.tmp_vo_id.toString())) ? parseInt(this.tmp_vo_id.toString()) : null)));

        if (!!route) {
            this.$router.push(route);
        }
    }

    @Watch('$route', { immediate: true })
    private onchange_route() {

        this.debounced_load_vocus();
    }

    private async load_vocus() {

        this.is_loading = true;

        if ((!this.tmp_vo_type) || (!this.tmp_vo_id)) {
            this.refvos = [];
            this.is_loading = false;
            this.vo = null;
            return;
        }

        this.vo = await ModuleDAO.getInstance().getVoById(this.tmp_vo_type, this.tmp_vo_id);
        this.refvos = await ModuleVocus.getInstance().getVosRefsById(this.tmp_vo_type, this.tmp_vo_id);

        this.is_loading = false;
    }
}