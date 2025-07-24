import { Watch } from 'vue-property-decorator';
import ModuleDAO from '../../../../../../shared/modules/DAO/ModuleDAO';
import EventsController from '../../../../../../shared/modules/Eventify/EventsController';
import EventifyEventInstanceVO from '../../../../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import EventifyEventListenerInstanceVO from '../../../../../../shared/modules/Eventify/vos/EventifyEventListenerInstanceVO';
import ModuleGPT from '../../../../../../shared/modules/GPT/ModuleGPT';
import GPTAssistantAPIThreadVO from '../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ModuleOselia from '../../../../../../shared/modules/Oselia/ModuleOselia';
import IPlanRDVCR from '../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import ConsoleHandler from '../../../../../../shared/tools/ConsoleHandler';
import VueAppController from '../../../../../VueAppController';
import { query } from '../../../../../../shared/modules/ContextFilter/vos/ContextQueryVO';
import GPTAssistantAPIAssistantVO from '../../../../../../shared/modules/GPT/vos/GPTAssistantAPIAssistantVO';
import { field_names, reflect } from '../../../../../../shared/tools/ObjectHandler';
import VueAppBaseInstanceHolder from '../../../../../VueAppBaseInstanceHolder';
import GPTRealtimeAPISessionVO from '../../../../../../shared/modules/GPT/vos/GPTRealtimeAPISessionVO';
import ICheckListItem from '../../../../../../shared/modules/CheckList/interfaces/ICheckListItem';
import DatatableField from '../../../../../../shared/modules/DAO/vos/datatable/DatatableField';
import { ModuleOseliaGetter } from './OseliaStore';
import VueComponentBase from '../../../VueComponentBase';
import IDistantVOBase from '../../../../../../shared/modules/IDistantVOBase';
import OseliaRunTemplateVO from '../../../../../../shared/modules/Oselia/vos/OseliaRunTemplateVO';

export default class OseliaRealtimeController extends VueComponentBase {
    private static instance: OseliaRealtimeController = null;

    @ModuleOseliaGetter public get_current_thread!: GPTAssistantAPIThreadVO | null;

    public session_overload_object: GPTRealtimeAPISessionVO | null = null;

    private connecting = false;
    private socket: WebSocket | null = null;
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private scriptProcessor: ScriptProcessorNode | null = null;

    private is_connected_to_realtime = false;
    private connection_ready = false;
    private realtime_is_recording = false;
    private oselia_run_template: OseliaRunTemplateVO | null = null;
    private incomingAudioChunks: Uint8Array[] = [];
    private map_cache_vo: { [cache_key: string]: IDistantVOBase | null } | null = null;

    private call_thread: GPTAssistantAPIThreadVO | null = null;
    // private cr_vo: IPlanRDVCR | null = null;
    // private in_cr_context: boolean = false;
    // private in_prime_context: boolean = false;
    // private prime_object: ICheckListItem = null;
    private audioCtx: AudioContext = new AudioContext({ sampleRate: 44_100  });
    private currentSrc: AudioBufferSourceNode | null = null;
    private currentItemId: string|null = null;
    private queue: Uint8Array[] = [];
    private isPlaying = false;
    private session_id: number | null = null;
    /**  Garantit qu’une seule opération (connect ou disconnect) s’exécute à la fois. */
    private ready: Promise<void> = Promise.resolve();
    private source: string = null;
    private vo: IDistantVOBase | null = null;

    public static getInstance() {
        if (!OseliaRealtimeController.instance) {
            OseliaRealtimeController.instance = new OseliaRealtimeController();
        }
        return OseliaRealtimeController.instance;
    }

    @Watch(reflect<OseliaRealtimeController>().get_current_thread, { immediate: true })
    private async onCurrentThreadChange(new_thread: GPTAssistantAPIThreadVO | null) {
        // Si on n'est pas connecté au realtime ou qu'on est en cours de connexion, pas besoin de faire quoi que ce soit
        if (!this.is_connected_to_realtime || this.connecting) {
            return;
        }

        // Si le thread actuel change pendant une session realtime active,
        // on met à jour notre référence pour maintenir la synchronisation
        if (new_thread && new_thread.id !== this.call_thread?.id) {
            ConsoleHandler.log('OseliaRealtimeController: Thread actuel changé pendant session realtime, mise à jour:', new_thread.id);
            this.call_thread = new_thread;
        }
    }

    public async disconnect_to_realtime() {
        return this.lock(() => this._disconnect_impl());
    }


    public async connect_to_realtime(oselia_run_template_name: string, prompt?: string, map_cache_vo?: {[cache_key: string] : IDistantVOBase | null}): Promise<void> {
        return this.lock(() => this._connect_impl(oselia_run_template_name, prompt, map_cache_vo));
    }

    /**  Implémentation interne : connexion */
    private async _connect_impl(oselia_run_template_name:string, prompt?:string, map_cache_vo?: {[cache_key: string] : IDistantVOBase | null}): Promise<void> {

        /* 0)  Si déjà connecté → rien à faire */
        if (this.is_connected_to_realtime && !map_cache_vo) return;

        /* 1)  S’il y avait une connexion en cours, on la coupe proprement */
        if (this.is_connected_to_realtime) {
            await this._disconnect_impl();              // garanti non réentrant grâce à lock()
        }

        this.map_cache_vo = map_cache_vo;

        /* 2)  On récupère le template de run */
        this.oselia_run_template = await query(OseliaRunTemplateVO.API_TYPE_ID)
            .filter_by_text_eq(field_names<OseliaRunTemplateVO>().name, oselia_run_template_name)
            .select_vo<OseliaRunTemplateVO>();

        if (!this.oselia_run_template) {
            throw new Error(`OseliaRealtimeController : Le template de run "${oselia_run_template_name}" n'existe pas.`);
        }
        /* 3) On ne met plus initial_content_text car on crée maintenant un message technique dédié */
        // this.oselia_run_template.initial_content_text = prompt || '';

        /* 3)  (re)crée un thread si besoin, ou utilise le thread courant */
        let current_thread: GPTAssistantAPIThreadVO | null = null;
        if(!this.call_thread) {
            current_thread = this.get_current_thread;
        } else {
            ConsoleHandler.log('OseliaRealtimeController: Utilisation du thread existant:', this.call_thread.id);
            current_thread = this.call_thread;
        }
        if (current_thread) {
            // Utiliser le thread existant si disponible (usage depuis thread widget)
            // Mais d'abord le recharger depuis la base pour avoir la version la plus récente
            ConsoleHandler.log('OseliaRealtimeController: Rechargement du thread existant:', current_thread.id);
            this.call_thread = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                .filter_by_id(current_thread.id)
                .select_vo<GPTAssistantAPIThreadVO>();
            if (!this.call_thread) {
                throw new Error('OseliaRealtimeController : Impossible de recharger le thread existant');
            }
            ConsoleHandler.log('OseliaRealtimeController: Thread existant rechargé avec succès:', this.call_thread.id);
        } else {
            // Créer un nouveau thread si aucun thread courant (usage depuis nouveau contexte)
            const thread_id = await ModuleOselia.getInstance().create_thread();
            if (!thread_id) throw new Error('OseliaRealtimeController : Impossible de créer le thread');
            this.call_thread = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                .filter_by_id(thread_id)
                .select_vo<GPTAssistantAPIThreadVO>();
            if (!this.call_thread) throw new Error('OseliaRealtimeController : Impossible de récupérer le thread');
            ConsoleHandler.log('OseliaRealtimeController: Nouveau thread créé:', this.call_thread.id);
        }

        /* 4) On met à jour l'assistant du thread selon le template (même si le thread existe déjà) */
        if (this.oselia_run_template.assistant_id) {
            this.call_thread.current_oselia_assistant_id = this.oselia_run_template.assistant_id;
            this.call_thread.current_default_assistant_id = this.oselia_run_template.assistant_id;
            // On marque ce thread comme étant en cours d'utilisation pour realtime
            this.call_thread.realtime_activated = true;

            // Utiliser une méthode avec retry pour éviter les conflits de concurrence
            await this.updateThreadWithRetry(this.call_thread);
        }

        /* 5) On met le vo dans le cache du thread */
        if (map_cache_vo && this.call_thread) {
            await ModuleOselia.getInstance().set_cache_value(this.call_thread, Object.keys(map_cache_vo)[0], JSON.stringify(Object.values(map_cache_vo)[0]), this.call_thread.id);
        }

        /* 5.5) Si on a un prompt, on crée un message technique (système) sans déclencher l'assistant */
        if (prompt && prompt.trim()) {
            await this.create_technical_message(prompt);
            // Petit délai pour s'assurer que la synchronisation s'est bien faite
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        /* 6)  Met à jour le store AVANT de marquer la connexion comme active pour éviter les conflits avec le watcher */
        await VueAppBaseInstanceHolder.instance.vueInstance.$store.dispatch('OseliaStore/set_current_thread', this.call_thread);

        /* 7)  Drapeaux */
        this.connecting = true;
        this.connection_ready = false;

        /* 8)  Connecte au serveur + initialise VAD/micro */
        await this.connect_to_server(this.call_thread.gpt_thread_id, prompt);

        await this.initRecorder();          // démarre la capture micro

        this.connecting = false;
    }

    /**  Implémentation interne : coupure */
    private async _disconnect_impl() {

        /* 0)  Rien à faire si déjà coupé */
        if (!this.is_connected_to_realtime && !this.connecting) return;

        /* 1)  Stoppe proprement le micro et l’audio */
        await this.stopRecorder();          // libère micro & scriptProcessor
        this.stopPlaying();                 // arrête la voix en cours
        await this.audioCtx.close().catch(()=>{});
        this.audioCtx = new AudioContext({ sampleRate: 24_000 });
        /* 2)  Ferme le WebSocket si encore ouvert */
        if (this.socket) {
            if (this.socket.readyState === WebSocket.OPEN) {
                const p = new Promise<void>(res => this.socket!.onclose = () => res());
                this.socket.close();
                await p;                     // attend réellement la fermeture
            }
            this.socket = null;
        }

        /* 3)  Reset complet des états internes */
        this.is_connected_to_realtime = false;
        this.connection_ready = false;
        this.connecting = false;
        this.queue = [];
        this.currentSrc = null;

        /* 4)  Sauve la VO si besoin */
        if (this.call_thread && this.call_thread.realtime_activated) {
            this.call_thread.realtime_activated = false;
            await this.updateThreadWithRetry(this.call_thread);
        }

        /* 5)  Notifie l'UI */
        // On maintient le thread dans le store pour la prochaine connexion
        // Le thread reste disponible même après déconnexion
        if (this.call_thread) {
            await VueAppBaseInstanceHolder.instance.vueInstance.$store.dispatch(
                'OseliaStore/set_current_thread',
                this.call_thread
            );
        }

        const audio = new Audio("public/vuejsclient/sound/realtime-deactivated.mp3");
        audio.play().catch(err => console.error("Erreur de lecture :", err));
    }

    /**
     * Crée un message technique (système) dans le thread sans déclencher l'assistant
     */
    private async create_technical_message(prompt: string): Promise<void> {
        if (!this.call_thread || !prompt?.trim()) {
            return;
        }

        // Appel direct à la nouvelle API pour créer un message technique
        await ModuleGPT.getInstance().create_technical_message(
            this.call_thread.gpt_thread_id,
            prompt,
            VueAppController.getInstance().data_user.id
        );
    }

    /**  Petit helper interne */
    private lock<T>(op: () => Promise<T>): Promise<T | void> {
        const next = this.ready.then(op).catch(console.error);
        this.ready = next.then(() => undefined);        // on ne propage pas le résultat
        return next;
    }

    /**
     * Met à jour un thread avec retry automatique en cas de conflit de concurrence
     * @param thread_vo Le thread à mettre à jour
     * @param maxRetries Nombre maximum de tentatives (par défaut 3)
     * @param delayMs Délai entre les tentatives en ms (par défaut 500ms)
     */
    private async updateThreadWithRetry(
        thread_vo: GPTAssistantAPIThreadVO,
        maxRetries: number = 3,
        delayMs: number = 500
    ): Promise<void> {
        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await ModuleDAO.getInstance().insertOrUpdateVO(thread_vo);
                ConsoleHandler.log(`OseliaRealtimeController: Thread ${thread_vo.id} mis à jour avec succès (tentative ${attempt})`);
                return; // Succès, on sort de la boucle

            } catch (error) {
                lastError = error;
                const errorMsg = error?.message || String(error);

                if (errorMsg.includes('The thread was modified by another request') ||
                    errorMsg.includes('concurrent_modification') ||
                    errorMsg.includes('409')) {

                    ConsoleHandler.log(`OseliaRealtimeController: Conflit de concurrence détecté (tentative ${attempt}/${maxRetries}), retry dans ${delayMs}ms...`);

                    if (attempt < maxRetries) {
                        // Attendre avant la prochaine tentative
                        await new Promise(resolve => setTimeout(resolve, delayMs));

                        // Recharger le thread depuis la base pour avoir la version la plus récente
                        try {
                            const fresh_thread = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                                .filter_by_id(thread_vo.id)
                                .select_vo<GPTAssistantAPIThreadVO>();

                            if (fresh_thread) {
                                // Appliquer nos modifications sur la version fraîche
                                fresh_thread.current_oselia_assistant_id = thread_vo.current_oselia_assistant_id;
                                fresh_thread.current_default_assistant_id = thread_vo.current_default_assistant_id;
                                fresh_thread.realtime_activated = thread_vo.realtime_activated;
                                thread_vo = fresh_thread;
                                ConsoleHandler.log(`OseliaRealtimeController: Thread rechargé pour la tentative ${attempt + 1}`);
                            }
                        } catch (reloadError) {
                            ConsoleHandler.error(`OseliaRealtimeController: Erreur lors du rechargement du thread: ${reloadError}`);
                        }

                        // Augmenter le délai pour la prochaine tentative (backoff exponentiel)
                        delayMs = Math.min(delayMs * 1.5, 2000);
                    }
                } else {
                    // Erreur non liée à la concurrence, on ne retry pas
                    ConsoleHandler.error(`OseliaRealtimeController: Erreur non-concurrentielle lors de la mise à jour du thread: ${error}`);
                    throw error;
                }
            }
        }

        // Si on arrive ici, toutes les tentatives ont échoué
        ConsoleHandler.error(`OseliaRealtimeController: Échec de la mise à jour du thread après ${maxRetries} tentatives. Dernière erreur: ${lastError}`);
        throw new Error(`Impossible de mettre à jour le thread après ${maxRetries} tentatives: ${lastError}`);
    }

    private async connect_to_server(gpt_thread_id: string | null, prompt?: string) {
        if (this.is_connected_to_realtime) return;
        try {
            if (this.session_overload_object) {
                this.session_id = this.session_overload_object.id;
            }

            await ModuleGPT.getInstance().connect_to_realtime_voice(
                this.session_id ? String(this.session_id) : null,
                gpt_thread_id,
                String(this.call_thread.id),
                VueAppController.getInstance().data_user.id,
                this.oselia_run_template,
                this.map_cache_vo ? Object.keys(this.map_cache_vo)[0] : null,
                prompt // Passer le prompt comme message technique
            );

            const { protocol, hostname, port } = window.location;
            const basePort = port ? Number(port) : protocol === 'https:' ? 443 : 80;
            const targetPort = basePort + 10;
            const wsProtocol = protocol === 'https:' ? 'wss' : 'ws';

            this.socket = new WebSocket(`${wsProtocol}://${hostname}:${targetPort}`);
            this.socket.binaryType = 'arraybuffer';

            this.socket.onopen = async () => {
                ConsoleHandler.log('WS Opened');
                this.connecting = false;
                this.socket!.send(JSON.stringify({ conversation_id: gpt_thread_id }));
            };
            this.socket.onmessage = this.handleSocketMessage.bind(this);
            this.socket.onclose = () => {
                this.connecting=false;
                this.close_realtime.bind(this);
            };
            this.socket.onerror = () => {
                this.connecting=false;
                this.close_realtime.bind(this);
            };

            this.is_connected_to_realtime = true;
            // realtime_activated est déjà défini plus tôt dans _connect_impl
            await this.updateThreadWithRetry(this.call_thread);
        } catch (err) {
            ConsoleHandler.error('OseliaRealtimeController : Erreur connexion websocket: ' + err);
            this.connecting = false;
            this.close_realtime.bind(this);
        }
    }

    private async close_realtime() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) this.socket.close();
        this.socket = null;
        this.is_connected_to_realtime = false;
        this.connection_ready = false;
        if (this.call_thread && this.call_thread.realtime_activated) {
            this.call_thread.realtime_activated = false;
            await this.updateThreadWithRetry(this.call_thread);

            // Note: Le run realtime spécifique à cette session est automatiquement fermé
            // côté serveur lors de la fermeture du WebSocket OpenAI (voir GPTAssistantAPIServerController)
        }
        const audio = new Audio("public/vuejsclient/sound/realtime-deactivated.mp3");
        audio.play().catch(err => console.error("Erreur de lecture :", err));
    }


    private handleSocketMessage(event: MessageEvent) {
        if (typeof event.data === 'string') {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
                case 'output_audio_buffer':               // si tu gardes ce format
                    if (msg.audio) this.enqueueAndPlay(this.base64ToUint8(msg.audio));
                    break;
                case 'response.audio.delta':
                    if (msg.delta) this.enqueueAndPlay(this.base64ToUint8(msg.delta));
                    break;
                    // --- fin du flux pour un item --------------------
                case 'output_audio_buffer.stopped':
                case 'response.audio.done':
                    break;
                    // --- coupure forcée si l'utilisateur reparle -----
                case 'stop_audio_playback':
                    this.stopPlaying();
                    this.queue = [];
                    break;
                case 'oselia_listening':
                    // On joue un son de "reconnaissance vocale"
                    const audio = new Audio("public/vuejsclient/sound/realtime-activated.mp3");
                    audio.play().catch(err => console.error("Erreur de lecture :", err));
                    this.connection_ready = true;
                    break;
                // case 'response.audio.delta':
                //     if (msg.delta) this.incomingAudioChunks.push(this.base64ToUint8(msg.delta));
                //     break;
                default:
                    break;
            }
        } else {
            this.enqueueAndPlay(new Uint8Array(event.data));
        }
    }

    private enqueueAndPlay(pcm: Uint8Array) {
        this.queue.push(pcm);
        if (!this.isPlaying) this.playNext();
    }

    private playNext() {
        if (this.queue.length === 0) return;
        const pcm = this.queue.shift()!;
        this.isPlaying = true;
        this.playAudio(pcm, () => {
            this.isPlaying = false;
            this.playNext();
        });
    }

    private async initRecorder() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
            this.audioContext = new AudioContext({ sampleRate: 24000 });
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.scriptProcessor = this.audioContext.createScriptProcessor(256, 1, 1);

            this.scriptProcessor.onaudioprocess = (ev: AudioProcessingEvent) => {
                const pcm = this.floatTo16BitPCM(ev.inputBuffer.getChannelData(0));
                if (this.socket?.readyState === WebSocket.OPEN) {
                    this.sendAudioFrame(pcm);
                }
            };
            source.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.audioContext.destination);

            this.realtime_is_recording = true;
        } catch (err) {
            ConsoleHandler.error('OseliaRealtimeController : Erreur accès micro: ' + err);
            await this.close_realtime();
        }
    }
    private sendAudioFrame(pcm: Int16Array) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return;
        }

        this.socket.send(JSON.stringify({
            type: 'input_audio_buffer.append',
            audio: btoa(String.fromCharCode(...new Uint8Array(pcm.buffer))),
        }));
    }
    private async stopRecorder() {
        this.realtime_is_recording = false;
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor = null;
        }
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach((t) => t.stop());
            this.mediaStream = null;
        }
    }



    private floatTo16BitPCM(input: Float32Array): Int16Array {
        const out = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            out[i] = Math.round(s < 0 ? s * 0x8000 : s * 0x7fff);
        }
        return out;
    }

    private base64ToUint8(b64: string): Uint8Array {
        const bin = atob(b64);
        const len = bin.length;
        const out = new Uint8Array(len);
        for (let i = 0; i < len; i++) out[i] = bin.charCodeAt(i);
        return out;
    }

    private playAudio(pcmData: Uint8Array, onEnded?: () => void) {
        // stop la lecture courante sans fermer le contexte
        this.stopPlaying();

        if (!pcmData || pcmData.byteLength < 2) return;
        this.isPlaying  = true;

        /* 1)  Assure-toi que le contexte est actif */
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(console.error);
        }

        /* 2)  Crée le buffer */
        const sampleCount = pcmData.byteLength >> 1;                    // /2
        const buf = this.audioCtx.createBuffer(1, sampleCount, 24_000);
        const chan = buf.getChannelData(0);
        const dv = new DataView(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength);

        for (let i = 0; i < sampleCount; i++) {
            chan[i] = dv.getInt16(i << 1, true) / 0x8000;               // ↔  i*2
        }

        /* 3)  Joue le buffer */
        this.currentSrc = this.audioCtx.createBufferSource();
        this.currentSrc.buffer = buf;
        this.currentSrc.connect(this.audioCtx.destination);
        this.currentSrc.start();

        this.currentSrc.onended = () => {
            this.isPlaying = false;
            this.currentSrc = null;
            onEnded?.();
        };
    }

    private stopPlaying() {
        if (this.currentSrc) {
            try { this.currentSrc.stop(); } catch (_) { /* empty */ }
            this.currentSrc = null;
        }
        this.isPlaying = false;
    }
}
