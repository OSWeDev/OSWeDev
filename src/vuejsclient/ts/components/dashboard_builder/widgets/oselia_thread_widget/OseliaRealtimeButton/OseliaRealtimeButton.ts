import Component from "vue-class-component";
import FieldFiltersVO from "../../../../../../../shared/modules/DashboardBuilder/vos/FieldFiltersVO";
import { ModuleTranslatableTextGetter } from "../../../../InlineTranslatableText/TranslatableTextStore";
import VueComponentBase from "../../../../VueComponentBase";
import { ModuleDashboardPageGetter } from "../../../page/DashboardPageStore";
import { ModuleOseliaGetter } from "../OseliaStore";
import { Prop, Watch } from "vue-property-decorator";
import ModuleGPT from "../../../../../../../shared/modules/GPT/ModuleGPT";
import ConsoleHandler from "../../../../../../../shared/tools/ConsoleHandler";
import VueAppController from "../../../../../../VueAppController";
import { cr } from "@fullcalendar/core/internal-common";

@Component({
    template: require('./OseliaRealtimeButton.pug'),
})
export default class OseliaRealtimeButton extends VueComponentBase {


    @ModuleDashboardPageGetter
    private get_active_field_filters: FieldFiltersVO;

    @ModuleOseliaGetter
    private get_show_hidden_messages: boolean;

    @ModuleTranslatableTextGetter
    private get_flat_locale_translations: { [code_text: string]: string };

    @ModuleDashboardPageGetter
    private get_discarded_field_paths: { [vo_type: string]: { [field_id: string]: boolean } };

    @ModuleDashboardPageGetter
    private get_dashboard_api_type_ids: string[];

    @Prop({ default: null })
    private has_access_to_thread: boolean;

    @Prop({ default: null })
    private gpt_thread_id: string | null;

    @Prop({ default: null })
    private cr_html_content: string | null;

    private socket: WebSocket | null = null;
    private audioContext: AudioContext | null = null;

    // VAD via la lib voice-activity-detection
    private vadController: any = null;

    private mediaStream: MediaStream | null = null;
    private scriptProcessor: ScriptProcessorNode  | null = null;

    private isSpeech: boolean = false;
    private audioChunks: Int16Array[] = [];
    private audioChunkInterval: ReturnType<typeof setInterval> | null = null;

    private is_connected_to_realtime: boolean = false;
    private realtime_is_sending: boolean = false;
    private realtime_is_recording: boolean = false;
    private connection_ready: boolean = false;

    private input_voice_is_recording = false;
    private input_voice_is_transcribing = false;
    private media_recorder: MediaRecorder = null;
    private audio_chunks: Blob[] = [];
    private incomingAudioChunks: Uint8Array[] = [];

    private is_in_cr: boolean = false;
    @Watch('connection_ready')
    private on_connection_ready_to_realtime_change() {
        if (this.connection_ready) {
            if (this.is_in_cr) {
                this.send_function_to_realtime();
            }
            this.send_audio();

        } else {
            this.stop_realtime();
        }
    }

    @Watch('cr_html_content')
    private on_cr_html_content_change() {
        if (this.cr_html_content) {
            this.is_in_cr = true;
        } else {
            this.is_in_cr = false;
        }
    }

    /**
   * Initialise l'accès micro.
   */
    private async startVAD() {
        try {
            console.log("Starting VAD...");
            if(!this.is_connected_to_realtime){
                await this.start_realtime(); // Assure que la connexion WebSocket est établie avant tout
            }
            if (this.has_access_to_thread) {
                await this.send_context_to_realtime();
            }
            this.realtime_is_recording = true;
            this.audioChunks = [];

            this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioContext = new AudioContext({ sampleRate: 24000 });

            const sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

            this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

            this.scriptProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
                const audioBuffer = event.inputBuffer.getChannelData(0);
                const pcmData = this.floatTo16BitPCM(audioBuffer);
                this.audioChunks.push(pcmData);
            };

            sourceNode.connect(this.scriptProcessor);
            this.scriptProcessor.connect(this.audioContext.destination);

        } catch (err) {
            ConsoleHandler.log("Erreur accès micro : " + err);
            this.realtime_is_recording = false;
        }
    }

    private async start_realtime() {
        if (!this.is_connected_to_realtime) {

            await ModuleGPT.getInstance().connect_to_realtime_voice(null, this.gpt_thread_id, VueAppController.getInstance().data_user.id);

            const { port } = window.location;
            // Suppose qu'on ouvre un WS sur localhost:<port + 10>
            this.socket = new WebSocket(`ws://localhost:${parseInt(port) + 10}`);
            this.socket.binaryType = 'arraybuffer';

            this.socket.onopen = () => {
                ConsoleHandler.log('WS Opened');
            };

            this.socket.onmessage = (event) => {
                if (typeof event.data === 'string') {
                    const msg = JSON.parse(event.data);

                    if (msg.type === 'ready') {
                        this.connection_ready = true;
                    }
                    else if (msg.type === 'response.audio.delta') {
                        if (msg.delta) {
                            const binaryString = atob(msg.delta);
                            const audioData = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) {
                                audioData[i] = binaryString.charCodeAt(i);
                            }
                            // Stockage du chunk audio
                            this.incomingAudioChunks.push(audioData);
                        }
                    }
                    else if (msg.type === 'response.audio.done') {
                        // Audio complet reçu : concaténation et lecture
                        const fullAudio = this.concatUint8Arrays(this.incomingAudioChunks);
                        this.playAudio(fullAudio);

                        // Réinitialise pour la prochaine réponse
                        this.incomingAudioChunks = [];
                    }
                } else {
                    // Cas improbable : sécurité supplémentaire
                    this.playAudio(new Uint8Array(event.data));
                }
            };

            this.socket.onclose = () => this.close_realtime();
            this.socket.onerror = () => this.close_realtime();

            this.is_connected_to_realtime = true;
        } else {
            this.close_realtime();
        }
    }

    private async stop_realtime() {
        if (!this.realtime_is_recording) return;

        this.realtime_is_recording = false;
        this.realtime_is_sending = true;

        // Arrêt et nettoyage
        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if(this.connection_ready) {
            await this.send_audio();
        }

        this.realtime_is_sending = false;
    }


    private close_realtime() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.is_connected_to_realtime = false;
        this.realtime_is_recording = false;
        if(this.media_recorder) {
            this.media_recorder.stop();
        }
    }

    private async send_context_to_realtime() {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({cr_html_content: this.cr_html_content}));

            this.socket.send(JSON.stringify({
                type: "conversation.item.create",
                item: {
                    type: "message",
                    role: "user",
                    content: [
                        {
                            type: "input_text",
                            text: "Pour ton information, voici le contexte de la conversation : " + "Conversation entre un utilisateur et un assistant virtuel. " // TODO
                        },
                    ]
                },
            }));
        }
    }

    private async send_function_to_realtime() {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                "type": "session.update",
                "session": {
                    "tools": [
                        {
                            "type": "function",
                            "name": "edit_cr_word",
                            "description": "Fonction permettant de modifier les occurences d'un terme dans le compte rendu que nous avons commencé à rédiger.",
                            "parameters": {
                                "type": "object",
                                "properties": {
                                    "term_to_modify": {
                                        "type": "string",
                                        "description": "Le terme que l'on veut modifier.",
                                    },
                                    "new_term": {
                                        "type": "string",
                                        "description": "Le nouveau terme.",
                                    },
                                },
                                "required": ["term_to_modify, new_term"],
                            }
                        }
                    ],
                    "tool_choice": "auto",
                }
            }));
        }
    }

    private async send_audio() {
        // Préparation finale de l'audio
        const fullAudio = this.concatInt16Arrays(this.audioChunks);
        this.audioChunks = [];

        const base64Audio = this.base64ArrayBuffer(fullAudio.buffer as ArrayBuffer);

        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'input_audio_buffer.append',
                audio: base64Audio
            }));

            this.socket.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
            this.socket.send(JSON.stringify({ type: 'response.create' }));
        }
    }

    /**
   * Joue un buffer PCM16 (échantillonnage 24000 Hz) reçu du serveur.
   */
    private playAudio(pcmData: Uint8Array) {
        const audioContext = new AudioContext({ sampleRate: 24000 });
        const numSamples = pcmData.length / 2; // 2 bytes par échantillon PCM16
        const audioBuffer = audioContext.createBuffer(1, numSamples, 24000);
        const channelData = audioBuffer.getChannelData(0);
        const dataView = new DataView(pcmData.buffer);
        for (let i = 0; i < numSamples; i++) {
            channelData[i] = dataView.getInt16(i * 2, true) / 32768; // PCM16 vers Float32 (-1 à +1)
        }
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
    }

    //#endregion

    //#region Utils

    /**
   * Convertit un tableau Float32Array en Int16Array
   */
    private floatTo16BitPCM(input: Float32Array): Int16Array {
        const output = new Int16Array(input.length);
        for (let i = 0; i < input.length; i++) {
            const s = Math.max(-1, Math.min(1, input[i]));
            output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return output;
    }

    /**
   * Concatène plusieurs Int16Array en un seul
   */
    private concatInt16Arrays(chunks: Int16Array[]): Int16Array {
        const totalLength = chunks.reduce((sum, arr) => sum + arr.length, 0);
        const result = new Int16Array(totalLength);

        let offset = 0;
        for (const arr of chunks) {
            result.set(arr, offset);
            offset += arr.length;
        }
        return result;
    }

    /**
   * Encode un ArrayBuffer en base64
   */
    private base64ArrayBuffer(arrayBuffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(arrayBuffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }

    private concatUint8Arrays(chunks: Uint8Array[]): Uint8Array {
        const totalLength = chunks.reduce((sum, arr) => sum + arr.length, 0);
        const result = new Uint8Array(totalLength);

        let offset = 0;
        for (const arr of chunks) {
            result.set(arr, offset);
            offset += arr.length;
        }
        return result;
    }
}