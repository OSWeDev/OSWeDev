import { Component, Watch } from 'vue-property-decorator';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModuleOselia from '../../../../shared/modules/Oselia/ModuleOselia';
import OseliaController from '../../../../shared/modules/Oselia/OseliaController';
import VueComponentBase from "../VueComponentBase";
import { ModuleDAOGetter } from '../dao/store/DaoStore';
import OseliaThreadWidgetComponent from '../dashboard_builder/widgets/oselia_thread_widget/OseliaThreadWidgetComponent';
import './OseliaChatHandlerComponent.scss';
import EventifyEventListenerInstanceVO from '../../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO';
import EventsController from '../../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import IPlanRDVCR from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import EventifyEventConfVO from '../../../../shared/modules/Eventify/vos/EventifyEventConfVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIThreadVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import GPTAssistantAPIAssistantVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import { field_names } from '../../../../shared/tools/ObjectHandler';
import ModuleGPT from '../../../../shared/modules/GPT/ModuleGPT';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
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
    private isActiveOselia: boolean = false;
    private current_cr_vo: IPlanRDVCR = null;
    private new_thread_id: string = null;

    get oselia_url(): string {

        if (!this.ott) {
            return null;
        }

        const { protocol, hostname, port } = window.location;
        return `${protocol}//${hostname}${(port ? `:${port}` : '')}/api_handler/oselia__open_oselia_db/${this.ott}/${this.new_thread_id ? this.new_thread_id : '_'}/_`;
    }

    @Watch('$route')
    public async onRouteChange() {
        this.isActive = (await OseliaController.get_referrer_id(document.location.href)) != null;
    }

    @Watch('isActiveOselia')
    private async onIsActiveOseliaChange() {
        if (this.isActiveOselia) {
            // On est sur du realtime, on créer le thread
            const new_thread_id: number = await ModuleOselia.getInstance().create_thread();
            if (new_thread_id) {
                const new_thread : GPTAssistantAPIThreadVO = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                    .filter_by_id(new_thread_id)
                    .select_vo();
                const realtime_assistant_id = (await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                    .filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().nom, ModuleGPT.ASSISTANT_REALTIME_NAME)
                    .select_vo()).id;
                new_thread.current_oselia_assistant_id = realtime_assistant_id;
                new_thread.current_default_assistant_id = realtime_assistant_id;

                await ModuleDAO.getInstance().insertOrUpdateVO(new_thread);
                this.new_thread_id = new_thread.gpt_thread_id;
            }
        }
    }

    private async mounted() {
        const get_oselia_realtime_activation = EventifyEventListenerInstanceVO.new_listener(
            ModuleOselia.EVENT_OSELIA_LAUNCH_REALTIME,
            (event: EventifyEventInstanceVO) => {
                const param = event.param ? event.param as { launch: boolean, cr_vo: IPlanRDVCR } : { launch: false, cr_vo: null };
                this.isActiveOselia = param.launch;
                this.current_cr_vo = param.cr_vo;
            }
        );
        EventsController.register_event_listener(get_oselia_realtime_activation);
    }

    private async openClick() {
        this.is_open = !this.is_open;
        if (this.ott) {
            this.ott = null;
        }
        this.ott = await ModuleOselia.getInstance().get_token_oselia(document.location.href);
    }


    private async stopRecording() {
        this.isActiveOselia = false;
        this.current_cr_vo = null;
        const event_conf = new EventifyEventConfVO();
        event_conf.name = ModuleOselia.EVENT_OSELIA_CLOSE_REALTIME;
        await EventsController.emit_event(EventifyEventInstanceVO.instantiate(event_conf, false));
    }

}