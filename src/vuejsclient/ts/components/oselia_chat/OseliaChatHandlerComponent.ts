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

    private isActive: boolean = false;
    private is_open: boolean = false;
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
        this.isActive = (await OseliaController.get_referrer_id(document.location.href)) != null;
    }

    private async openClick() {
        this.is_open = !this.is_open;
        if (this.ott) {
            this.ott = null;
        }
        this.ott = await ModuleOselia.getInstance().get_token_oselia(document.location.href);
    }
}