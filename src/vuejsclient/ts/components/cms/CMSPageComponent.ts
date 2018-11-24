import Component from 'vue-class-component';
import { Prop, Watch } from 'vue-property-decorator';
import IInstantiatedPageComponent from '../../../../shared/modules/CMS/interfaces/IInstantiatedPageComponent';
import ModuleCMS from '../../../../shared/modules/CMS/ModuleCMS';
import PageVO from '../../../../shared/modules/CMS/vos/PageVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import { ModuleDAOAction, ModuleDAOGetter } from '../dao/store/DaoStore';
import CMSComponentManager from './CMSComponentManager';
import './CMSPageComponent.scss';
import ICMSComponentTemplateVue from './interfaces/ICMSComponentTemplateVue';

@Component({
    template: require('./CMSPageComponent.pug')
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

    get component_templates_by_type_id(): { [api_type_id: string]: ICMSComponentTemplateVue } {
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

        await Promise.all(promises);
        this.stopLoading();
    }


}