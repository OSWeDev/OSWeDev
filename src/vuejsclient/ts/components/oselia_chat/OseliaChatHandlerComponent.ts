import { Component, Watch } from 'vue-property-decorator';
import { query } from '../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from '../../../../shared/modules/DAO/ModuleDAO';
import EventsController from '../../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import EventifyEventListenerInstanceVO from '../../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO';
import ModuleGPT from '../../../../shared/modules/GPT/ModuleGPT';
import GPTAssistantAPIAssistantVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIThreadVO from '../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import IDistantVOBase from '../../../../shared/modules/IDistantVOBase';
import ModuleOselia from '../../../../shared/modules/Oselia/ModuleOselia';
import OseliaController from '../../../../shared/modules/Oselia/OseliaController';
import { field_names, reflect } from '../../../../shared/tools/ObjectHandler';
import VueComponentBase from '../VueComponentBase';
import { ModuleDAOGetter } from '../dao/store/DaoStore';
import './OseliaChatHandlerComponent.scss';
import { ModuleOseliaAction, ModuleOseliaGetter } from '../dashboard_builder/widgets/oselia_thread_widget/OseliaStore';
import { ref } from 'vue';
import OseliaRealtimeController from '../dashboard_builder/widgets/oselia_thread_widget/OseliaRealtimeController';
import AjaxCacheClientController from '../../modules/AjaxCache/AjaxCacheClientController';
import { sleep } from 'openai/core';
@Component({
    template: require('./OseliaChatHandlerComponent.pug'),
})
export default class OseliaChatHandlerComponent extends VueComponentBase {
    /* ------------------------------------------------------------------
    *                         STORES & REFS                             */
    @ModuleDAOGetter public getStoredDatas!: {
        [API_TYPE_ID: string]: { [id: number]: IDistantVOBase };
    };

    @ModuleOseliaGetter public get_current_thread!: GPTAssistantAPIThreadVO | null;

    /* ------------------------------------------------------------------
    *                          ÉTAT LOCAL                               */
    public currentThreadVO: GPTAssistantAPIThreadVO | null = null;
    private iframe_is_loading: boolean = false;
    private iframe_loaded: boolean = false;
    private connection_established: boolean = false;
    private isActive = false;
    private is_open = false;
    private is_closing = false;
    private ott: string | null = null;
    private isActiveOselia = false;
    private new_thread_id: string | null = null;
    private openingParams: object | null = null;
    private isStopHover: boolean = false;
    private isHoveringIframe: boolean = false;
    /* Verrou pour éviter plusieurs create_thread() simultanés */
    private creatingThread = false;

    private listener_EVENT_OSELIA_LOADED_FRAME: EventifyEventListenerInstanceVO = null;
    private listener_EVENT_OSELIA_LAUNCH_REALTIME: EventifyEventListenerInstanceVO = null;
    /* Stockage des listeners pour unbind */
    private listeners: EventifyEventListenerInstanceVO[] = [];
    private tab_id: string | null = null;

    /* ------------------------------------------------------------------
     *                            GETTERS                                */
    get oselia_url(): string | null {
        if (!this.ott) return null;
        const { protocol, hostname, port } = window.location;
        return `${protocol}//${hostname}${port ? `:${port}` : ''}/api_handler/oselia__open_oselia_db/${this.ott}/${this.new_thread_id ?? '_'
        }/_/${this.tab_id ?? ''}`;
    }

    /* ------------------------------------------------------------------
     *                           WATCHERS                                */
    @Watch('$route') private async onRouteChange() {
        this.isActive = (await OseliaController.get_referrer_id(document.location.href)) != null;
    }

    @Watch(reflect<OseliaChatHandlerComponent>().get_current_thread, { deep: true })
    private async onCurrentThreadChange() {
        // Ne réagir que si le composant est actif (usage externe avec referrer)
        // Sinon on évite les conflits avec l'usage interne (thread widget)
        if (!this.isActive) {
            return;
        }

        if (this.get_current_thread) {
            if ((this.currentThreadVO && this.get_current_thread) && (this.currentThreadVO.id == this.get_current_thread.id)) {
                if (this.connection_established != this.get_current_thread.realtime_activated) {
                    this.connection_established = this.get_current_thread.realtime_activated;
                }
                // Si le thread n’a pas changé, on ne fait rien
                return;
            }
            this.currentThreadVO = this.get_current_thread;
            if (this.currentThreadVO) {
                this.new_thread_id = this.currentThreadVO.gpt_thread_id;
                this.connection_established = this.currentThreadVO.realtime_activated;
                this.is_open = true;
                if (!this.iframe_loaded) {
                    this.iframe_is_loading = true;
                }
                if (!this.ott) {
                    await this.refreshOTT();
                }
            }
        }

        if (this.connection_established) {
            // Active la pulsation discrète
            this.$nextTick(() => {
                this.$el
                    .querySelector('.oselia_chat_btn_stop-mini')
                    ?.classList.add('visible');
            });
        }
    }

    @Watch('connection_established')
    private async onOpenStateChange(open: boolean) {
        if (open) {
            await this.$nextTick();                  // l’iframe est dans le DOM
            await this.bindIframeHoverListeners(true);
        } else {
            await this.bindIframeHoverListeners(false);    // nettoie
        }
    }

    @Watch('iframe_is_loading')
    private async onIframeLoadingChange(is_loading: boolean) {
        this.iframe_loaded = !is_loading;  // l’iframe est chargée si elle n’est pas en train de charger
    }

    beforeUnmount() {
        this.bindIframeHoverListeners(false);
        delete EventsController.registered_listeners[ModuleOselia.EVENT_OSELIA_LOADED_FRAME][this.listener_EVENT_OSELIA_LOADED_FRAME.instance_uid];
    }

    /* ------------------------------------------------------------------
     *                            ACTIONS                                 */

    private async mounted() {
        this.tab_id = AjaxCacheClientController.getInstance().client_tab_id;
        this.listener_EVENT_OSELIA_LOADED_FRAME = EventsController.on_every_event_throttle_cb(
            ModuleOselia.EVENT_OSELIA_LOADED_FRAME,
            (event: EventifyEventInstanceVO) => {
                const param = JSON.parse(event.param as string);
                if (param.tab_id) return;
                this.iframe_is_loading = param.is_loading as boolean;
            },
            10,
            false,
        );
    }

    private async bindIframeHoverListeners(bind: boolean) {
        const iframe = document.getElementById('OseliaContainer');
        if (!iframe) { return; }
        const enter = () => { this.isHoveringIframe = true; };
        const leave = () => { this.isHoveringIframe = false; };
        if (bind) {
            iframe.addEventListener('mouseenter', enter);
            iframe.addEventListener('mouseleave', leave);
            // On stocke pour pouvoir unbind plus tard
            (this as any)._iframeEnter = enter;
            (this as any)._iframeLeave = leave;
        } else {
            iframe.removeEventListener('mouseenter', (this as any)._iframeEnter);
            iframe.removeEventListener('mouseleave', (this as any)._iframeLeave);
        }
    }

    private mainButtonClick() {
        if (this.connection_established && this.isStopHover) {
            this.stopClick();          // coupe la connexion
        } else {
            this.openClick();          // ouvre / ferme le chat
        }
    }

    private toggleStopHover(on: boolean) {
        if (!this.connection_established || this.isHoveringIframe) return;
        this.isStopHover = on;
    }

    private async openClick() {
        // --- 1. FERMER si déjà ouvert -------------------------------
        if (this.is_open) {
            this.is_open = false;            // cache le template <iframe>
            this.iframe_is_loading = false;  // coupe l’animation
            this.iframe_loaded = false;      // l’iframe n’est plus chargée
            this.is_closing = true;        // on est en train de fermer
            this.ott = null;
            sleep(1000).then(() => {
                this.is_closing = false;   // on a fini de fermer
            });
            // On ne touche pas à iframe_loaded : il servira au prochain open
            return;
        }

        // --- 2. OUVRIR sinon ----------------------------------------
        this.is_open = true;

        // Si le contenu n’a encore jamais été chargé,
        // on affiche le loader jusqu’au onload
        if (!this.iframe_loaded) {
            this.iframe_is_loading = true;
        }

        if (!this.ott) {
            await this.refreshOTT();
        }
    }

    private async stopClick(): Promise<void> {
        EventsController.emit_event(
            EventifyEventInstanceVO.new_event(ModuleOselia.EVENT_OSELIA_CLOSE_REALTIME, false)
        );
        if (this.is_open) {
            this.is_open = false;            // cache le template <iframe>
            this.iframe_is_loading = false;
            this.iframe_loaded = false;      // l’iframe n’est plus chargée
            this.is_closing = true;        // on est en train de fermer
            this.ott = null;
            sleep(1000).then(() => {
                this.is_closing = false;   // on a fini de fermer
            });
            return;
        }
    }

    /* ------------------------------------------------------------------
     *                         HELPERS                                    */
    private async refreshOTT() {
        const local_ott = await ModuleOselia.getInstance().get_token_oselia(document.location.href);
        if (local_ott != this.ott) {
            this.ott = local_ott;
        }
    }

}
