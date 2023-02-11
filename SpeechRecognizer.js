const { Readable, Writable } = require('stream');
const { Buffer } = require('node:buffer');
const { clearTimeout } = require('timers');


/*
class SpeechRecognizer {
  #currentSegmentLength = 0;
  #currentText = "";
  #keywordMap = new Map();

  constructor() { }

  onWord(keyword, callback) {
    this.#keywordMap.set(keyword, callback)
  }

  processText(text) {
    this.#currentSegmentLength = 0;

  }

  processPartialText(text) {
    let textToCheck = "";

    if (this.#currentSegmentLength == text.length && text == this.#currentText) return;

    this.#currentText = text;

    if (this.#currentSegmentLength < text.length) {
      textToCheck = text.substring(this.#currentSegmentLength);
      console.log(textToCheck);
    } else if (this.#currentSegmentLength > text.length) {
      // Text has been reset.
      this.#currentSegmentLength = text.length;
      textToCheck = text;
    }
    for (const [word, callback] of this.#keywordMap) {
      if (textToCheck.includes(word)) {
        this.#currentSegmentLength = text.length;
        callback();
        return;
      }
    }
  }

}
*/
class SilentStream extends Readable {

  constructor() {
    super();
    let silence = this.generateSilence(640);
    this.push(silence)
  }

  currentTimeout = null;
  _read() {
    if (this.currentTimeout != null) clearTimeout(this.currentTimeout);
    let silentStream = this;
    this.currentTimeout = setTimeout(function () {
      let silence = silentStream.generateSilence(640);
      silentStream.push(silence)
    }, 20);
  }

  generateSilence(size) {
    var bitDepth = 16;
    var byteDepth = 2;
    var frameSize = 2;
    var sampleBuf = new Buffer.alloc(Math.floor(size / frameSize) * frameSize);

    for (var i = 0; i < sampleBuf.length; i += byteDepth) {
      sampleBuf.slice(i).writeInt16LE(0, 0);
      //['writeInt' + bitDepth + 'LE'](0, 0);
    }
    return sampleBuf;
  }
}

class SilenceFillerInput extends Writable {
  constructor(args) {
    super(args);
    if (args.channels !== 1 && args.channels !== 2) {
      args.channels = 2;
    }
    if (args.sampleRate < 1) {
      args.sampleRate = 44100;
    }
    if (args.volume < 0 || args.volume > 100) {
      args.volume = 100;
    }
    if (args.channels === 1) {
      this.readMono = this.read;
    }
    if (args.channels === 2) {
      this.readStereo = this.read;
    }
    this.buffer = new Buffer.alloc(0);
    if (args.bitDepth === 8) {
      this.readSample = this.buffer.readInt8;
      this.writeSample = this.buffer.writeInt8;
      this.sampleByteLength = 1;
    }
    else if (args.bitDepth === 32) {
      this.readSample = this.buffer.readInt32LE;
      this.writeSample = this.buffer.writeInt32LE;
      this.sampleByteLength = 4;
    }
    else {
      args.bitDepth = 16;
      this.readSample = this.buffer.readInt16LE;
      this.writeSample = this.buffer.writeInt16LE;
      this.sampleByteLength = 2;
    }
    this.args = args;
    this.hasData = false;
    this.lastClearTime = new Date().getTime();
  }
  _write(chunk, encoding, next) {
    if (!this.hasData) {
      this.hasData = true;
    }
    this.buffer = Buffer.concat([this.buffer, chunk]);
    next()
  }
  setMixer(mixer) {
    this.mixer = mixer;
  }

  availableSamples(length) {
    length = length || this.buffer.length;
    return Math.floor(length / ((this.args.bitDepth / 8) * this.args.channels));
  }

  read(samples) {
    let bytes = samples * (this.args.bitDepth / 8) * this.args.channels;
    if (this.buffer.length < bytes) {
      bytes = this.buffer.length;
    }
    let sample = this.buffer.slice(0, bytes);
    this.buffer = this.buffer.slice(bytes);
    for (let i = 0; i < sample.length; i += 2) {
      sample.writeInt16LE(Math.floor(this.args.volume * sample.readInt16LE(i) / 100), i);
    }
    return sample;
  }

  readMono(samples) {
    let stereoBuffer = this.read(samples);
    let monoBuffer = new Buffer(stereoBuffer.length / 2);
    let availableSamples = this.availableSamples(stereoBuffer.length);
    for (let i = 0; i < availableSamples; i++) {
      let l = this.readSample.call(stereoBuffer, i * this.sampleByteLength * 2);
      let r = this.readSample.call(stereoBuffer, (i * this.sampleByteLength * 2) + this.sampleByteLength);
      this.writeSample.call(monoBuffer, Math.floor((l + r) / 2), i * this.sampleByteLength);
    }
    return monoBuffer;
  }
}

class SilenceFiller extends Readable {
  constructor(args) {
    super(args);
    this.needReadable = true;
    this._timer = null;
    this.sampleRate = 16000
    let buffer = new Buffer.alloc(this.readableHighWaterMark);
    this.bitDepth = 16;
    this.readSample = buffer.readInt16LE;
    this.writeSample = buffer.writeInt16LE;
    this.sampleByteLength = 2;
    this.args = args;
    this.inputs = [];
    this.isReading = false;
    this.interval = null;
    this.mixerBuffer = new Buffer.alloc(this.readableHighWaterMark);
  }

  generateSilence(size) {
    var bitDepth = 16;
    var byteDepth = 2;
    var frameSize = 2;
    var sampleBuf = new Buffer.alloc(Math.floor(size / frameSize) * frameSize);

    for (var i = 0; i < sampleBuf.length; i += byteDepth) {
      sampleBuf.slice(i).writeInt16LE(0, 0);
      //['writeInt' + bitDepth + 'LE'](0, 0);
    }
    return sampleBuf;
  }

  input(args, channel) {
    let input = new SilenceFillerInput();
    this.addInput(input, channel);
    return input;
  }
  addInput(input, channel) {
    input.setMixer(this);
    this.inputs[channel || this.inputs.length] = input;
  }
  start() {
    // Every 20ms write 640 bytes
    let mixer = this;
    this.interval = setInterval(function () {
      let tempBuffer = new Buffer.alloc(8000);
      tempBuffer.fill(0);

      //let silence = mixer.generateSilence(4000);
      mixer.inputs.forEach((input) => {
        let inputSamples = Math.min(input.availableSamples(), 4000);
        if (input.hasData) {
          let inputBuffer = mixer.args.channels === 1 ? input.readMono(inputSamples) : input.readStereo(inputSamples);
          for (let i = 0; i < inputSamples * mixer.args.channels; i++) {
            let inSample = mixer.readSample.call(inputBuffer, i * mixer.sampleByteLength)
            let sample = mixer.readSample.call(tempBuffer, i * mixer.sampleByteLength) + Math.floor(inSample / mixer.inputs.length);
            mixer.writeSample.call(tempBuffer, sample, i * mixer.sampleByteLength);
          }
        }
      });

      mixer.mixerBuffer = Buffer.concat([mixer.mixerBuffer, tempBuffer]);

      let samples = mixer.getSamples();
      if (samples > 0 && samples !== Number.MAX_VALUE) {
        let returnBuffer = mixer.mixerBuffer.slice(0, samples * mixer.sampleByteLength * mixer.args.channels);
        mixer.push(returnBuffer);
        mixer.mixerBuffer = mixer.mixerBuffer.slice(samples * mixer.sampleByteLength * mixer.args.channels);
      }

    }, 250);
  }

  _read() {
    if (!this.isReading) {
      this.isReading = true;
      this.start();
    }
    /*
    let samples = this.getMaxSamples();
    // let samples = this.getSamples();
    if (samples > 0 && samples !== Number.MAX_VALUE) {
      console.log('SAMPLES')
      let returnBuffer = this.mixerBuffer.slice(0, samples * this.sampleByteLength * this.args.channels);
      this.push(returnBuffer);
      this.mixerBuffer = this.mixerBuffer.slice(samples * this.sampleByteLength * this.args.channels);
    }
    else if (this.needReadable) {
      //console.log('need readable');
      clearImmediate(this._timer);
      this._timer = setImmediate(this._read.bind(this));
    }
    // this.clearBuffers();
    */
  }
  getMaxSamples() {
    let samples = Number.MAX_VALUE;
    this.inputs.forEach((input) => {
      let ias = input.availableSamples();
      if (ias > 0) {
        input.lastDataTime = new Date().getTime();
      }
      else if (ias <= 0 && new Date().getTime() - input.lastDataTime >= 2000) {
        input.hasData = false;
        return;
      }
      if (input.hasData && ias < samples) {
        samples = ias;
      }
    });
    return samples;
  }

  // Write to mixer buffer every 250ms - input writes faster. If no input, the 'rest' of the buffer is 0 (silence for 16bit 1 channel LE PCM)
  // Read from buffer when there's data available.
  // 
  getSamples() {
    let length = this.mixerBuffer.length;
    return Math.floor(length / ((this.args.bitDepth / 8) * this.args.channels));
    /*

    if (ias > 0) {
      input.lastDataTime = new Date().getTime();
    }
    else if (ias <= 0 && new Date().getTime() - input.lastDataTime >= Mixer.INPUT_IDLE_TIMEOUT) {
      input.hasData = false;
      return;
    }
    if (input.hasData && ias > samples) {
      samples = ias;
    }
  });
    return samples;
  }
  */
  }

  /*
  const SILENCE_FRAME = Buffer.from([0xF8, 0xFF, 0xFE]);
  
  class Silence extends Readable {
    _read() {
      this.push(SILENCE_FRAME);
    }
  }
  
  */
}

module.exports = {
  SilentStream: SilentStream,
  SilenceFiller: SilenceFiller,
  SilenceFillerInput: SilenceFillerInput,
}