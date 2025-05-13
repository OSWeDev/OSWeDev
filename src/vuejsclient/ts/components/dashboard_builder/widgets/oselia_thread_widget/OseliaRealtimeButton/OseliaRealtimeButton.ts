/*
 * Service statique de voix temps‑réel (plus de composant Vue).
 * Aucune UI → pas besoin d’être référencé dans un template.
 */

import ModuleGPT from '../../../../../../../shared/modules/GPT/ModuleGPT';
import ConsoleHandler from '../../../../../../../shared/tools/ConsoleHandler';
import VueAppController from '../../../../../../VueAppController';
import IPlanRDVCR from '../../../../../../../shared/modules/ProgramPlan/interfaces/IPlanRDVCR';
import GPTAssistantAPIThreadVO from '../../../../../../../shared/modules/GPT/vos/GPTAssistantAPIThreadVO';
import ModuleDAO from '../../../../../../../shared/modules/DAO/ModuleDAO';
import EventsController from '../../../../../../../shared/modules/Eventify/EventsController';
import EventifyEventConfVO from '../../../../../../../shared/modules/Eventify/vos/EventifyEventConfVO';
import EventifyEventInstanceVO from '../../../../../../../shared/modules/Eventify/vos/EventifyEventInstanceVO';
import ModuleOselia from '../../../../../../../shared/modules/Oselia/ModuleOselia';

export default class OseliaRealtimeButton {
    /* ------------------------------------------------------------------
     *                  ÉTAT   (partagé dans l’onglet)                    */
    private static connecting = false;

    private static socket: WebSocket | null = null;
    private static audioContext: AudioContext | null = null;
    private static mediaStream: MediaStream | null = null;
    private static scriptProcessor: ScriptProcessorNode | null = null;

    private static is_connected_to_realtime = false;
    private static connection_ready = false;
    private static realtime_is_recording = false;

    private static audioChunks: Int16Array[] = [];
    private static incomingAudioChunks: Uint8Array[] = [];

    private static call_thread: GPTAssistantAPIThreadVO | null = null;
    private static cr_html_content: string | null = null;
    private static cr_vo: IPlanRDVCR | null = null;

    /* ------------------------------------------------------------------
     *                    API PUBLIQUE                                     */

    public static async startVAD(call_thread?: GPTAssistantAPIThreadVO) {
        if (this.realtime_is_recording) return; // déjà en cours
        this.call_thread = call_thread ?? null;

        if (!this.is_connected_to_realtime) {
            await this.start_realtime(call_thread?.gpt_thread_id);
        }
        await this.initRecorder();
    }

    public static async stop_realtime() {
        await this.stopRecorder();
        await this.close_realtime();
    }

    /* ------------------------------------------------------------------
     *                    INITIALISATION WS                                */

    private static async start_realtime(gpt_thread_id: string | null) {
        if (this.is_connected_to_realtime || this.connecting) return;
        this.connecting = true;
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
        } catch (err) {
            ConsoleHandler.error('Erreur connexion websocket: ' + err);
            this.connecting = false;
            this.close_realtime.bind(this);
        }
    }

    private static async close_realtime() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) this.socket.close();
        this.socket = null;
        this.is_connected_to_realtime = false;
        this.connection_ready = false;

        if (this.call_thread && this.call_thread.realtime_activated) {
            this.call_thread.realtime_activated = false;
            await ModuleDAO.getInstance().insertOrUpdateVO(this.call_thread);
        }
        await this.emitReady(false);
    }

    /* ------------------------------------------------------------------
     *                    TRAITEMENT MESSAGES WS                           */

    private static async handleSocketMessage(event: MessageEvent) {
        if (typeof event.data === 'string') {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
                case 'ready':
                    this.connection_ready = true;
                    await this.emitReady(true);
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

    /* ------------------------------------------------------------------
     *                       MICRO & AUDIO                                 */

    private static async initRecorder() {
        try {
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new AudioContext({ sampleRate: 24000 });
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.scriptProcessor.onaudioprocess = (ev: AudioProcessingEvent) => {
                const pcm = this.floatTo16BitPCM(ev.inputBuffer.getChannelData(0));
                this.audioChunks.push(pcm);
            };
            source.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.audioContext.destination);

            this.realtime_is_recording = true;
        } catch (err) {
            ConsoleHandler.error('Erreur accès micro: ' + err);
            await this.close_realtime();
        }
    }

    private static async stopRecorder() {
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

    /* ------------------------------------------------------------------
     *                       UTILITAIRE AUDIO                              */

    private static floatTo16BitPCM(input: Float32Array): Int16Array {
        const out = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            out[i] = Math.round(s < 0 ? s * 0x8000 : s * 0x7fff);
        }
        return out;
    }

    private static concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
        const total = chunks.reduce((s, a) => s + a.length, 0);
        const res = new Uint8Array(total);
        let off = 0;
        for (const c of chunks) {
            res.set(c, off);
            off += c.length;
        }
        return res;
    }

    private static base64ToUint8(b64: string): Uint8Array {
        const bin = atob(b64);
        const len = bin.length;
        const out = new Uint8Array(len);
        for (let i = 0; i < len; i++) out[i] = bin.charCodeAt(i);
        return out;
    }

    private static playAudio(pcmData: Uint8Array) {
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
        src.onended = () => ctx.close();
    }

    private static async emitReady(state: boolean) {
        const evt = new EventifyEventConfVO();
        evt.name = ModuleOselia.EVENT_OSELIA_REALTIME_READY;
        await EventsController.emit_event(EventifyEventInstanceVO.instantiate(evt, state));
    }
}
