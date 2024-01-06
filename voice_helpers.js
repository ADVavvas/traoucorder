const { joinVoiceChannel, EndBehaviorType, getVoiceConnection } = require('@discordjs/voice');
const prism = require('prism-media');
const fs = require('fs');
const path = require('node:path');
const AudioMixer = require('audio-mixer');
const { Collection } = require('discord.js');
const { SilenceFiller, SilenceFillerInput } = require('./AudioStreamMixer');

module.exports = {
  ChannelRecorder: class ChannelRecorder {
    #users;
    #mixer;
    #connection;
    #client;
    #transcoder;
    channel;
    #file;
    #streams = Collection();

    constructor(client, channel) {
      this.channel = channel;
      this.#client = client;
      this.#users = new Collection();
    }

    connect() {
      // Create connection
      this.#connection = joinVoiceChannel({
        channelId: this.channel.id,
        guildId: this.channel.guild.id,
        adapterCreator: this.channel.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      // TODO: Return if connected
    }

    startRecording() {

      console.log(this.channel.bitrate);
      this.#transcoder = new prism.opus.Decoder({
        rate: 48_000,
        channels: 2,
        frameSize: 960,
      });

      this.#mixer = new AudioMixer.Mixer({
        channels: 2,
        sampleRate: 48_000,
        bitDepth: 16,
        clearInterval: 10,
      });

      // Receive from each member's connection and add to the mixer.
      const members = this.channel.members.filter(m => m.user.id != this.#client.user.id);

      for (const [id, member] of members) {
        const name = member.nickname ?? member.user.username;
        this.#users.set(id, member);
        console.log(`Recording ${name}(${id}) in ${this.channel.name}`);
        const stream = this.#connection.receiver.subscribe(member.user.id,
          {
            // Stops after 50 seconds of silence.
            end: {
              behavior: EndBehaviorType.AfterSilence,
              duration: 50_000,
            },
          },
        );

        this.#streams.set(id, stream);

        // Create an input stream for the mixer.

        const silenceMixer = new SilenceFiller({
          channels: 2,
          sampleRate: 48_000,
          bitDepth: 16,
          clearInterval: 10,
        });
        const silenceInput = new SilenceFillerInput({
          channels: 2,
          sampleRate: 48_000,
          bitDepth: 16,
          volume: 100,
        });
        silenceMixer.addInput(silenceInput);

        const input = this.#mixer.input({ channels: 2 });

        // Pipe the decoded stream to the mixer input.
        stream.pipe(this.#transcoder).pipe(silenceInput);
        silenceMixer.pipe(input);
      }

      // Save into file
      const dirPath = path.join('.', 'recordings', this.channel.id);
      console.log(`Checking ${dirPath}`);
      if (!fs.existsSync(dirPath)) {
        console.log(`Creating ${dirPath}`);
        fs.mkdirSync(dirPath);
      }

      const filePath = path.join(dirPath, Date.now().toString());

      console.log(`Recording ${filePath}`);

      this.#file = fs.createWriteStream(filePath);

      this.#mixer.pipe(this.#file);

    }

    addUser(user) {
      // TODO: Ask for permission.
      if (!this.checkPermission(this.#client, user)) return;

      this.#users.set(user.id, user);
      const name = user.username;
      console.log(`Recording ${name}(${user.id}) in ${this.channel.name}`);
      const stream = this.#connection.receiver.subscribe(user.id,
        {
          // Stops after 50 seconds of silence.
          end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 50_000,
          },
        },
      );

      this.#streams.set(user.id, stream);

      // Create an input stream for the mixer.
      const input = this.#mixer.input({ channels: 2 });

      // Pipe the decoded stream to the mixer input.
      stream.pipe(this.#transcoder).pipe(input);

    }

    // Unrecoverable stop. Just doesn't disconnect.
    stop() {
      for (const stream of this.#streams.values()) {
        stream?.destroy();
      }
      this.#mixer?.destroy();
      this.#file?.destroy();
    }

    close() {
      const connection = getVoiceConnection(this.channel.guild.id);
      connection?.destroy();
      this.stop();
    }

    // TODO: Maybe add guild
    checkPermission(client, user) {
      client.permissions.has(user.id) && client.permissions[user.id];
      return true;
    }

  },

  UserRecorder: class UserRecorder {
    #client;
    #transcoder;
    #channel;
    #user;
    #stream;
    #silenceMixer;
    #file;
    constructor(client, channel, user) {
      this.#channel = channel;
      this.#client = client;
      this.#user = user;
    }

    connect() {
      // Create connection
      const connection = joinVoiceChannel({
        channelId: this.#channel.id,
        guildId: this.#channel.guild.id,
        adapterCreator: this.#channel.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      if (connection) return true;
      return false;
      // TODO: Return if connected
    }

    startRecording(withSilence = false) {
      if (!this.checkPermission(this.#client, this.#user)) return;
      const connection = getVoiceConnection(this.#channel.guild.id);
      if (!connection) return;
      // TODO: Add error messages.

      this.#transcoder = new prism.opus.Decoder({
        rate: 48_000,
        channels: 2,
        frameSize: 960,
      });

      this.#stream = connection.receiver.subscribe(this.#user.id,
        {
          // Stops after 50 seconds of silence.
          end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 50_000,
          },
        },
      );

      // Create an input stream for the mixer.
      // Save into file
      const dirPath = path.join('.', 'recordings', this.#user.id);
      console.log(`Checking ${dirPath}`);
      if (!fs.existsSync(dirPath)) {
        console.log(`Creating ${dirPath}`);
        fs.mkdirSync(dirPath);
      }

      const filePath = path.join(dirPath, Date.now().toString());

      console.log(`Recording ${filePath}`);

      this.#file = fs.createWriteStream(filePath);

      let output = this.#stream.pipe(this.#transcoder);

      if (withSilence) {
        this.#silenceMixer = new SilenceFiller({
          channels: 2,
          sampleRate: 48_000,
          bitDepth: 16,
          clearInterval: 10,
        });
        const silenceInput = new SilenceFillerInput({
          channels: 2,
          sampleRate: 48_000,
          bitDepth: 16,
          volume: 100,
        });

        this.#silenceMixer.addInput(silenceInput);

        output.pipe(silenceInput);
        output = this.#silenceMixer;
      }

      output.pipe(this.#file);
    }

    // Unrecoverable stop. Just doesn't disconnect.
    stop() {
      this.#stream?.destroy();
      this.#silenceMixer?.destroy();
      this.#file?.destroy();
    }

    close() {
      const connection = getVoiceConnection(this.#channel.guild.id);
      connection?.destroy();
      this.stop();
    }

    // TODO: Maybe add guild
    checkPermission(client, user) {
      client.permissions.has(user.id) && client.permissions[user.id];
      return true;
    }

  },
};
