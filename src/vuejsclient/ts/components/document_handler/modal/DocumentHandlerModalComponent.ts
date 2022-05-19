import Component from 'vue-class-component';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import ModuleDocument from '../../../../../shared/modules/Document/ModuleDocument';
import DocumentDocumentTagVO from '../../../../../shared/modules/Document/vos/DocumentDocumentTagVO';
import DocumentTagDocumentTagGroupVO from '../../../../../shared/modules/Document/vos/DocumentTagDocumentTagGroupVO';
import DocumentTagGroupVO from '../../../../../shared/modules/Document/vos/DocumentTagGroupVO';
import DocumentTagVO from '../../../../../shared/modules/Document/vos/DocumentTagVO';
import DocumentVO from '../../../../../shared/modules/Document/vos/DocumentVO';
import VOsTypesManager from '../../../../../shared/modules/VOsTypesManager';
import ObjectHandler from '../../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../../VueComponentBase';
import './DocumentHandlerModalComponent.scss';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
import { ModuleDocumentGetter, ModuleDocumentAction } from '../store/DocumentStore';
import { Watch } from 'vue-property-decorator';

@Component({
    template: require('./DocumentHandlerModalComponent.pug'),
    components: {
        isotope: () => import(/* webpackChunkName: "vueisotope" */ 'vueisotope')
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
    public onchange_hidden() {

        let self = this;

        if (!this.get_hidden) {
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
        let self = this;
        this.$nextTick(async () => {

            let promises: Array<Promise<any>> = [];

            let tmp_dtg_by_ids: { [id: number]: DocumentTagGroupVO } = {};
            let tmp_dts_by_dtg_ids: { [dtg_id: number]: DocumentTagVO[] } = {};

            promises.push((async () => {
                this.all_d_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDocument.getInstance().get_ds_by_user_lang());
            })());
            promises.push((async () => {
                this.all_dt_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(await ModuleDocument.getInstance().get_dts_by_user_lang());
            })());
            let tmp_dtgs_by_weight: DocumentTagGroupVO[] = [];
            promises.push((async () => {
                tmp_dtgs_by_weight = await ModuleDocument.getInstance().get_dtgs_by_user_lang();
                tmp_dtg_by_ids = VOsTypesManager.getInstance().vosArray_to_vosByIds(tmp_dtgs_by_weight);
            })());

            await Promise.all(promises);

            promises = [];

            let valid_dt_by_ids: { [id: number]: DocumentTagVO } = {};
            let valid_dtg_by_ids: { [id: number]: DocumentTagGroupVO } = tmp_dtg_by_ids;

            let dt_dtgs: DocumentTagDocumentTagGroupVO[] = await ModuleDAO.getInstance().getVosByRefFieldsIds<DocumentTagDocumentTagGroupVO>(
                DocumentTagDocumentTagGroupVO.API_TYPE_ID,
                'dt_id', ObjectHandler.getInstance().getIdsList(this.all_dt_by_ids),
                'dtg_id', ObjectHandler.getInstance().getIdsList(tmp_dtg_by_ids)
            );

            tmp_dts_by_dtg_ids = {};

            for (let i in dt_dtgs) {
                let dt_dtg = dt_dtgs[i];

                if (!tmp_dts_by_dtg_ids[dt_dtg.dtg_id]) {
                    tmp_dts_by_dtg_ids[dt_dtg.dtg_id] = [];
                }
                tmp_dts_by_dtg_ids[dt_dtg.dtg_id].push(this.all_dt_by_ids[dt_dtg.dt_id]);

                if (!valid_dt_by_ids[dt_dtg.dt_id]) {
                    valid_dt_by_ids[dt_dtg.dt_id] = this.all_dt_by_ids[dt_dtg.dt_id];
                }
            }

            this.d_dts = await ModuleDAO.getInstance().getVosByRefFieldsIds<DocumentDocumentTagVO>(
                DocumentDocumentTagVO.API_TYPE_ID,
                'd_id', ObjectHandler.getInstance().getIdsList(this.all_d_by_ids),
                'dt_id', ObjectHandler.getInstance().getIdsList(valid_dt_by_ids)
            );

            WeightHandler.getInstance().sortByWeight(tmp_dtgs_by_weight);
            self.dtgs_by_weight = tmp_dtgs_by_weight;

            self.dt_by_ids = valid_dt_by_ids;
            self.dtg_by_ids = valid_dtg_by_ids;

            self.dts_by_dtg_ids = tmp_dts_by_dtg_ids;

            this.reload_list();

            $("#document_handler_modal").on("hidden.bs.modal", function () {
                self.set_hidden(true);
            });
        });
    }

    private switch_hidden() {
        this.set_hidden(!this.get_hidden);
    }

    private reload_list() {
        let tmp_ds_by_dt_ids_and_by_ids: { [dt_id: number]: { [d_id: number]: DocumentVO } } = {};
        let tmp_list: DocumentVO[] = [];
        let tmp_dts_by_weight: DocumentTagVO[] = [];
        let valid_d_by_ids: { [id: number]: DocumentVO } = {};
        let already_add_dts: { [dt_id: number]: boolean } = {};
        let has_docs_route_name: { [route_name: string]: boolean } = {};

        for (let i in this.d_dts) {
            let d_dt = this.d_dts[i];

            let doc: DocumentVO = this.all_d_by_ids[d_dt.d_id];

            if (doc.target_route_name) {
                has_docs_route_name[doc.target_route_name] = true;
            }

            // Si on est en only_routename, on cherche a afficher les docs de la route seulement
            if (this.get_only_routename) {
                if (!doc.target_route_name || (doc.target_route_name != this.$route.name)) {
                    continue;
                }
            }

            if (!tmp_ds_by_dt_ids_and_by_ids[d_dt.dt_id]) {
                tmp_ds_by_dt_ids_and_by_ids[d_dt.dt_id] = {};
            }

            tmp_ds_by_dt_ids_and_by_ids[d_dt.dt_id][d_dt.d_id] = doc;

            if (!valid_d_by_ids[d_dt.d_id]) {
                valid_d_by_ids[d_dt.d_id] = doc;
                tmp_list.push(doc);
            }

            if (!already_add_dts[d_dt.dt_id]) {
                already_add_dts[d_dt.dt_id] = true;
                tmp_dts_by_weight.push(this.all_dt_by_ids[d_dt.dt_id]);
            }
        }

        WeightHandler.getInstance().sortByWeight(tmp_list);
        WeightHandler.getInstance().sortByWeight(tmp_dts_by_weight);

        this.list = tmp_list;
        this.ds_by_dt_ids_and_by_ids = tmp_ds_by_dt_ids_and_by_ids;
        this.dts_by_weight = tmp_dts_by_weight;
        this.d_by_ids = valid_d_by_ids;

        this.list = tmp_list;

        this.set_has_docs_route_name(has_docs_route_name);
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