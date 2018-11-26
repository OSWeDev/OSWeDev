import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import VueComponentBase from '../../VueComponentBase';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import ImageVO from '../../../../../shared/modules/Image/vos/ImageVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';

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
    protected imagevo_id: number;

    private imagevo: ImageVO = null;

    @Watch('imagevo_id')
    public async onChange_imagevo_id() {
        this.imagevo = null;

        if (!this.imagevo_id) {
            this.imagevo = null;
            return;
        }

        if (this.getStoredDatas[ImageVO.API_TYPE_ID] && this.getStoredDatas[ImageVO.API_TYPE_ID][this.imagevo_id]) {
            this.imagevo = this.getStoredDatas[ImageVO.API_TYPE_ID][this.imagevo_id] as ImageVO;
            return;
        }

        let self = this;
        this.$nextTick(async () => {
            self.imagevo = await ModuleDAO.getInstance().getVoById<ImageVO>(ImageVO.API_TYPE_ID, self.imagevo_id);
            self.storeData(self.imagevo);
        });
    }
}