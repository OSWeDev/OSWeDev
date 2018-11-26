import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import IInstantiatedPageComponent from '../../../../../shared/modules/CMS/interfaces/IInstantiatedPageComponent';
import ModuleCMS from '../../../../../shared/modules/CMS/ModuleCMS';
import PageVO from '../../../../../shared/modules/CMS/vos/PageVO';
import ModuleDAO from '../../../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../../../shared/modules/IDistantVOBase';
import VueComponentBase from '../../../../ts/components/VueComponentBase';
import { ModuleDAOAction, ModuleDAOGetter } from '../../dao/store/DaoStore';
import CMSComponentManager from '../CMSComponentManager';
import './CMSPageComponent.scss';
import ICMSComponentTemplateVue from '../interfaces/ICMSComponentTemplateVue';
import { VueConstructor } from 'vue';
import ModuleAccessPolicy from '../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import TemplateComponentVO from '../../../../../shared/modules/CMS/vos/TemplateComponentVO';
import WeightHandler from '../../../../../shared/tools/WeightHandler';
import ImageViewComponent from '../../image/View/ImageViewComponent';
import CMSDroppableTemplateComponent from './droppable_template/CMSDroppableTemplateComponent';

@Component({
    template: require('./CMSPageComponent.pug'),
    components: {
        'image-view-component': ImageViewComponent,
        'cms_droppable_template_component': CMSDroppableTemplateComponent
    }
})
export default class CMSPageComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    @ModuleDAOAction
    public storeDatas: (infos: { API_TYPE_ID: string, vos: IDistantVOBase[] }) => void;
    @ModuleDAOAction
    public updateData: (vo: IDistantVOBase) => void;
    @ModuleDAOAction
    public removeData: (infos: { API_TYPE_ID: string, id: number }) => void;
    @ModuleDAOAction
    public storeData: (vo: IDistantVOBase) => void;

    @Prop()
    private page_id: number;

    private page_vo: PageVO = null;
    private instantiated_page_components: IInstantiatedPageComponent[] = null;
    private has_access_to_cms_fo_admin: boolean = false;

    get template_components(): TemplateComponentVO[] {
        let res: TemplateComponentVO[] = [];

        for (let i in this.getStoredDatas[TemplateComponentVO.API_TYPE_ID]) {
            let templateComponent: TemplateComponentVO = this.getStoredDatas[TemplateComponentVO.API_TYPE_ID][i] as TemplateComponentVO;
            res.push(templateComponent);
        }
        WeightHandler.getInstance().sortByWeight(res);
        return res;
    }

    get component_templates_by_type_id(): { [api_type_id: string]: VueConstructor<ICMSComponentTemplateVue> } {
        return CMSComponentManager.getInstance().template_component_vue_by_type_id;
    }

    @Watch("page_id", { immediate: true })
    private async onChange_page_id() {

        if (!this.page_id) {
            this.snotify.error(this.label('cms.loading.no_page_id'));
            return;
        }

        this.startLoading();
        let self = this;

        let promises: Array<Promise<any>> = [];
        promises.push((async () => {
            self.page_vo = await ModuleDAO.getInstance().getVoById<PageVO>(PageVO.API_TYPE_ID, self.page_id);
        })());
        promises.push((async () => {
            self.instantiated_page_components = await ModuleCMS.getInstance().getPageComponents(self.page_id);
        })());
        promises.push((async () => {
            self.has_access_to_cms_fo_admin = await ModuleAccessPolicy.getInstance().checkAccess(ModuleCMS.POLICY_BO_ACCESS);
        })());

        await Promise.all(promises);
        this.stopLoading();
    }

    @Watch('has_access_to_cms_fo_admin')
    private async onChange_has_access_to_cms_fo_admin() {
        if (!this.has_access_to_cms_fo_admin) {
            return;
        }

        this.storeDatas({ API_TYPE_ID: TemplateComponentVO.API_TYPE_ID, vos: await ModuleDAO.getInstance().getVos<TemplateComponentVO>(TemplateComponentVO.API_TYPE_ID) });
    }
}