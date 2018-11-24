import Component from 'vue-class-component';
import ModuleAccessPolicy from '../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import AccessPolicyGroupVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyGroupVO';
import AccessPolicyVO from '../../../../shared/modules/AccessPolicy/vos/AccessPolicyVO';
import PolicyDependencyVO from '../../../../shared/modules/AccessPolicy/vos/PolicyDependencyVO';
import RolePolicyVO from '../../../../shared/modules/AccessPolicy/vos/RolePolicyVO';
import RoleVO from '../../../../shared/modules/AccessPolicy/vos/RoleVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import VueComponentBase from '../../../ts/components/VueComponentBase';
import { ModuleDAOAction, ModuleDAOGetter } from '../dao/store/DaoStore';
import './CMSPageComponent.scss';
import PageVO from '../../../../shared/modules/CMS/vos/PageVO';
import { Prop, Watch } from 'vue-property-decorator';
import PageComponentVO from '../../../../shared/modules/CMS/vos/PageComponentVO';
import VOsTypesManager from '../../../../shared/modules/VOsTypesManager';
import TemplateComponentVO from '../../../../shared/modules/CMS/vos/TemplateComponentVO';

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
    private page_components: PageComponentVO[] = null;

    private need_to_load_page_components: PageComponentVO[] = null;

    get page_components_by_ids(): { [id: number]: PageComponentVO } {
        let res: { [id: number]: PageComponentVO } = {};

        if ((!this.page_components) || (!this.page_components.length)) {
            return {};
        }

        return VOsTypesManager.getInstance().vosArray_to_vosByIds(this.page_components);
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
            self.page_components = await ModuleDAO.getInstance().getVosByRefFieldIds<PageComponentVO>(PageComponentVO.API_TYPE_ID, 'page_id', [self.page_id]);
            self.page_components.sort((a: PageComponentVO, b: PageComponentVO) => {
                if (a.weight < b.weight) {
                    return -1;
                }
                if (a.weight > b.weight) {
                    return 1;
                }
                return 0;
            });
            self.need_to_load_page_components = Array.from(self.page_components);
        })());

        await Promise.all(promises);
        self.page_components[0].type
        this.stopLoading();
    }

    /**
     * The idea is to load as fast as possible the structure, so the pagevo and pagecomponents,
     *  and then take the time necessary to load each individual component of the page, in the weight order, on at a time
     *  to give the customer content as fast as possible
     */
    private async load_next_component() {
        if ((!this.need_to_load_page_components) || (!this.need_to_load_page_components.length)) {
            return;
        }

        let page_component_to_load: PageComponentVO = this.need_to_load_page_components.splice(0, 1);
        let page_component: TemplateComponentVO = await ModuleDAO.getInstance().getVoById(page_component_to_load.type, page_component_to_load.);

        let self = this;

        this.$nextTick(function () {
            self.load_next_component();
        });
    }
}