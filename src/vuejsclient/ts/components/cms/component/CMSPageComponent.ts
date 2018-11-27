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
import * as draggable from 'vuedraggable';
import { userInfo } from 'os';
import InsertOrDeleteQueryResult from '../../../../../shared/modules/DAO/vos/InsertOrDeleteQueryResult';

@Component({
    template: require('./CMSPageComponent.pug'),
    components: {
        'image-view-component': ImageViewComponent,
        'cms_droppable_template_component': CMSDroppableTemplateComponent,
        'draggable': draggable
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
    private instantiated_page_components: IInstantiatedPageComponent[] = [];
    private has_access_to_cms_fo_admin: boolean = false;

    private hidden_admin: boolean = true;

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
            if (!self.instantiated_page_components) {
                self.instantiated_page_components = [];
            }
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

        $("#sortable_page_component_list").sortable({
            revert: true,
            placeholder: "sortable_page_component_list_placeholder",
            receive: async (event, ui) => { await this.onReceiveNewTemplateComponent(event, ui); },
            handle: '.page_component_sort_handle',
            stop: async (event, ui) => { await this.onChangeOrder(event, ui); },

        });
    }

    private async onChangeOrder(event, ui) {
        this.snotify.info(this.label('cms.change_order.start'));

        let instantiated_page_component_id: number = parseInt($(ui.item).data('instantiated_page_component_id').toString());
        let instantiated_page_component_vo_type: string = $(ui.item).data('instantiated_page_component_vo_type');
        let instantiated_page_component: IInstantiatedPageComponent = await ModuleDAO.getInstance().getVoById<IInstantiatedPageComponent>(instantiated_page_component_vo_type, instantiated_page_component_id);
        let index = ui.item.index();

        // Décaler les poids des autres composants après celui-ci
        for (let i in this.instantiated_page_components) {
            let instantiated_page_component_: IInstantiatedPageComponent = this.instantiated_page_components[i];

            if (instantiated_page_component_.weight >= index) {
                instantiated_page_component_.weight++;
                await ModuleDAO.getInstance().insertOrUpdateVO(instantiated_page_component_);
            }
        }

        instantiated_page_component.weight = index;

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(instantiated_page_component);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            this.snotify.error(this.label('cms.change_order.failure'));
            return;
        }

        this.instantiated_page_components = await ModuleCMS.getInstance().getPageComponents(this.page_id);
        if (!this.instantiated_page_components) {
            this.instantiated_page_components = [];
        }

        // Waiting for an update of the lists
        let self = this;
        this.$nextTick(() => {
            $("#sortable_page_component_list").sortable("refresh");
            self.snotify.success(self.label('cms.change_order.ok'));
        });
    }

    private async onReceiveNewTemplateComponent(event, ui) {
        this.snotify.info(this.label('cms.insert_new_composant.start'));

        let template_component: TemplateComponentVO = $(ui.item).data('template_component');
        let index = ui.item.index();

        // Refuser de rajouter le template
        $("#sortable_page_component_list").sortable("cancel");
        $('#sortable_page_component_list>:nth-child(' + (index + 1) + ')').remove();

        // let new_composant_constructor: VueConstructor<ICMSComponentTemplateVue> = CMSComponentManager.getInstance().template_component_vue_by_type_id[template_component.type_id];

        // Décaler les poids des autres composants après celui-ci
        for (let i in this.instantiated_page_components) {

            if (i < index) {
                continue;
            }

            let instantiated_page_component: IInstantiatedPageComponent = this.instantiated_page_components[i];

            instantiated_page_component.weight++;
            await ModuleDAO.getInstance().insertOrUpdateVO(instantiated_page_component);
        }

        let new_composant_constructor: IInstantiatedPageComponent = {
            id: null,
            _type: template_component.type_id,
            page_id: this.page_id,
            weight: index
        };

        let insertOrDeleteQueryResult: InsertOrDeleteQueryResult = await ModuleDAO.getInstance().insertOrUpdateVO(new_composant_constructor);
        if ((!insertOrDeleteQueryResult) || (!insertOrDeleteQueryResult.id)) {
            this.snotify.error(this.label('cms.insert_new_composant.failure'));
            return;
        }
        new_composant_constructor.id = parseInt(insertOrDeleteQueryResult.id);
        // this.storeData(new_composant_constructor);

        this.instantiated_page_components = await ModuleCMS.getInstance().getPageComponents(this.page_id);
        if (!this.instantiated_page_components) {
            this.instantiated_page_components = [];
        }

        // Mais ajouter le composant instancié
        // if (index > 0) {
        //     $("<div class='page_component_wrapper'>ITEM instance</div>").insertAfter($('#sortable_page_component_list>:nth-child(' + index + ')'));
        // } else {
        //     $("<div class='page_component_wrapper'>ITEM instance</div>").prependTo($('#sortable_page_component_list'));
        // }
        // $("#sortable_page_component_list").sortable("refresh");

        // Waiting for an update of the lists
        let self = this;
        this.$nextTick(() => {
            $("#sortable_page_component_list").sortable("refresh");
            self.snotify.success(self.label('cms.insert_new_composant.ok'));
        });
    }
}