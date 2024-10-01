import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import DocumentDocumentTagVO from '../../../../shared/modules/Document/vos/DocumentDocumentTagVO';
import DocumentTagGroupVO from '../../../../shared/modules/Document/vos/DocumentTagGroupVO';
import DocumentTagVO from '../../../../shared/modules/Document/vos/DocumentTagVO';
import DocumentVO from '../../../../shared/modules/Document/vos/DocumentVO';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../VueComponentBase';
import './DocumentHandlerComponent.scss';
import DocumentHandlerController from './DocumentHandlerController';
import { ModuleDocumentAction, ModuleDocumentGetter } from './store/DocumentStore';
import DocumentHandlerDatasVO from './vos/DocumentHandlerDatasVO';
import DocumentHandlerReloadListVO from './vos/DocumentHandlerReloadListVO';

@Component({
    template: require('./DocumentHandlerComponent.pug'),
    components: {
        isotope: () => import('vueisotope'),
        Documentcomponent: () => import('./document/DocumentComponent')
    }
})
export default class DocumentHandlerComponent extends VueComponentBase {

    @ModuleDocumentGetter
    private get_only_routename: boolean;
    @ModuleDocumentAction
    private set_has_docs_route_name: (has_docs_route_name: { [route_name: string]: boolean }) => void;

    private loaded: boolean = false;

    private d_by_ids: { [id: number]: DocumentVO } = {};
    private ds_by_dt_ids_and_by_ids: { [dt_id: number]: { [d_id: number]: DocumentVO } } = {};
    private dt_by_ids: { [id: number]: DocumentTagVO } = {};
    private dts_by_dtg_ids: { [dtg_id: number]: DocumentTagVO[] } = {};
    private dtg_by_ids: { [id: number]: DocumentTagGroupVO } = {};

    private dtgs_by_weight: DocumentTagGroupVO[] = [];
    private dts_by_weight: DocumentTagVO[] = [];
    private all_d_by_ids: { [id: number]: DocumentVO } = {};
    private all_dt_by_ids: { [id: number]: DocumentTagVO } = {};
    private d_dts: DocumentDocumentTagVO[] = null;

    private list: DocumentVO[] = [];

    private filter_tag_id: number = null;

    get options() {
        const self = this;
        return {
            itemSelector: '.grid-item',
            layoutMode: 'masonry',
            masonry: {
                columnWidth: 100,
                gutter: 8
            },
            getSortData: {
                name: function (d: DocumentVO) {
                    return d.name.toLowerCase();
                }
            },
            getFilterData: {
                tag: function (d: DocumentVO) {
                    return self.ds_by_dt_ids_and_by_ids[self.filter_tag_id] && self.ds_by_dt_ids_and_by_ids[self.filter_tag_id][d.id];
                }
            }
        };
    }

    get hasMoreThanOneGroup(): boolean {
        return !ObjectHandler.hasOneAndOnlyOneAttribute(this.dtg_by_ids);
    }

    get hasMoreThanOneTag(): boolean {
        return ObjectHandler.hasAtLeastOneAttribute(this.dt_by_ids) && !ObjectHandler.hasOneAndOnlyOneAttribute(this.dt_by_ids);
    }

    @Watch('get_only_routename')
    public onchange_get_only_routename() {
        this.reload_list();
    }

    public async mounted() {
        this.$nextTick(async () => {
            const datas: DocumentHandlerDatasVO = await DocumentHandlerController.getInstance().reloadDatas();

            this.all_d_by_ids = datas.all_d_by_ids;
            this.all_dt_by_ids = datas.all_dt_by_ids;
            this.dt_by_ids = datas.dt_by_ids;
            this.dts_by_dtg_ids = datas.dts_by_dtg_ids;
            this.dtg_by_ids = datas.dtg_by_ids;
            this.dtgs_by_weight = datas.dtgs_by_weight;
            this.d_dts = datas.d_dts;

            this.reload_list();

            this.loaded = true;
        });
    }

    private reload_list() {
        const datas_list: DocumentHandlerReloadListVO = DocumentHandlerController.getInstance().reload_list(
            this.d_dts,
            this.all_d_by_ids,
            this.get_only_routename,
            this.$route.name,
            this.all_dt_by_ids,
        );

        this.ds_by_dt_ids_and_by_ids = datas_list.ds_by_dt_ids_and_by_ids;
        this.dts_by_weight = datas_list.dts_by_weight;
        this.d_by_ids = datas_list.d_by_ids;
        this.list = datas_list.list;

        this.set_has_docs_route_name(datas_list.has_docs_route_name);
    }


    private filter_tag(tag: DocumentTagVO) {
        this.filter_tag_id = tag.id;
        this.$refs['isotope']['filter']('tag');
    }

    private unfilter() {
        this.filter_tag_id = null;
        this.$refs['isotope']['unfilter']();
    }
}