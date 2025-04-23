class VADProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }

    process(inputs) {
        const inputChannel = inputs[0][0];
        if (inputChannel) {
            this.port.postMessage(inputChannel);
        }
        return true;
    }
}

registerProcessor('vad-processor', VADProcessor);
