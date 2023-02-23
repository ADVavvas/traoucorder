const { joinVoiceChannel, EndBehaviorType } = require('@discordjs/voice');

const { SlashCommandBuilder } = require('@discordjs/builders');

const prism = require('prism-media');
const fs = require('fs');
const path = require('node:path');
const vosk = require('vosk');
const { playAudio } = require('../soundboard_helper');
const { SilenceFiller, SilenceFillerInput } = require('../AudioStreamMixer');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voice_command')
    .setDescription('Record a user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Who to record')
        .setRequired(true)),
  async execute(interaction) {
    // Vosk
    vosk.setLogLevel(0);

    console.log(__dirname);
    const model = new vosk.Model(path.join(__dirname, '../model'));
    const rec = new vosk.Recognizer({ grammar: ['fuck', 'good life', '[unk]'], model: model, sampleRate: 16_000 });

    rec.setMaxAlternatives(0);
    rec.setWords(true);

    const user = interaction.options.getUser('target');
    await interaction.reply(`Recording ${user.username}`);
    const member = interaction.guild.members.cache.get(interaction.member.user.id);
    const channel = member.voice.channel;
    console.log('User :' + user);
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    const transcoder = new prism.opus.Decoder({
      rate: 16_000,
      channels: 1,
      frameSize: 960,
    });

    const userStream = connection.receiver.subscribe(user.id,
      {
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 50_000,
        },
      },
    );

    const dirPath = path.join('.', 'recordings', user.username + '_test');
    console.log(`Checking ${dirPath}`);
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating ${dirPath}`);
      fs.mkdirSync(dirPath);
    }
    const filePath = path.join(dirPath, Date.now().toString());
    console.log(`Recording ${filePath}`);
    const file = fs.createWriteStream(filePath);

    const silenceMixer = new SilenceFiller({
      channels: 1,
      sampleRate: 16_000,
      bitDepth: 16,
      clearInterval: 10,
    });
    const silenceInput = new SilenceFillerInput({
      channels: 1,
      volume: 100,
      bitDepth: 16,
      sampleRate: 16_000,
    });

    silenceMixer.addInput(silenceInput);

    userStream.pipe(transcoder).pipe(silenceInput);

    silenceMixer.on('data', data => {
      if (rec.acceptWaveform(data)) {
        const res = rec.result();
        if (res.text.includes('fuck')) {
          playAudio(interaction.client, 'gtxs', channel);
        } else if (res.text.includes('good life')) {
          playAudio(interaction.client, 'kalhzwh', channel);
        }
        console.log(res.text);

      } else {
        const res = rec.partialResult();
        if (res != null && res.partial != null && res.partial != null && res.partial.length > 0) {
          // console.log(res);
        }
      }
    });


    silenceMixer.pipe(file);
  },
};
