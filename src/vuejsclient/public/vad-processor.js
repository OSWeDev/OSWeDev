class VADProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.threshold = 0.2; // Ajuste selon micro
        this.speechFrames = 5;
        this.silenceFrames = 0;
        this.isSpeech = false;
    }

    process(inputs) {
        const inputChannel = inputs[0][0];
        if (inputChannel) {
            let sum = 0;
            for (let i = 0; i < inputChannel.length; i++) {
                sum += inputChannel[i] * inputChannel[i];
            }
            const rms = Math.sqrt(sum / inputChannel.length);

            if (rms > this.threshold) {
                this.speechFrames++;
                this.silenceFrames = 0;

                if (!this.isSpeech && this.speechFrames >= 3) {
                    this.isSpeech = true;
                    this.port.postMessage({ event: 'voice_start' });
                    this.speechFrames = 0; // Reset après déclenchement
                }
            } else {
                this.silenceFrames++;
                this.speechFrames = 0; // Réinitialise immédiatement speechFrames

                if (this.isSpeech && this.silenceFrames >= 5) {
                    this.isSpeech = false;
                    this.silenceFrames = 0; // Reset après déclenchement
                    this.port.postMessage({ event: 'voice_stop' });
                }
            }

            if (this.isSpeech) {
                this.port.postMessage({ event: 'audio', audio: inputChannel });
            }
        }

        return true;
    }
}

registerProcessor('vad-processor', VADProcessor);
