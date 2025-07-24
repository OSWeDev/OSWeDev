import Cookies from "js-cookie";
import { cloneDeep } from 'lodash';
import Component from 'vue-class-component';
import VueJsonPretty from 'vue-json-pretty';
import { Prop, Watch } from 'vue-property-decorator';
import Throttle from "../../../../../../shared/annotations/Throttle";
import ModuleAccessPolicy from '../../../../../../shared/modules/AccessPolicy/ModuleAccessPolicy';
import ContextFilterVOManager from '../../../../../../shared/modules/ContextFilter/manager/ContextFilterVOManager';
import ContextFilterVO, { filter } from '../../../../../../shared/modules/ContextFilter/vos/ContextFilterVO';
import ContextQueryVO, { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import ModuleDAO from "../../../../../../shared/modules/DAO/ModuleDAO";
import FieldFiltersVOManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldFiltersVOManager';
import FieldValueFilterWidgetManager from '../../../../../../shared/modules/DashboardBuilder/manager/FieldValueFilterWidgetManager';
import DashboardPageVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageVO';
import DashboardPageWidgetVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardPageWidgetVO';
import DashboardVO from '../../../../../../shared/modules/DashboardBuilder/vos/DashboardVO';
import FieldFiltersVO from '../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO';
import NumRange from '../../../../../../shared/modules/DataRender/vos/NumRange';
import EventifyEventListenerConfVO from "../../../../../../shared/modules/Eventify/vos/EventifyEventListenerConfVO";
import FileVO from '../../../../../../shared/modules/File/vos/FileVO';
import Dates from '../../../../../../shared/modules/FormatDatesNombres/Dates/Dates';
import ModuleGPT from '../../../../../../shared/modules/GPT/ModuleGPT';
import GPTAssistantAPIAssistantVO from '../../../../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import GPTAssistantAPIFunctionVO from '../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionVO';
import GPTAssistantAPIThreadMessageVO from '../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadMessageVO';
import GPTAssistantAPIThreadVO from '../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ModuleOselia from '../../../../../../shared/modules/Oselia/ModuleOselia';
import OseliaController from '../../../../../../shared/modules/Oselia/OseliaController';
import OseliaRunFunctionCallVO from '../../../../../../shared/modules/Oselia/vos/OseliaRunFunctionCallVO';
import OseliaRunVO from '../../../../../../shared/modules/Oselia/vos/OseliaRunVO';
import OseliaThreadCacheVO from '../../../../../../shared/modules/Oselia/vos/OseliaThreadCacheVO';
import ModuleParams from '../../../../../../shared/modules/Params/ModuleParams';
import VOsTypesManager from '../../../../../../shared/modules/VO/manager/VOsTypesManager';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import { field_names, reflect } from '../../../../../../shared/tools/ObjectHandler';
import { all_promises } from "../../../../../../shared/tools/PromiseTools";
import ThrottleHelper from '../../../../../../shared/tools/ThrottleHelper';
import VueAppController from '../../../../../VueAppController';
import AjaxCacheClientController from '../../../../modules/AjaxCache/AjaxCacheClientController';
import InlineTranslatableText from '../../../InlineTranslatableText/InlineTranslatableText';
import { ModuleTranslatableTextGetter } from '../../../InlineTranslatableText/TranslatableTextStore';
import VueComponentBase from '../../../VueComponentBase';
import DatatableComponentField from '../../../datatable/component/fields/DatatableComponentField';
import MailIDEventsComponent from '../../../mail_id_events/MailIDEventsComponent';
import { ModuleDashboardPageAction, ModuleDashboardPageGetter } from '../../page/DashboardPageStore';
import OseliaRunGraphWidgetComponent from '../oselia_run_graph_widget/OseliaRunGraphWidgetComponent';
import TablePaginationComponent from '../table_widget/pagination/TablePaginationComponent';
import OseliaLeftPanelComponent from './OseliaLeftPanel/OseliaLeftPanelComponent';
import OseliaRunArboComponent from './OseliaRunArbo/OseliaRunArboComponent';
import { ModuleOseliaAction, ModuleOseliaGetter } from './OseliaStore';
import OseliaThreadMessageComponent from './OseliaThreadMessage/OseliaThreadMessageComponent';
import './OseliaThreadWidgetComponent.scss';
import GPTRealtimeAPISessionVO from "../../../../../../shared/modules/GPT/vos/GPTRealtimeAPISessionVO";
import { EventEmitter } from "events";
import EventsController from "../../../../../../shared/modules/Eventify/EventsController";
import EventifyEventInstanceVO from "../../../../../../shared/modules/Eventify/vos/EventifyEventInstanceVO";
import EventifyEventListenerInstanceVO from "../../../../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO";
import EnvHandler from "../../../../../../shared/tools/EnvHandler";
import { ref } from "vue";
import OseliaRealtimeController from "./OseliaRealtimeController";
import GPTAssistantAPIAssistantFunctionVO from "../../../../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantFunctionVO";
import GPTAssistantAPIFunctionParamVO from "../../../../../../shared/modules/GPT/vos/GPTAssistantAPIFunctionParamVO";
import { Console } from "console";
import OseliaRunTemplateVO from "../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO";

@Component({
    template: require('./OseliaThreadWidgetComponent.pug'),
    components: {
        Inlinetranslatabletext: InlineTranslatableText,
        Datatablecomponentfield: DatatableComponentField,
        Tablepaginationcomponent: TablePaginationComponent,
        Mailideventscomponent: MailIDEventsComponent,
        Oseliathreadmessagecomponent: OseliaThreadMessageComponent,
        Oselialeftpanelcomponent: OseliaLeftPanelComponent,
        VueJsonPretty,
        Oseliarunarbocomponent: OseliaRunArboComponent,
        Oseliarungraphwidgetcomponent: OseliaRunGraphWidgetComponent,
    }
})
export default class OseliaThreadWidgetComponent extends VueComponentBase {

    @ModuleOseliaGetter
    public get_too_many_assistants: boolean;
    @ModuleOseliaGetter
    public get_can_run_assistant: boolean;
    @ModuleOseliaGetter
    public get_oselia_first_loading_done: boolean;
    @ModuleOseliaGetter
    public get_parent_client_tab_id: string;
    @ModuleOseliaGetter
    public get_show_hidden_messages: boolean;
    @ModuleOseliaAction
    public set_show_hidden_messages: (show_hidden_messages: boolean) => void;

    @ModuleOseliaAction
    public set_left_panel_open: (left_panel_open: boolean) => void;
    @ModuleOseliaGetter
    public get_left_panel_open: boolean;

    @ModuleDashboardPageGetter
    public get_active_field_filters: FieldFiltersVO;
    @ModuleDashboardPageAction
    public set_active_field_filter: (param: { vo_type: string, field_id: string, active_field_filter: ContextFilterVO }) => void;

    @ModuleTranslatableTextGetter
    public get_flat_locale_translations: { [code_text: string]: string };

    @Prop({ default: null })
    public page_widget: DashboardPageWidgetVO;

    @Prop({ default: null })
    public dashboard: DashboardVO;

    @Prop({ default: null })
    public dashboard_page: DashboardPageVO;

    @Prop({ default: null })
    public all_page_widget: DashboardPageWidgetVO[];

    @ModuleDashboardPageGetter
    public get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    public get_dashboard_api_type_ids: string[];

    @ModuleOseliaAction
    private set_too_many_assistants: (too_many_assistants: boolean) => void;
    @ModuleOseliaAction
    private set_can_run_assistant: (can_run_assistant: boolean) => void;
    @ModuleOseliaAction
    private set_oselia_first_loading_done: (oselia_first_loading_done: boolean) => void;

    public currently_selected_assistant: GPTAssistantAPIAssistantVO = null;
    public selectable_assistants: GPTAssistantAPIAssistantVO[] = [];

    public auto_commit_auto_input: boolean = (Cookies.get("auto_commit_auto_input") === "true");
    public audio_message_summary_playlist_paths: string[] = [];
    public audio_messages_already_read: { [tts_file_id: number]: boolean } = {};
    public audio_is_playing: boolean = false;
    public current_audio: HTMLAudioElement = null;

    public thread_cached_datas: OseliaThreadCacheVO[] = [];
    public sub_threads: GPTAssistantAPIThreadVO[] = [];
    public function_calls: OseliaRunFunctionCallVO[] = [];

    public data_received: any = null;
    public selected_file_system: FileVO[] = [];

    public thread_messages: GPTAssistantAPIThreadMessageVO[] = [];
    public thread: GPTAssistantAPIThreadVO = null;
    public oselia_runs: OseliaRunVO[] = [];
    public realtime_session: GPTRealtimeAPISessionVO = null;
    public is_loading_thread: boolean = true;
    public use_realtime_voice: boolean = false;
    private has_access_to_thread: boolean = false;
    private assistant_is_busy: boolean = false;
    private current_thread_id: number = null;
    private assistant: GPTAssistantAPIAssistantVO = null;
    private new_message_text: string = null;
    private is_dragging: boolean = false;
    private thread_files: { [key: string]: FileVO }[] = [];
    private enable_image_upload_menu: boolean = false;
    private enable_link_image_menu: boolean = false;
    private enable_file_system_menu: boolean = false;
    private link_image_url: string = null;
    private is_expanded: boolean = false;
    private frame: HTMLElement = null;
    private wait_for_data: boolean = false;
    private dashboard_export_id: number = null;
    private is_creating_thread: boolean = false;
    private realtime_on: boolean = false;
    private realtime_manual_control: boolean = false; // Flag pour éviter les conflits avec le watcher
    private realtime_connecting: boolean = false; // Flag pour indiquer la connexion en cours
    private send_message_create: boolean = false;
    private POLICY_CAN_USE_REALTIME: boolean = false;
    // private is_recording_voice: boolean = false;
    // private voice_record: MediaRecorder = null;
    private has_access_to_debug: boolean = false;

    private expand_thread_cached_datas: boolean = false;
    private expand_sub_threads: boolean = false;
    private expand_function_calls: boolean = false;
    private expand_oselia_runs: boolean = false;

    private input_voice_is_recording = false;
    private input_voice_is_transcribing = false;
    private media_recorder: MediaRecorder = null;
    private audio_chunks: Blob[] = [];
    private incomingAudioChunks: Uint8Array[] = [];

    // private auto_play_new_run_audio_summaries: boolean = false;
    // private last_run_id_checked_for_audio_summary: number = null;
    private already_read_message_ids: { [message_id: number]: boolean } = {};
    private thread_already_read_message_ids_initialised: boolean = false;

    private functions_by_id: { [id: number]: GPTAssistantAPIFunctionVO } = {};

    private throttle_load_thread = ThrottleHelper.declare_throttle_without_args(
        'OseliaThreadWidgetComponent.throttle_load_thread',
        this.load_thread.bind(this), 10);
    private throttle_register_thread = ThrottleHelper.declare_throttle_without_args(
        'OseliaThreadWidgetComponent.throttle_register_thread',
        this.register_thread.bind(this), 10);

    get role_assistant_avatar_url() {
        return '/public/vuejsclient/img/avatars/oselia.png';
    }

    get file_system_url() {
        const { protocol, hostname, port } = window.location;
        return `${protocol}//${hostname}${(port ? `:${port}` : '')}/admin#/dashboard/view/`;
    }

    get oselia_blocked(): boolean {
        return EnvHandler.block_oselia_realtime;
    }


    @Throttle({
        param_type: EventifyEventListenerConfVO.PARAM_TYPE_NONE,
        throttle_ms: 10,
    })
    private async read_next_audio_summary() {
        if (!this.audio_message_summary_playlist_paths || this.audio_message_summary_playlist_paths.length == 0) {
            return;
        }

        if (this.audio_is_playing) {
            // Si un audio est déjà en cours de lecture, on ne lance pas le suivant
            return;
        }
        this.audio_is_playing = true;

        const audio_summary_path = this.audio_message_summary_playlist_paths.shift();
        this.current_audio = new Audio(audio_summary_path);

        try {
            await this.current_audio.play();
        } catch (error) {
            ConsoleHandler.error(error);
        }

        this.current_audio.onended = () => {
            this.audio_is_playing = false;
            this.read_next_audio_summary();
        };

        this.current_audio.onerror = (error) => {
            this.audio_is_playing = false;
            ConsoleHandler.error(JSON.stringify(error));
            this.read_next_audio_summary();
        };

        this.current_audio.onabort = () => {
            this.audio_is_playing = false;
            this.read_next_audio_summary();
        };
    }

    @Watch(reflect<OseliaThreadWidgetComponent>().currently_selected_assistant)
    private async on_change_currently_selected_assistant() {
        if (!this.currently_selected_assistant) {
            return;
        }

        if (this.assistant?.id != this.currently_selected_assistant.id) {
            this.assistant = this.currently_selected_assistant;
        }

        if (!this.thread) {
            return;
        }

        if (this.currently_selected_assistant.id == this.thread.current_default_assistant_id) {
            return;
        }

        this.thread.current_default_assistant_id = this.currently_selected_assistant.id;
        this.thread.current_oselia_assistant_id = this.currently_selected_assistant.id;
        await ModuleDAO.getInstance().insertOrUpdateVO(this.thread);
    }

    @Watch(reflect<OseliaThreadWidgetComponent>().auto_commit_auto_input)
    private on_auto_commit_auto_input() {
        Cookies.set("auto_commit_auto_input", String(this.auto_commit_auto_input), { expires: 365 });
    }

    @Watch(reflect<OseliaThreadWidgetComponent>().get_too_many_assistants)
    @Watch(reflect<OseliaThreadWidgetComponent>().get_can_run_assistant)
    private init_oselia_first_loading_done() {
        if ((!this.get_oselia_first_loading_done) && (!this.get_too_many_assistants) && this.get_can_run_assistant) {
            this.set_oselia_first_loading_done(true);
        }
    }

    @Watch(reflect<OseliaThreadWidgetComponent>().get_active_field_filters, { immediate: true, deep: true })
    @Watch(reflect<OseliaThreadWidgetComponent>().get_discarded_field_paths, { deep: true })
    @Watch(reflect<OseliaThreadWidgetComponent>().page_widget)
    private async on_change_filters_or_page_widget() {
        this.throttle_load_thread();
    }

    @Watch(reflect<OseliaThreadWidgetComponent>().selected_file_system)
    private async on_selected_file_system_change() {
        if (!this.selected_file_system) {
            return;
        }
        this.selected_file_system = null;
        this.enable_file_system_menu = false;
    }

    @Watch(reflect<OseliaThreadWidgetComponent>().thread, { immediate: true })
    private async onchange_thread(new_thread, old_thread) {

        if (!!old_thread && (old_thread.id === new_thread.id)) {
            return;
        }

        if (!(new_thread && old_thread && (new_thread.id == old_thread.id))) {
            this.thread_already_read_message_ids_initialised = false;
        }

        this.throttle_register_thread();
    }

    @Watch(reflect<OseliaThreadWidgetComponent>().thread_messages, { deep: true })
    private on_thread_messages_change(new_messages: GPTAssistantAPIThreadMessageVO[], old_messages: GPTAssistantAPIThreadMessageVO[]) {
        if (!old_messages || (new_messages.length > old_messages.length)) {
            this.$nextTick(() => {
                this.scroll_to_bottom();
            });
        }
    }

    @Watch(reflect<OseliaThreadWidgetComponent>().data_received)
    private async onchange_data_received() {
        const files = [];
        if (this.data_received.length > 0) {
            for (const row of this.data_received) {
                if (row['file___id']) {
                    const file = await query(FileVO.API_TYPE_ID)
                        .filter_by_id(row['file___id'])
                        .select_vo<FileVO>();
                    if (file) {
                        files.push(file);
                    }
                }
            }
        }

        for (const file of files) {
            this.thread_files.push({ ['.' + file.path.split('.').pop()]: file });
        }
    }

    @Watch(reflect<OseliaThreadWidgetComponent>().is_loading_thread, { immediate: true })
    private async on_is_loading_thread_change() {
        if(!this.get_parent_client_tab_id) {
            return;
        }

        const param = "{\"is_loading\": " + this.is_loading_thread + "}";
        await ModuleOselia.getInstance().notify_thread_loaded(this.get_parent_client_tab_id, ModuleOselia.EVENT_OSELIA_LOADED_FRAME,param );
    }

    @Watch(reflect<OseliaThreadWidgetComponent>().use_realtime_voice, { immediate: true })
    private async on_use_realtime_voice_change() {
        // Si on est en contrôle manuel, on laisse la méthode switchOpenRealtime gérer
        if (this.realtime_manual_control) {
            ConsoleHandler.log('Watcher realtime ignoré car en contrôle manuel');
            return;
        }

        try {
            const controller = OseliaRealtimeController.getInstance();
            if (this.use_realtime_voice && this.POLICY_CAN_USE_REALTIME) {
                let used_assistant = null;
                // On peut utiliser le realtime
                if (!this.thread) {
                    const new_thread: number = await ModuleOselia.getInstance().create_thread();

                    if (new_thread) {
                        this.set_active_field_filter({
                            field_id: field_names<GPTAssistantAPIThreadVO>().id,
                            vo_type: GPTAssistantAPIThreadVO.API_TYPE_ID,
                            active_field_filter: filter(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().id).by_id(new_thread)
                        });
                        const context_query_select: ContextQueryVO = query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                            .using(this.get_dashboard_api_type_ids)
                            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
                            ));
                        const thread = await context_query_select.select_vo<GPTAssistantAPIThreadVO>();
                        used_assistant = thread.current_default_assistant_id;
                    } else {
                        return;
                    }
                } else {
                    used_assistant = this.currently_selected_assistant ? this.currently_selected_assistant : this.assistant;
                }

                await controller.connect_to_realtime(OseliaRunTemplateVO.NEW_SESSION_OSELIA_RUN_TEMPLATE);
                ConsoleHandler.log('Realtime activé via watcher');
            } else {
                // On ne peut pas utiliser le realtime OU il faut le désactiver
                await controller.disconnect_to_realtime();
                ConsoleHandler.log('Realtime désactivé via watcher');
            }
        } catch (error) {
            ConsoleHandler.error('Erreur dans le watcher realtime:', error);
        }
    }

    private select_thread_id(thread_id: number) {
        this.set_active_field_filter({
            vo_type: GPTAssistantAPIThreadVO.API_TYPE_ID,
            field_id: field_names<GPTAssistantAPIThreadVO>().id,
            active_field_filter: filter(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().id).by_num_eq(thread_id)
        });
    }

    private async beforeDestroy() {
        // Arrêter l'audio en cours
        if (this.audio_is_playing && this.current_audio) {
            this.current_audio.pause();
            this.current_audio = null;
        }
        this.audio_is_playing = false;

        // S'assurer que le realtime est complètement arrêté
        if (this.use_realtime_voice) {
            try {
                await this.ensureRealtimeFullyDisconnected();
            } catch (error) {
                ConsoleHandler.error('Erreur lors de l\'arrêt du realtime dans beforeDestroy:', error);
            }
        }

        await this.unregister_all_vo_event_callbacks();

        window.removeEventListener('keydown', this.handleShortcutKeyDown);
        window.removeEventListener('keyup', this.handleShortcutKeyUp);
    }

    private openLeftPanel() {
        this.set_left_panel_open(true);
    }

    private switch_show_hidden_messages() {
        this.set_show_hidden_messages(!this.get_show_hidden_messages);
    }

    private async switchOpenRealtime() {
        // Empêcher les clics multiples pendant la connexion
        if (this.realtime_connecting) {
            return;
        }

        // Marquer qu'on utilise le contrôle manuel pour éviter les conflits avec le watcher
        this.realtime_manual_control = true;

        const new_value = !this.use_realtime_voice;

        if (new_value) {
            // Activer le realtime
            this.realtime_connecting = true;
            try {
                const controller = OseliaRealtimeController.getInstance();

                // Si on a un thread existant, on utilise l'assistant par défaut du thread
                if (this.thread) {
                    // On définit le thread actuel dans le controller
                    await this.$store.dispatch('OseliaStore/set_current_thread', this.thread);
                }

                // Lancement de la session realtime avec un template neutre (nouvelle session)
                await controller.connect_to_realtime(OseliaRunTemplateVO.NEW_SESSION_OSELIA_RUN_TEMPLATE);

                // Mettre à jour le flag seulement après succès
                this.use_realtime_voice = true;

                ConsoleHandler.log('Session realtime démarrée depuis le bouton du thread widget');
            } catch (error) {
                ConsoleHandler.error('Erreur lors du démarrage de la session realtime:', error);
                // Ne pas changer le flag en cas d'erreur
                this.use_realtime_voice = false;
            } finally {
                this.realtime_connecting = false;
            }
        } else {
            // Désactiver le realtime - Déconnexion forcée
            this.realtime_connecting = true;
            try {
                // ✅ SIMPLIFICATION : On ne gère plus la déconnexion ici.
                // On envoie juste l'ordre de fermer le realtime.
                // OseliaRealtimeController se chargera de la déconnexion et de la mise à jour du thread.
                EventsController.emit_event(
                    EventifyEventInstanceVO.new_event(ModuleOselia.EVENT_OSELIA_CLOSE_REALTIME, false)
                );

                // On met à jour l'UI immédiatement
                this.use_realtime_voice = false;

                ConsoleHandler.log('Ordre d\'arrêt de la session realtime envoyé depuis le thread widget');
            } catch (error) {
                ConsoleHandler.error('Erreur lors de l\'envoi de l\'ordre d\'arrêt de la session realtime:', error);
                // En cas d'erreur, utiliser la méthode de déconnexion forcée
                await this.ensureRealtimeFullyDisconnected();
            } finally {
                this.realtime_connecting = false;
                // S'assurer que le flag est bien à false
                this.use_realtime_voice = false;
            }
        }

        // Réinitialiser le flag de contrôle manuel après un délai
        setTimeout(() => {
            this.realtime_manual_control = false;
        }, 100);
    }

    /**
     * Méthode utilitaire pour s'assurer que le realtime est complètement arrêté
     */
    private async ensureRealtimeFullyDisconnected(): Promise<void> {
        try {
            const controller = OseliaRealtimeController.getInstance();

            ConsoleHandler.log('Début de la déconnexion forcée du realtime...');

            // Force une déconnexion même si l'état semble déjà déconnecté
            await controller.disconnect_to_realtime();

            // Attendre que toutes les ressources soient libérées
            await new Promise(resolve => setTimeout(resolve, 300));

            // Force une seconde déconnexion pour s'assurer que tout est nettoyé
            await controller.disconnect_to_realtime();

            // Attendre encore un peu
            await new Promise(resolve => setTimeout(resolve, 200));

            // S'assurer que le flag use_realtime_voice est à false
            if (this.use_realtime_voice) {
                this.use_realtime_voice = false;
            }

            // Le thread reste maintenu dans le store - pas besoin de le réinitialiser
            // OseliaRealtimeController se charge déjà de maintenir la continuité du thread

            ConsoleHandler.log('Déconnexion realtime forcée terminée');
        } catch (error) {
            ConsoleHandler.error('Erreur lors de la déconnexion forcée du realtime:', error);
            // Forcer les flags même si ça a échoué
            this.use_realtime_voice = false;
            this.realtime_connecting = false;
        }
    }    private async mounted() {
        this.POLICY_CAN_USE_REALTIME = await ModuleAccessPolicy.getInstance().testAccess(ModuleGPT.POLICY_USE_OSELIA_REALTIME_IN_CR);

        await all_promises([
            (async () => {
                this.selectable_assistants = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                    .select_vos<GPTAssistantAPIAssistantVO>();
            })(),
            // (async () => {
            //     this.use_realtime_voice = await ModuleParams.getInstance().getParamValueAsBoolean(OseliaController.PARAM_NAME_UNBLOCK_REALTIME_API, false, 120000);
            // })(),
            (async () => {
                this.has_access_to_debug = await ModuleAccessPolicy.getInstance().testAccess(ModuleOselia.POLICY_BO_ACCESS);
            })(),
            (async () => {
                const functions = await query(GPTAssistantAPIFunctionVO.API_TYPE_ID).select_vos<GPTAssistantAPIFunctionVO>();
                this.functions_by_id = VOsTypesManager.vosArray_to_vosByIds(functions);
            })(),
        ]);

        this.frame = parent.document.getElementById('OseliaContainer');

        window.addEventListener('paste', e => {
            if (e.clipboardData.files.length > 0) {
                Array.from(e.clipboardData.items).forEach(async (item: DataTransferItem, i) => {
                    // If pasted items aren't files, reject them
                    await this.do_upload_file(null, item.getAsFile());
                });
            }
        });
        window.addEventListener("message", (event: MessageEvent) => {
            const source = event.source as Window;
            if ((source.location.href !== this.file_system_url + this.dashboard_export_id)) {
                return;
            } else {
                if (this.wait_for_data) {
                    this.data_received = event.data;
                }
            }
        });

        window.addEventListener('keydown', this.handleShortcutKeyDown);
        window.addEventListener('keyup', this.handleShortcutKeyUp);
    }

    private async load_thread() {

        this.is_loading_thread = true;

        if (!this.page_widget) {

            this.thread_messages = [];
            this.thread_cached_datas = [];
            this.sub_threads = [];
            this.function_calls = [];
            this.oselia_runs = [];
            this.realtime_session = null;
            this.assistant = null;
            this.currently_selected_assistant = this.assistant;
            this.is_loading_thread = false;
            this.has_access_to_thread = false;
            this.thread = null;

            this.try_set_too_many_assistants(false);
            this.try_set_can_run_assistant(false);

            return;
        }

        await this.set_thread();

        if (!this.thread) {
            this.is_creating_thread = true;
        } else {
            if (this.is_creating_thread) {
                this.is_creating_thread = false;
                this.send_message_create = true;
            }
        }

        this.is_loading_thread = false;
        this.has_access_to_thread = !!this.thread;
    }

    private async handle_drag_over(event: DragEvent) {
        if (this.has_access_to_thread && !this.is_loading_thread) {
            this.is_dragging = true;
        }
    }

    private async handle_drag_leave(event: DragEvent) {
        if (this.has_access_to_thread && !this.is_loading_thread) {
            this.is_dragging = false;
        }
    }

    private async handle_drop(event: any) {
        event.preventDefault();
        if (this.has_access_to_thread && !this.is_loading_thread) {
            this.is_dragging = false;
        }
        if (event.dataTransfer.files.length > 0) {
            [...event.dataTransfer.items].forEach(async (item: DataTransferItem, i) => {
                // If dropped items aren't files, reject them
                await this.do_upload_file(null, item.getAsFile());
            });
        }
    }

    private async open_image_upload() {
        this.enable_image_upload_menu = !this.enable_image_upload_menu;
        this.enable_link_image_menu = false;
        this.enable_file_system_menu = false;
    }

    private async remove_file(index: number) {
        await this.thread_files.splice(index, 1);
    }

    private async listen_for_message(page_id: number, num_range: NumRange) {
        (window as any).instructions = { 'Export': num_range };

        const export_window = window.open(this.file_system_url + page_id);
        this.wait_for_data = true;
    }

    private async open_file_system_upload() {
        this.enable_file_system_menu = !this.enable_file_system_menu;
        this.enable_image_upload_menu = false;
        this.enable_link_image_menu = false;
        this.dashboard_export_id = await ModuleParams.getInstance().getParamValueAsInt(ModuleOselia.OSELIA_EXPORT_DASHBOARD_ID_PARAM_NAME, null, 10000);
        const num_range: NumRange = NumRange.createNew(0, 10, true, true, 0);
        await this.listen_for_message(this.dashboard_export_id, num_range);
    }

    private async open_file_upload() {
        this.enable_image_upload_menu = false;
        this.enable_link_image_menu = false;
        this.enable_file_system_menu = false;
        try {
            const [fileHandle] = await (window as any).showOpenFilePicker({
                multiple: false // Pour permettre la sélection de plusieurs fichiers, mettre à true
            });

            // Upload inspiré de feedback handler
            await this.do_upload_file(fileHandle);
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private async upload_image() {
        try {
            const [fileHandle] = await (window as any).showOpenFilePicker({
                types: [
                    {
                        description: 'Images',
                        accept: {
                            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg']
                        }
                    }
                ],
                excludeAcceptAllOption: true, // Exclure l'option "Tous les fichiers"
                multiple: false // Pour permettre la sélection de plusieurs fichiers, mettre à true
            });
            await this.do_upload_file(fileHandle);
            this.enable_image_upload_menu = false;
        } catch (error) {
            ConsoleHandler.error(error);
        }
    }

    private async handle_hover() {
        alert("hover");
    }

    private async open_link_image() {
        this.enable_link_image_menu = !this.enable_link_image_menu;
    }

    private async upload_link_image() {
        if (!this.link_image_url) {
            return;
        }
        // Do something with the image here

        this.link_image_url = null;
        this.enable_link_image_menu = false;
        this.enable_file_system_menu = false;
    }

    private async cancel_link_image() {
        this.link_image_url = null;
        this.enable_link_image_menu = false;
        this.enable_file_system_menu = false;
    }

    private get_files(): FileVO[] {
        let files = [];
        this.get_files_system().then((res) => {
            files = res;
        }).catch((err) => {
            ConsoleHandler.error(err);
        });

        return files;
    }
    private async get_files_system(): Promise<FileVO[]> {
        const files = await query(FileVO.API_TYPE_ID)
            .set_limit(10)
            .select_vos<FileVO>().then((files_) => {
            return files_;
        });
        return [];
    }

    private async register_thread() {

        // On check qu'on a un thread et un seul
        if (!this.thread) {
            this.current_thread_id = null;
            return;
        }

        // Une fois que tout est chargé, on lance la connexion au websocket si on a realtime de lancé
        if (this.thread.realtime_activated) {
            console.log("realtime_activated", this.thread.realtime_activated);
        } else {
            console.log("realtime_activated", this.thread.realtime_activated);
        }

        // TODO FIXME : de JNE à MLE : à revoir, on peut pas mettre des trucs comme ça en dur et on a le droit d'avoir plusieurs rôles ...
        // const current_user = VueAppController.getInstance().data_user;
        // const current_user_role = await query(UserRoleVO.API_TYPE_ID)
        //     .filter_by_num_eq(field_names<UserRoleVO>().user_id, current_user.id)
        //     .select_vo<UserRoleVO>();
        // if (this.thread.user_id != 2) {
        //     if (current_user.id != this.thread.user_id && current_user_role.role_id == 3) { // == 3 pas sûr mais pas trouvé de static avec le role admin, query du coup ?
        //         // do something here
        //         if (await ModuleOselia.getInstance().send_join_request(current_user.id, this.thread.id) == 'denied') {
        //             return;
        //         }
        //     }
        // }


        await this.unregister_all_vo_event_callbacks();
        this.current_thread_id = this.thread.id;

        await this.set_assistant();
        await this.register_single_vo_updates(GPTAssistantAPIThreadVO.API_TYPE_ID, this.thread.id, reflect<this>().thread);


        // On check qu'on a un assistant et un seul
        if (this.assistant) {
            this.try_set_can_run_assistant(true);
        }
        if (this.send_message_create && this.new_message_text && this.new_message_text.length > 0) {
            await this.send_message();
            this.send_message_create = false;
        }
        // On récupère les contenus du message
        await this.register_vo_updates_on_list(
            GPTAssistantAPIThreadMessageVO.API_TYPE_ID,
            reflect<this>().thread_messages,
            [filter(GPTAssistantAPIThreadMessageVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadMessageVO>().thread_id).by_num_eq(this.thread.id)]
        );

        // On récupère les sub threads
        await this.register_vo_updates_on_list(
            GPTAssistantAPIThreadVO.API_TYPE_ID,
            reflect<this>().sub_threads,
            [filter(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().parent_thread_id).by_num_eq(this.thread.id)]
        );

        // On récupère les appels de fonctions
        await this.register_vo_updates_on_list(
            OseliaRunFunctionCallVO.API_TYPE_ID,
            reflect<this>().function_calls,
            [filter(OseliaRunFunctionCallVO.API_TYPE_ID, field_names<OseliaRunFunctionCallVO>().thread_id).by_num_eq(this.thread.id)]
        );

        // On récupère les données du cache du thread
        await this.register_vo_updates_on_list(
            OseliaThreadCacheVO.API_TYPE_ID,
            reflect<this>().thread_cached_datas,
            [filter(OseliaThreadCacheVO.API_TYPE_ID, field_names<OseliaThreadCacheVO>().thread_id).by_num_eq(this.thread.id)]
        );

        // On récupère les contenus des runs
        await this.register_vo_updates_on_list(
            OseliaRunVO.API_TYPE_ID,
            reflect<this>().oselia_runs,
            [filter(OseliaRunVO.API_TYPE_ID, field_names<OseliaRunVO>().thread_id).by_num_eq(this.thread.id)]
        );

        this.$nextTick(() => {
            this.scroll_to_bottom();
        });
    }

    private try_parse_json(json: string): any {
        if (!json) {
            return {};
        }

        if (typeof json !== 'string') {
            return json;
        }

        if (!(json.startsWith('{') && json.endsWith('}'))) {
            return json;
        }

        try {
            return JSON.parse(json);
        } catch (error) {
            //
        }
        return json;
    }

    private async replay_from_id(function_call_id: number) {
        await ModuleOselia.getInstance().replay_function_call(function_call_id);
    }

    private thread_message_updated() {
        //TODO fixme, on devrait redécaler en bas peut-etre que si on était déjà en bas.
        this.$nextTick(() => {
            this.scroll_to_bottom();
        });
    }

    private async set_thread() {

        // On check qu'on a un thread et un seul
        //  Si on a 1 thread, on peut avancer. Sinon on doit indiquer soit qu'il faut restreindre la query à un thread (>1), soit que le thread est introuvable (0)
        const context_query_select: ContextQueryVO = query(GPTAssistantAPIThreadVO.API_TYPE_ID)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));
        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query_select, this.get_discarded_field_paths);
        context_query_select.query_distinct = true;

        const context_query_count: ContextQueryVO = cloneDeep(context_query_select);

        const nb_threads = await context_query_count.select_count();

        if (!nb_threads) {
            if (this.thread) {
                this.thread = null;
            }
            if (context_query_select.filters.length > 0) {
                for (const f of context_query_select.filters) {
                    if ((f.field_name == field_names<GPTAssistantAPIThreadVO>().id) && (f.param_numeric)) {
                        await ModuleOselia.getInstance().send_join_request(VueAppController.getInstance().data_user.id, f.param_numeric);
                        return;
                    }
                }
            }
            return;
        }

        if (nb_threads > 1) {
            if (this.thread) {
                this.thread = null;
            }
            return;
        }

        // On récupère le thread
        this.thread = await context_query_select.select_vo<GPTAssistantAPIThreadVO>();
    }

    private async set_assistant() {

        // On check qu'on a un assistant et un seul
        //  Si on a 1 assistant, on peut avancer. Sinon on doit indiquer soit qu'il faut restreindre la query à un assistant (>1), soit que le assistant est introuvable (0)
        //  Sauf si on a un current_default_assistant enregistré dans le thread, auquel cas on peut avancer
        const context_query_select: ContextQueryVO = query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
            .using(this.get_dashboard_api_type_ids)
            .add_filters(ContextFilterVOManager.get_context_filters_from_active_field_filters(
                FieldFiltersVOManager.clean_field_filters_for_request(this.get_active_field_filters)
            ));
        FieldValueFilterWidgetManager.add_discarded_field_paths(context_query_select, this.get_discarded_field_paths);

        const context_query_count: ContextQueryVO = cloneDeep(context_query_select);

        const nb_assistants = await context_query_count.select_count();

        if (((!nb_assistants) || (nb_assistants > 1)) && (!!this.thread.current_default_assistant_id)) {
            const default_assistant: GPTAssistantAPIAssistantVO = await query(GPTAssistantAPIAssistantVO.API_TYPE_ID)
                .filter_by_id(this.thread.current_default_assistant_id)
                .select_vo<GPTAssistantAPIAssistantVO>();

            if (!default_assistant) {
                this.try_set_too_many_assistants(nb_assistants > 1);
                return;
            }

            this.assistant = default_assistant;
            this.currently_selected_assistant = this.assistant;
            this.try_set_too_many_assistants(false);
            return;
        }

        if ((!nb_assistants) || (nb_assistants > 1)) {

            // On tente de passer par celui qui est sélectionné
            if (this.currently_selected_assistant) {
                this.assistant = this.currently_selected_assistant;
                this.try_set_too_many_assistants(false);
                return;
            }

            if (nb_assistants > 1) {
                this.try_set_too_many_assistants(true);
            }
            return;
        }

        // On récupère le assistant
        const assistant: GPTAssistantAPIAssistantVO = await context_query_select.select_vo<GPTAssistantAPIAssistantVO>();

        if (!assistant) {
            return;
        }
        this.assistant = assistant;
        this.currently_selected_assistant = this.assistant;
    }

    private async scroll_to_bottom() {
        let thread_container_el: any = this.$parent;

        if ((!thread_container_el) || (!thread_container_el.$refs) || (!thread_container_el.$refs.widget_component_wrapper)) {
            return;
        }

        thread_container_el = thread_container_el.$refs.widget_component_wrapper as HTMLElement;

        if (!thread_container_el) {
            return;
        }

        thread_container_el.scrollTop = thread_container_el.scrollHeight;
    }

    private async send_message() {

        if (!this.new_message_text) {
            return;
        }

        if (!this.thread) {
            return;
        }

        // On accepte de lire les réponses audio
        this.thread_already_read_message_ids_initialised = true;

        const self = this;
        this.assistant_is_busy = true;

        const files = self.thread_files.map((file) => {
            return file[Object.keys(file)[0]];
        });
        try {
            const message = self.new_message_text;
            self.new_message_text = null;
            this.thread_files = []; // empty the thread files
            const gpt_assistant_id = this.assistant?.gpt_assistant_id ? this.assistant.gpt_assistant_id : this.currently_selected_assistant?.gpt_assistant_id;
            if (!gpt_assistant_id) {
                ConsoleHandler.error('No assistant selected');
                return;
            }

            // this.auto_play_new_run_audio_summaries = false;
            await ModuleGPT.getInstance().ask_assistant(
                gpt_assistant_id,
                self.thread.gpt_thread_id,
                null,
                message,
                files,
                VueAppController.getInstance().data_user.id,
                false,
                false,
            );


            // if (!responses || !responses.length) {
            //     throw new Error('No response');
            // }
            /**
             * Il faut changer de technique pour identifier des erreurs de l'API
             * On devrait pas renvoyer les nouveaux messages maintenant, ça n'a plus de sens, mais bien l'état de le requête - réussie ou échouée
             */

            // self.throttle_load_thread();

            // resolve({
            //     body: self.label('OseliaThreadWidgetComponent.send_message.ok'),
            //     config: {
            //         timeout: 10000,
            //         showProgressBar: true,
            //         closeOnClick: false,
            //         pauseOnHover: true,
            //     },
            // });
        } catch (error) {
            ConsoleHandler.error(error);
            this.snotify.error(self.label('OseliaThreadWidgetComponent.send_message.failed'));
            // reject({
            //     body: self.label('OseliaThreadWidgetComponent.send_message.failed'),
            //     config: {
            //         timeout: 10000,
            //         showProgressBar: true,
            //         closeOnClick: false,
            //         pauseOnHover: true,
            //     },
            // });
        }
        self.assistant_is_busy = false;
        // }));
    }


    private async send_create_thread_message() {
        try {
            if (!this.new_message_text) {
                return;
            }

            const new_thread: number = await ModuleOselia.getInstance().create_thread();

            if (new_thread) {
                this.set_active_field_filter({
                    field_id: field_names<GPTAssistantAPIThreadVO>().id,
                    vo_type: GPTAssistantAPIThreadVO.API_TYPE_ID,
                    active_field_filter: filter(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().id).by_id(new_thread)
                });
                return;
            } else {
                return;
            }
        } catch (error) {
            ConsoleHandler.error('error while creating thread:' + error);
        }

    }

    private expand_window() {
        this.is_expanded = !this.is_expanded;
        this.frame.style.width = this.is_expanded ? '640px' : '483px'; // c'est pas des %, c'est des px qu'on doit utiliser (cf scss qui définit la media query)
    }

    private handle_new_message_text_keydown(event: KeyboardEvent) {
        this.$nextTick(() => {
            setTimeout(this.adjustTextareaHeight.bind(this), 10);
        });

        if (this.new_message_text && this.new_message_text.length > 0) {
            if (this.new_message_text.includes("<") && event.key === ">") {
                for (let i = this.new_message_text.length; i >= 0; i--) {
                    if (this.new_message_text[i] === "<") {
                        this.new_message_text = this.new_message_text.replace(this.new_message_text.substring(this.new_message_text.length, i), "");
                        this.snotify.error(this.t('OseliaThreadWidgetComponent.send_message.error_tech_message'));
                    }
                }
                event.preventDefault();
            }
        }

        if (event.key === 'Enter') {
            if (event.shiftKey) {
                // Ajoute une nouvelle ligne
                return;
            } else {
                // Empêche le comportement par défaut
                event.preventDefault();
                // Exécute la fonction send
                if (this.is_creating_thread) {
                    this.send_create_thread_message();
                } else {
                    this.send_message();
                }
            }
        }
    }

    private adjustTextareaHeight() {
        const textarea = this.$refs.new_message_textarea_ref as HTMLTextAreaElement;
        textarea.style.height = 'auto'; // Reset the height
        const scrollHeight = textarea.scrollHeight; // Get the scroll height

        const maxRows = 10;
        const lineHeight = parseInt(window.getComputedStyle(textarea).lineHeight);
        const maxHeight = lineHeight * maxRows;

        textarea.style.height = Math.min(scrollHeight, maxHeight) + 'px';

        this.$nextTick(() => {
            setTimeout(this.scroll_to_bottom.bind(this), 10);
        });
    }

    private try_set_too_many_assistants(too_many_assistants: boolean) {
        if (this.get_too_many_assistants != too_many_assistants) {
            this.set_too_many_assistants(too_many_assistants);
        }
    }

    private try_set_can_run_assistant(can_run_assistant: boolean) {
        if (this.get_can_run_assistant != can_run_assistant) {
            this.set_can_run_assistant(can_run_assistant);
        }
    }

    private async start_recording() {

        if (this.input_voice_is_recording) {
            // Pas vraiment sensé arriver...
            ConsoleHandler.log('Already recording');
            this.input_voice_is_recording = false;
            this.media_recorder.stop();
            return;
        }

        if (this.audio_is_playing && this.current_audio) {
            // Si on est en train de jouer un audio, on l'arrête
            this.current_audio.pause();
            this.current_audio = null;
            this.audio_is_playing = false;
        }

        const audioChunks = [];

        if (!this.input_voice_is_recording) {

            this.input_voice_is_recording = true;

            // Commencer l'enregistrement vocal
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                this.media_recorder = new MediaRecorder(stream);

                if (!this.media_recorder) {
                    return;
                }

                this.media_recorder.start();

                // Collecte des données à chaque fois que des données sont disponibles
                this.media_recorder.ondataavailable = (e) => {
                    audioChunks.push(e.data);
                };

                // Lorsque l'enregistrement est arrêté, créez le fichier audio et jouez-le
                this.media_recorder.onstop = async () => {

                    this.input_voice_is_recording = false;
                    this.input_voice_is_transcribing = true;

                    // Stop toutes les pistes audio pour libérer le micro
                    this.media_recorder.stream.getTracks().forEach(track => track.stop());

                    const blob = new Blob(audioChunks, { type: 'audio/webm' });
                    // Téléverser le fichier une fois qu'il est créé
                    const file = new File([blob], "thread_message_input_voice_" + Dates.now_ms() + "_" + VueAppController.getInstance().data_user.id + ".webm", { type: "audio/webm" });
                    const file_vo = await this.do_upload_file(null, file);

                    if (!file_vo) {
                        this.input_voice_is_transcribing = false;
                        ConsoleHandler.error('Error uploading file');
                        return;
                    }

                    const auto_commit_auto_input = this.auto_commit_auto_input;
                    // this.auto_play_new_run_audio_summaries = auto_commit_auto_input;

                    // // On stocke le dernier run connu avant la demande pour identifier rapidement le nouveau run dont on veut entendre le résumé
                    // if ((this.auto_play_new_run_audio_summaries) && (this.oselia_runs && this.oselia_runs.length > 0)) {
                    //     this.last_run_id_checked_for_audio_summary = Math.max(...this.oselia_runs.map((run) => run.id));
                    // }

                    const gpt_assistant_id = this.assistant?.gpt_assistant_id ? this.assistant.gpt_assistant_id : this.currently_selected_assistant?.gpt_assistant_id;
                    const assistant_id = this.assistant?.id ? this.assistant.id : this.currently_selected_assistant?.id;
                    if (!gpt_assistant_id) {
                        ConsoleHandler.error('No assistant selected');
                        return;
                    }

                    let thread = this.thread;

                    if (!thread) {
                        const new_thread: number = await ModuleOselia.getInstance().create_thread();

                        if (new_thread) {
                            this.set_active_field_filter({
                                field_id: field_names<GPTAssistantAPIThreadVO>().id,
                                vo_type: GPTAssistantAPIThreadVO.API_TYPE_ID,
                                active_field_filter: filter(GPTAssistantAPIThreadVO.API_TYPE_ID, field_names<GPTAssistantAPIThreadVO>().id).by_id(new_thread)
                            });
                        } else {
                            ConsoleHandler.error('Error creating thread');
                            return;
                        }

                        const new_thread_vo: GPTAssistantAPIThreadVO = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                            .filter_by_id(new_thread)
                            .select_vo<GPTAssistantAPIThreadVO>();
                        new_thread_vo.current_oselia_assistant_id = assistant_id;
                        new_thread_vo.current_default_assistant_id = assistant_id;
                        new_thread_vo.user_id = VueAppController.getInstance().data_user.id;
                        await ModuleDAO.getInstance().insertOrUpdateVO(new_thread_vo);

                        if (!new_thread_vo) {
                            ConsoleHandler.error('Error creating thread');
                            return;
                        }

                        thread = new_thread_vo;
                    }

                    // On accepte de lire les réponses audio
                    this.thread_already_read_message_ids_initialised = true;

                    const transcription = await ModuleGPT.getInstance().transcribe_file(
                        file_vo.id,
                        auto_commit_auto_input,
                        gpt_assistant_id,
                        thread.gpt_thread_id,
                        VueAppController.getInstance().data_user.id,
                    );

                    if (auto_commit_auto_input) {
                        this.input_voice_is_transcribing = false;
                        return;
                    }

                    if (!transcription) {
                        this.input_voice_is_transcribing = false;
                        ConsoleHandler.error('Error transcribing file');
                        return;
                    }

                    this.new_message_text = ((this.new_message_text && (this.new_message_text != '')) ?
                        (this.new_message_text + '\n' + transcription) :
                        transcription);

                    this.input_voice_is_transcribing = false;
                };
            } catch (err) {
                console.error("Error accessing microphone", err);
            }
        } else {
            // Arrêter l'enregistrement vocal
            if (this.media_recorder && this.media_recorder.state === "recording") {
                this.media_recorder.stop();  // Cela déclenche l'événement 'onstop' ci-dessus
            }
        }
    }

    private async stop_recording() {
        this.input_voice_is_recording = false;
        this.media_recorder.stop();
    }

    private async do_upload_file(fileHandle?: FileSystemFileHandle, files?: File): Promise<FileVO> {
        let file: File;
        if (files) {
            file = files;
        } else {
            file = await fileHandle.getFile();
        }
        // Upload inspiré de feedback handler
        const formData = new FormData();
        const file_name = 'oselia_file_' + VueAppController.getInstance().data_user.id + '_' + Dates.now() + '.' + file.name.split('.').pop();
        formData.append('file', file, file_name);

        try {

            const new_file_vo_json = await AjaxCacheClientController.getInstance().post(
                null,
                '/ModuleFileServer/upload',
                [FileVO.API_TYPE_ID],
                formData,
                null,
                null,
                false,
                30000);
            return Object.assign(new FileVO(), JSON.parse(new_file_vo_json));
        } catch (error) {
            ConsoleHandler.error('do_upload_file error:' + error);
            return null;
        }
    }

    private async push_tts_file_id(tts_file_id: number) {
        if (this.audio_messages_already_read[tts_file_id]) {
            return;
        }

        this.audio_messages_already_read[tts_file_id] = true;

        if (!this.thread_already_read_message_ids_initialised) {
            return;
        }

        const file = await query(FileVO.API_TYPE_ID)
            .filter_by_id(tts_file_id)
            .select_vo<FileVO>();

        this.audio_message_summary_playlist_paths.push(file.path);
        this.read_next_audio_summary();
    }

    private handleShortcutKeyDown(event: KeyboardEvent) {
        // Si on est focalisé dans un input/textarea ou un élément contentEditable, on ignore
        const target = event.target as HTMLElement;
        const tag = target.tagName.toLowerCase();
        if (
            tag === 'input' ||
            tag === 'textarea' ||
            target.isContentEditable
        ) {
            return;
        }


        if (event.code === 'KeyV' && !this.input_voice_is_recording) {
            this.start_recording();
            event.preventDefault();
        }
    }

    private handleShortcutKeyUp(event: KeyboardEvent) {
        // Même filtre qu’au keydown
        const target = event.target as HTMLElement;
        const tag = target.tagName.toLowerCase();
        if (
            tag === 'input' ||
            tag === 'textarea' ||
            target.isContentEditable
        ) {
            return;
        }


        if (event.code === 'KeyV' && this.input_voice_is_recording) {
            this.stop_recording();
            event.preventDefault();
        }
    }
}