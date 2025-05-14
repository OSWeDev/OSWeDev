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
    private is_playing: boolean = false;


    public static getInstance() {
        if (!OseliaRealtimeController.instance) {
            OseliaRealtimeController.instance = new OseliaRealtimeController();
        }
        return OseliaRealtimeController.instance;
    }

    public async disconnect_to_realtime() {
        if (this.is_connected_to_realtime) {
            await this.stop_realtime();
        }
        if (this.call_thread) {
            this.call_thread.realtime_activated = false;
            await ModuleDAO.getInstance().insertOrUpdateVO(this.call_thread);
        }
        this.call_thread = null;
        this.is_connected_to_realtime = false;
        this.connection_ready = false;
        await VueAppBaseInstanceHolder.instance.vueInstance.$store.dispatch('OseliaStore/set_current_thread', null);
    }

    public async connect_to_realtime(cr_vo?: IPlanRDVCR) {
        if(cr_vo) {
            this.in_cr_context = true;
            this.cr_vo = cr_vo;
        } else {
            this.in_cr_context = false;
            this.cr_vo = null;
        }
        // On a déjà lancé sur un autre CR, on met à jour le thread
        if (this.is_connected_to_realtime) {
            await this.disconnect_to_realtime();
        }
        this.connecting = true;
        if (!this.call_thread) {
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

                this.call_thread = new_thread;
                await this.startVAD(new_thread);
            }
        } else {
            await this.startVAD(this.call_thread);
        }

        await VueAppBaseInstanceHolder.instance.vueInstance.$store.dispatch('OseliaStore/set_current_thread', this.call_thread);
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
                case 'ready':
                    this.connection_ready = true;
                    // TO REMOVE
                    // this.emitReady(true);
                    break;
                case 'response.audio.delta':
                    if (msg.delta) this.incomingAudioChunks.push(this.base64ToUint8(msg.delta));
                    break;
                case 'response.audio.done':
                    this.playAudio(this.concatUint8Arrays(this.incomingAudioChunks));
                    this.incomingAudioChunks = [];
                    break;
                case 'session.updated':
                    break;
                default:
                    break;
            }
        } else {
            this.playAudio(new Uint8Array(event.data));
        }
    }


    private async initRecorder() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
            this.audioContext = new AudioContext({ sampleRate: 24000 });
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.scriptProcessor = this.audioContext.createScriptProcessor(1024, 1, 1);

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
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN || !this.connection_ready || this.is_playing) {
            return; // pas encore prêt
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

    private playAudio(pcmData: Uint8Array) {
        this.is_playing = true;
        const ctx = new AudioContext({ sampleRate: 24000 });
        const samples = pcmData.length / 2;
        const buf = ctx.createBuffer(1, samples, 24000);
        const chan = buf.getChannelData(0);
        const dv = new DataView(pcmData.buffer);
        for (let i = 0; i < samples; i++) chan[i] = dv.getInt16(i * 2, true) / 32768;
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start();
        src.onended = () => {
            this.is_playing = false;
            ctx.close();
        };
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
