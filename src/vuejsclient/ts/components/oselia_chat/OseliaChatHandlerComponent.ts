import { Component, Watch } from 'vue-property-decorator';
import VueComponentBase from "../VueComponentBase";
import OseliaChatVO from '../../../../shared/modules/Oselia/vos/OseliaChatVO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import { ModuleDAOGetter } from '../dao/store/DaoStore';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import OseliaThreadWidgetComponent from '../dashboard_builder/widgets/oselia_thread_widget/OseliaThreadWidgetComponent';
import ModuleOselia from '../../../../shared/modules/Oselia/ModuleOselia';
@Component({
    template: require('./OseliaChatHandlerComponent.pug')
})
export default class OseliaChatHandlerComponent extends VueComponentBase {
    private url: string = null;
    private isActive: boolean = false;
    private isOpened: boolean = false;
    private widget: OseliaThreadWidgetComponent = null;
    private ott: string = null;

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    public async mounted() {
        const self = this;
        this.url = this.$route.fullPath
    }

    @Watch('$route')
    public async onRouteChange() {
        this.url = this.$route.fullPath
        const vos: OseliaChatVO[] = await query(OseliaChatVO.API_TYPE_ID).select_vos<OseliaChatVO>()
        for (const i in vos) {
            const chat_instance: OseliaChatVO = vos[i];
            if (new RegExp(chat_instance.regex).test(this.url)) {
                this.isActive = true
                this.widget = new OseliaThreadWidgetComponent();
                break;
            }
        }
    }

    private async openClick() {
        this.isOpened = true;
        this.ott = await ModuleOselia.getInstance().get_token_oselia(this.url);
    }

    private closeClick() {
        this.isOpened = false;
        this.ott = null;
    }

}