import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import DocumentDocumentTagVO from '../../../../../shared/modules/Document/vos/DocumentDocumentTagVO';
import DocumentTagGroupVO from '../../../../../shared/modules/Document/vos/DocumentTagGroupVO';
import DocumentTagVO from '../../../../../shared/modules/Document/vos/DocumentTagVO';
import DocumentVO from '../../../../../shared/modules/Document/vos/DocumentVO';
import ObjectHandler from '../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../VueComponentBase';
import DocumentHandlerController from '../DocumentHandlerController';
import { ModuleDocumentAction, ModuleDocumentGetter } from '../store/DocumentStore';
import DocumentHandlerDatasVO from '../vos/DocumentHandlerDatasVO';
import DocumentHandlerReloadListVO from '../vos/DocumentHandlerReloadListVO';
import './DocumentHandlerModalComponent.scss';

@Component({
    template: require('./DocumentHandlerModalComponent.pug'),
    components: {
        isotope: () => import('vueisotope')
    }
})
export default class DocumentHandlerModalComponent extends VueComponentBase {

    @ModuleDocumentGetter
    private get_hidden: boolean;
    @ModuleDocumentGetter
    private get_only_routename: boolean;
    @ModuleDocumentAction
    private set_hidden: (hidden: boolean) => void;
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

    private classnames: string[] = [
        'XS',
        'S',
        'M',
        'L',
        'XL',
        'XXL'];

    private list: DocumentVO[] = [];

    private filter_tag_id: number = null;

    @Watch('get_only_routename')
    public onchange_get_only_routename() {
        this.reload_list();
    }

    @Watch('get_hidden')
    public async onchange_hidden() {

        const self = this;

        if (!this.get_hidden) {

            if (!this.loaded) {
                const datas: DocumentHandlerDatasVO = await DocumentHandlerController.getInstance().reloadDatas();

                this.all_d_by_ids = datas.all_d_by_ids;
                this.all_dt_by_ids = datas.all_dt_by_ids;
                this.dt_by_ids = datas.dt_by_ids;
                this.dts_by_dtg_ids = datas.dts_by_dtg_ids;
                this.dtg_by_ids = datas.dtg_by_ids;
                this.dtgs_by_weight = datas.dtgs_by_weight;
                this.d_dts = datas.d_dts;

                this.reload_list();
            }

            $('#document_handler_modal').modal('show');

            setTimeout(async () => {
                self.loaded = true;
                self.filter_tag_id = null;
            }, 500);
        } else {
            $('#document_handler_modal').modal('hide');
            self.loaded = false;
            self.filter_tag_id = null;
        }
    }

    public async mounted() {
        const self = this;

        this.$nextTick(async () => {
            $("#document_handler_modal").on("hidden.bs.modal", function () {
                self.set_hidden(true);
            });
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

    private switch_hidden() {
        this.set_hidden(!this.get_hidden);
    }

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

    get type_video() {
        return DocumentVO.DOCUMENT_TYPE_YOUTUBE;
    }

    get type_pdf() {
        return DocumentVO.DOCUMENT_TYPE_PDF;
    }

    get type_xls() {
        return DocumentVO.DOCUMENT_TYPE_XLS;
    }

    get type_doc() {
        return DocumentVO.DOCUMENT_TYPE_DOC;
    }

    get type_ppt() {
        return DocumentVO.DOCUMENT_TYPE_PPT;
    }

    get type_other() {
        return DocumentVO.DOCUMENT_TYPE_OTHER;
    }

    private open_document(url: string) {
        window.open(url, "_blank");
    }

    private filter_tag(tag: DocumentTagVO) {
        this.filter_tag_id = tag.id;
        this.$refs['isotope']['filter']('tag');
    }

    private unfilter() {
        this.filter_tag_id = null;
        this.$refs['isotope']['unfilter']();
    }

    get hasMoreThanOneGroup(): boolean {
        return !ObjectHandler.hasOneAndOnlyOneAttribute(this.dtg_by_ids);
    }

    get hasMoreThanOneTag(): boolean {
        return ObjectHandler.hasAtLeastOneAttribute(this.dt_by_ids) && !ObjectHandler.hasOneAndOnlyOneAttribute(this.dt_by_ids);
    }
}