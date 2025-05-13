import { Component, Watch } from 'vue-property-decorator';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModuleOselia from '../../../../shared/modules/Oselia/ModuleOselia';
import OseliaController from '../../../../shared/modules/Oselia/OseliaController';
import VueComponentBase from '../VueComponentBase';
import { ModuleDAOGetter } from '../dao/store/DaoStore';
import './OseliaChatHandlerComponent.scss';
import EventifyEventListenerInstanceVO from '../../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO';
import EventsController from '../../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import IPlanRDVCR from '../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import EventifyEventConfVO from '../../../../shared/modules/Eventify/vos/EventifyEventConfVO';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIThreadVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import GPTAssistantAPIAssistantVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import { field_names, reflect } from '../../../../shared/tools/ObjectHandler';
import ModuleGPT from '../../../../shared/modules/GPT/ModuleGPT';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import Vue from 'vue';
@Component({
    template: require('./OseliaChatHandlerComponent.pug'),
})
export default class OseliaChatHandlerComponent extends VueComponentBase {
    /* ------------------------------------------------------------------
     *                         STORES & REFS                             */
    @ModuleDAOGetter public getStoredDatas!: {
        [API_TYPE_ID: string]: { [id: number]: IDistantVOBase };
    };

    /* ------------------------------------------------------------------
     *                          ÉTAT LOCAL                               */
    public currentThreadVO: GPTAssistantAPIThreadVO | null = null;
    private connectionEstablished: boolean = false;
    private isActive = false;
    private is_open = false;
    private ott: string | null = null;
    private isActiveOselia = false;
    private current_cr_vo: IPlanRDVCR | null = null;
    private new_thread_id: string | null = null;

    /* Verrou pour éviter plusieurs create_thread() simultanés */
    private creatingThread = false;

    /* Stockage des listeners pour unbind */
    private listeners: EventifyEventListenerInstanceVO[] = [];

    /* ------------------------------------------------------------------
     *                            GETTERS                                */
    get oselia_url(): string | null {
        if (!this.ott) return null;
        const { protocol, hostname, port } = window.location;
        return `${protocol}//${hostname}${port ? `:${port}` : ''}/api_handler/oselia__open_oselia_db/${this.ott}/${
            this.new_thread_id ?? '_'
        }/_`;
    }

    /* ------------------------------------------------------------------
     *                           WATCHERS                                */
    @Watch('$route') private async onRouteChange() {
        this.isActive = (await OseliaController.get_referrer_id(document.location.href)) != null;
    }

    @Watch('currentThreadVO', { deep: true }) private onCurrentThreadVOChange() {
        if (!this.currentThreadVO) {
            this.is_open = false;
            return;
        }
        if (this.currentThreadVO.realtime_activated !== this.isActiveOselia) {
            // Sync l'état local sur le VO, sans reboucler si déjà égal
            this.isActiveOselia = this.currentThreadVO.realtime_activated;
        }
        if (this.currentThreadVO.realtime_activated) {
            this.new_thread_id = this.currentThreadVO.gpt_thread_id;
            this.is_open = true;
            if (!this.ott) this.refreshOTT();
        }
    }

    @Watch('isActiveOselia') private async onIsActiveOseliaChange() {
        if (!this.currentThreadVO && !this.isActiveOselia) return; // rien à faire

        if (this.isActiveOselia) {
            // --- Activation realtime ----------------------------------
            if (!this.new_thread_id && !this.creatingThread) {
                try {
                    this.creatingThread = true;
                    const new_thread_id = await ModuleOselia.getInstance().create_thread();
                    if (new_thread_id) {
                        const new_thread = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                            .filter_by_id(new_thread_id)
                            .select_vo<GPTAssistantAPIThreadVO>();
                        const realtimeAssistant = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                            .filter_by_text_eq(field_names<GPTAssistantAPIAssistantVO>().nom, ModuleGPT.ASSISTANT_REALTIME_NAME)
                            .select_vo<GPTAssistantAPIAssistantVO>();
                        if (realtimeAssistant) {
                            new_thread.current_oselia_assistant_id = realtimeAssistant.id;
                            new_thread.current_default_assistant_id = realtimeAssistant.id;
                        }
                        this.new_thread_id = new_thread.gpt_thread_id;
                        this.register_single_vo_updates(
                            GPTAssistantAPIThreadVO.API_TYPE_ID,
                            new_thread.id,
                            reflect<this>().currentThreadVO,
                        );
                        new_thread.realtime_activated = true;
                        await ModuleDAO.getInstance().insertOrUpdateVO(new_thread);
                    }
                } finally {
                    this.creatingThread = false;
                }
            } else if (this.currentThreadVO && !this.currentThreadVO.realtime_activated) {
                this.currentThreadVO.realtime_activated = true;
                await ModuleDAO.getInstance().insertOrUpdateVO(this.currentThreadVO);
            }
        } else if (this.currentThreadVO?.realtime_activated) {
            // --- Désactivation realtime --------------------------------
            this.currentThreadVO.realtime_activated = false;
            await ModuleDAO.getInstance().insertOrUpdateVO(this.currentThreadVO);
        }
    }

    /* ------------------------------------------------------------------
     *                       CYCLE DE VIE                                 */
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

        const get_oselia_realtime_ready = EventifyEventListenerInstanceVO.new_listener(
            ModuleOselia.EVENT_OSELIA_REALTIME_READY,
            (event: EventifyEventInstanceVO) => {
                Vue.set(this, 'connectionEstablished', event.param);
            }
        );
        // Listener ready realtime (socket ouverte côté service)
        EventsController.register_event_listener(get_oselia_realtime_ready);
    }

    private async beforeDestroy() {
        await this.unregister_all_vo_event_callbacks();
    }

    /* ------------------------------------------------------------------
     *                            ACTIONS                                 */
    private async openClick() {
        this.is_open = !this.is_open;
        if (this.is_open && !this.ott) await this.refreshOTT();
    }

    private async stopRecording() {
        this.isActiveOselia = false;
        this.current_cr_vo = null;
        const evtConf = new EventifyEventConfVO();
        evtConf.name = ModuleOselia.EVENT_OSELIA_CLOSE_REALTIME;
        await EventsController.emit_event(EventifyEventInstanceVO.instantiate(evtConf, false));
    }

    /* ------------------------------------------------------------------
     *                         HELPERS                                    */
    private async refreshOTT() {
        this.ott = await ModuleOselia.getInstance().get_token_oselia(document.location.href);
    }
}
