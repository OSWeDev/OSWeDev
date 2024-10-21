import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import { query } from '../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import FileVO from '../../../../../shared/modules/File/vos/FileVO';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import VueComponentBase from '../../VueComponentBase';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import './ImageViewComponent.scss';

@Component({
    template: require('./ImageViewComponent.pug'),
    components: {}
})
export default class ImageViewComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    @Prop({ default: null })
    private imagevo_id: number;

    @Prop({ default: false })
    private download_link: boolean;

    private imagevo: FileVO = null;

    @Watch('imagevo_id', { immediate: true })
    public async onChange_imagevo_id() {
        this.imagevo = null;

        if (!this.imagevo_id) {
            this.imagevo = null;
            return;
        }

        if (this.getStoredDatas[FileVO.API_TYPE_ID] && this.getStoredDatas[FileVO.API_TYPE_ID][this.imagevo_id]) {
            this.imagevo = this.getStoredDatas[FileVO.API_TYPE_ID][this.imagevo_id] as FileVO;
            return;
        }

        const self = this;
        this.$nextTick(async () => {
            self.imagevo = await query(FileVO.API_TYPE_ID).filter_by_id(self.imagevo_id).select_vo<FileVO>();
            self.storeData(self.imagevo);
        });
    }
}