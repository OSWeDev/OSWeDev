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

export default class OseliaRealtimeController {

    private static instance: OseliaRealtimeController = null;

    private connecting = false;

    private socket: WebSocket | null = null;
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private scriptProcessor: ScriptProcessorNode | null = null;

    private is_connected_to_realtime = false;
    private connection_ready = false;
    private realtime_is_recording = false;

    private incomingAudioChunks: Uint8Array[] = [];

    private call_thread: GPTAssistantAPIThreadVO | null = null;
    private cr_vo: IPlanRDVCR | null = null;
    private in_cr_context: boolean = false;
    private audioCtx: AudioContext = new AudioContext({ sampleRate: 24_000 });
    private currentSrc: AudioBufferSourceNode | null = null;
    private currentItemId: string|null = null;
    private queue: Uint8Array[] = [];
    private isPlaying = false;
    /**  Garantit qu’une seule opération (connect ou disconnect) s’exécute à la fois. */
    private ready: Promise<void> = Promise.resolve();


    public static getInstance() {
        if (!OseliaRealtimeController.instance) {
            OseliaRealtimeController.instance = new OseliaRealtimeController();
        }
        return OseliaRealtimeController.instance;
    }

    public async disconnect_to_realtime() {
        return this.lock(() => this._disconnect_impl());
    }


    public async connect_to_realtime(cr_vo?: IPlanRDVCR) {
        return this.lock(() => this._connect_impl(cr_vo));
    }

    /**  Implémentation interne : connexion */
    private async _connect_impl(cr_vo?: IPlanRDVCR) {

        /* 0)  Si déjà connecté → rien à faire */
        if (this.is_connected_to_realtime && !cr_vo) return;

        /* 1)  S’il y avait une connexion en cours, on la coupe proprement */
        if (this.is_connected_to_realtime) {
            await this._disconnect_impl();              // garanti non réentrant grâce à lock()
        }

        /* 2)  Mémorise le contexte CR */
        this.in_cr_context = !!cr_vo;
        this.cr_vo = cr_vo ?? null;

        /* 3)  (re)crée un thread si besoin */
        if (!this.call_thread) {
            const thread_id = await ModuleOselia.getInstance().create_thread();
            if (!thread_id) throw new Error('Impossible de créer le thread');
            this.call_thread = await query(GPTAssistantAPIThreadVO.API_TYPE_ID)
                .filter_by_id(thread_id)
                .select_vo<GPTAssistantAPIThreadVO>();
            /*  + config assistant… */
        }

        /* 4)  Drapeaux */
        this.connecting = true;
        this.connection_ready = false;

        /* 5)  Connecte au serveur + initialise VAD/micro */
        await this.connect_to_server(this.call_thread.gpt_thread_id);
        if (this.in_cr_context && this.cr_vo) {
            await this.send_cr_to_realtime();
        }
        await this.initRecorder();          // démarre la capture micro

        await VueAppBaseInstanceHolder.instance.vueInstance.$store.dispatch('OseliaStore/set_current_thread', this.call_thread);
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
            await ModuleDAO.getInstance().insertOrUpdateVO(this.call_thread);
        }

        /* 5)  Notifie l’UI */
        await VueAppBaseInstanceHolder.instance.vueInstance.$store.dispatch(
            'OseliaStore/set_current_thread', null
        );
    }

    /**  Petit helper interne */
    private lock<T>(op: () => Promise<T>): Promise<T | void> {
        const next = this.ready.then(op).catch(console.error);
        this.ready = next.then(() => undefined);        // on ne propage pas le résultat
        return next;
    }

    private async startVAD(call_thread?: GPTAssistantAPIThreadVO) {
        if (this.realtime_is_recording) return; // déjà en cours

        if (!this.is_connected_to_realtime) {
            await this.connect_to_server(call_thread?.gpt_thread_id);
        }
        if (this.in_cr_context) {
            if (this.cr_vo) {
                // await this.send_function_to_realtime();
                await this.send_cr_to_realtime();
            }
        }
        await this.initRecorder();
    }

    private async stop_realtime() {
        await this.stopRecorder();
        await this.close_realtime();
    }

    private async connect_to_server(gpt_thread_id: string | null) {
        if (this.is_connected_to_realtime) return;
        try {
            await ModuleGPT.getInstance().connect_to_realtime_voice(
                null,
                gpt_thread_id,
                VueAppController.getInstance().data_user.id
            );

            const { protocol, hostname, port } = window.location;
            const basePort = port ? Number(port) : protocol === 'https:' ? 443 : 80;
            const targetPort = basePort + 10;
            const wsProtocol = protocol === 'https:' ? 'wss' : 'ws';

            this.socket = new WebSocket(`${wsProtocol}://${hostname}:${targetPort}`);
            this.socket.binaryType = 'arraybuffer';

            this.socket.onopen = () => {
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
            this.call_thread!.realtime_activated = true;
            await ModuleDAO.getInstance().insertOrUpdateVO(this.call_thread);
        } catch (err) {
            ConsoleHandler.error('Erreur connexion websocket: ' + err);
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
            await ModuleDAO.getInstance().insertOrUpdateVO(this.call_thread);
        }
        // TO REMOVE
        // this.emitReady(false);
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
                    const audio = new Audio("public/vuejsclient/sound/realtime-activated.wav");
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
            ConsoleHandler.error('Erreur accès micro: ' + err);
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

    private concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
        const total = chunks.reduce((s, a) => s + a.length, 0);
        const res = new Uint8Array(total);
        let off = 0;
        for (const c of chunks) {
            res.set(c, off);
            off += c.length;
        }
        return res;
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

    private emitReady(state: boolean) {
        EventsController.emit_event(EventifyEventInstanceVO.new_event(ModuleOselia.EVENT_OSELIA_REALTIME_READY, state));
    }


    // private async send_function_to_realtime() {
    //     if (this.socket?.readyState === WebSocket.OPEN) {
    //         this.socket.send(JSON.stringify({
    //             "type": "session.update",

    //         }));
    //     }
    // }

    private async send_cr_to_realtime(){
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: "cr_data",
                cr_vo: this.cr_vo,
            }));
        }
    }

    private async mounted() {
        // TO REMOVE
        // const get_oselia_realtime_params = EventifyEventListenerInstanceVO.new_listener(
        //     ModuleOselia.EVENT_OSELIA_REALTIME_SEND_PARAMS,
        //     (event: EventifyEventInstanceVO) => {
        //         const param = event.param;
        //         if (param["cr_vo"]) {
        //             this.in_cr_context = true;
        //             this.cr_vo = param["cr_vo"] as IPlanRDVCR;
        //         } else {
        //             this.in_cr_context = false;
        //             this.cr_vo = null;
        //         }
        //     }
        // );
        // EventsController.register_event_listener(get_oselia_realtime_params);
    }
}
