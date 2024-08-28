import { Component, Watch } from 'vue-property-decorator';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModuleOselia from '../../../../shared/modules/Oselia/ModuleOselia';
import OseliaController from '../../../../shared/modules/Oselia/OseliaController';
import VueComponentBase from "../VueComponentBase";
import { ModuleDAOGetter } from '../dao/store/DaoStore';
import OseliaThreadWidgetComponent from '../dashboard_builder/widgets/oselia_thread_widget/OseliaThreadWidgetComponent';
import './OseliaChatHandlerComponent.scss';
@Component({
    template: require('./OseliaChatHandlerComponent.pug')
})
export default class OseliaChatHandlerComponent extends VueComponentBase {

    @ModuleDAOGetter
    public getStoredDatas: { [API_TYPE_ID: string]: { [id: number]: IDistantVOBase } };

    private url: string = null;
    private isActive: boolean = false;
    private isOpened: boolean = false;
    private widget: OseliaThreadWidgetComponent = null;
    private ott: string = null;


    get oselia_url(): string {

        if (!this.ott) {
            return null;
        }

        const { protocol, hostname, port } = window.location;
        return `${protocol}//${hostname}${(port ? `:${port}` : '')}/api_handler/oselia__open_oselia_db/${this.ott}/_/_`;
    }

    @Watch('$route')
    public async onRouteChange() {
        this.url = this.$route.fullPath;
        this.isActive = (await OseliaController.get_referrer_id(this.url)) != null;
    }

    public async mounted() {
        const self = this;
        this.url = this.$route.fullPath;
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