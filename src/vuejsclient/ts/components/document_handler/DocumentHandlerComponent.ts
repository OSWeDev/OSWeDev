import Component from 'vue-class-component';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import ModuleDocument from '../../../../shared/modules/Document/ModuleDocument';
import DocumentDocumentTagVO from '../../../../shared/modules/Document/vos/DocumentDocumentTagVO';
import DocumentTagDocumentTagGroupVO from '../../../../shared/modules/Document/vos/DocumentTagDocumentTagGroupVO';
import DocumentTagGroupVO from '../../../../shared/modules/Document/vos/DocumentTagGroupVO';
import DocumentTagVO from '../../../../shared/modules/Document/vos/DocumentTagVO';
import DocumentVO from '../../../../shared/modules/Document/vos/DocumentVO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import ObjectHandler from '../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../VueComponentBase';
import './DocumentHandlerComponent.scss';
import WeightHandler from '../../../../shared/tools/WeightHandler';

@Component({
    template: require('./DocumentHandlerComponent.pug'),
    components: {
        isotope: () => import(/* webpackChunkName: "vueisotope" */ 'vueisotope')
    }
})
export default class DocumentHandlerComponent extends VueComponentBase {

    private hidden: boolean = true;

    private loaded: boolean = false;

    private d_by_ids: { [id: number]: DocumentVO } = {};
    private ds_by_dt_ids_and_by_ids: { [dt_id: number]: { [d_id: number]: DocumentVO } } = {};
    private dt_by_ids: { [id: number]: DocumentTagVO } = {};
    private dts_by_dtg_ids: { [dtg_id: number]: DocumentTagVO[] } = {};
    private dtg_by_ids: { [id: number]: DocumentTagGroupVO } = {};

    private dtgs_by_weight: DocumentTagGroupVO[] = [];
    private dts_by_weight: DocumentTagVO[] = [];

    private classnames: string[] = [
        'XS',
        'S',
        'M',
        'L',
        'XL',
        'XXL'];

    private list: DocumentVO[] = [];

    private filter_tag_id: number = null;

    public async mounted() {
        let self = this;
        this.$nextTick(async () => {

            let promises: Array<Promise<any>> = [];

            let tmp_d_by_ids: { [id: number]: DocumentVO } = {};
            let tmp_dt_by_ids: { [id: number]: DocumentTagVO } = {};
            let tmp_dtg_by_ids: { [id: number]: DocumentTagGroupVO } = {};
            let tmp_ds_by_dt_ids_and_by_ids: { [dt_id: number]: { [d_id: number]: DocumentVO } } = {};
            let tmp_dts_by_dtg_ids: { [dtg_id: number]: DocumentTagVO[] } = {};

            promises.push((async () => {
                tmp_d_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDocument.getInstance().get_ds_by_user_lang());
            })());
            promises.push((async () => {
                tmp_dt_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDocument.getInstance().get_dts_by_user_lang());
            })());
            let tmp_dtgs_by_weight: DocumentTagGroupVO[] = [];
            promises.push((async () => {
                tmp_dtgs_by_weight = await ModuleDocument.getInstance().get_dtgs_by_user_lang();
                tmp_dtg_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(tmp_dtgs_by_weight);
            })());

            await Promise.all(promises);

            promises = [];

            let valid_d_by_ids: { [id: number]: DocumentVO } = {};
            let valid_dt_by_ids: { [id: number]: DocumentTagVO } = {};
            let valid_dtg_by_ids: { [id: number]: DocumentTagGroupVO } = tmp_dtg_by_ids;

            let dt_dtgs: DocumentTagDocumentTagGroupVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds<DocumentTagDocumentTagGroupVO>(
                DocumentTagDocumentTagGroupVO.API_TYPE_ID,
                'dt_id', ObjectHandler.getInstance().getIdsList(tmp_dt_by_ids),
                'dtg_id', ObjectHandler.getInstance().getIdsList(tmp_dtg_by_ids));
            tmp_dts_by_dtg_ids = {};
            let tmp_dts_by_weight: DocumentTagVO[] = [];
            for (let i in dt_dtgs) {
                let dt_dtg = dt_dtgs[i];

                if (!tmp_dts_by_dtg_ids[dt_dtg.dtg_id]) {
                    tmp_dts_by_dtg_ids[dt_dtg.dtg_id] = [];
                }
                tmp_dts_by_dtg_ids[dt_dtg.dtg_id].push(tmp_dt_by_ids[dt_dtg.dt_id]);
                valid_dt_by_ids[dt_dtg.dt_id] = tmp_dt_by_ids[dt_dtg.dt_id];
                tmp_dts_by_weight.push(tmp_dt_by_ids[dt_dtg.dt_id]);
            }

            let d_dts: DocumentDocumentTagVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds<DocumentDocumentTagVO>(
                DocumentDocumentTagVO.API_TYPE_ID,
                'd_id', ObjectHandler.getInstance().getIdsList(tmp_d_by_ids),
                'dt_id', ObjectHandler.getInstance().getIdsList(valid_dt_by_ids));
            tmp_ds_by_dt_ids_and_by_ids = {};
            let tmp_list = [];
            for (let i in d_dts) {
                let d_dt = d_dts[i];

                if (!tmp_ds_by_dt_ids_and_by_ids[d_dt.dt_id]) {
                    tmp_ds_by_dt_ids_and_by_ids[d_dt.dt_id] = {};
                }
                tmp_ds_by_dt_ids_and_by_ids[d_dt.dt_id][d_dt.d_id] = tmp_d_by_ids[d_dt.d_id];
                valid_d_by_ids[d_dt.d_id] = tmp_d_by_ids[d_dt.d_id];
                tmp_list.push(tmp_d_by_ids[d_dt.d_id]);
            }

            WeightHandler.getInstance().sortByWeight(tmp_list);
            WeightHandler.getInstance().sortByWeight(tmp_dtgs_by_weight);
            WeightHandler.getInstance().sortByWeight(tmp_dts_by_weight);
            self.list = tmp_list;
            self.dtgs_by_weight = tmp_dtgs_by_weight;
            self.dts_by_weight = tmp_dts_by_weight;

            self.d_by_ids = valid_d_by_ids;
            self.dt_by_ids = valid_dt_by_ids;
            self.dtg_by_ids = valid_dtg_by_ids;

            self.ds_by_dt_ids_and_by_ids = tmp_ds_by_dt_ids_and_by_ids;
            self.dts_by_dtg_ids = tmp_dts_by_dtg_ids;

            $("#document_handler_modal").on("hidden.bs.modal", function () {
                $('#document_handler_modal').modal('hide');
                self.loaded = false;
                self.hidden = true;
                self.filter_tag_id = null;
            });
        });
    }

    private switch_hidden() {

        let self = this;

        if (this.hidden) {
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

        this.hidden = !this.hidden;
    }

    get options() {
        let self = this;
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
        return !ObjectHandler.getInstance().hasOneAndOnlyOneAttribute(this.dtg_by_ids);
    }

    get hasMoreThanOneTag(): boolean {
        return ObjectHandler.getInstance().hasAtLeastOneAttribute(this.dt_by_ids) && !ObjectHandler.getInstance().hasOneAndOnlyOneAttribute(this.dt_by_ids);
    }
}