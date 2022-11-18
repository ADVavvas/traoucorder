const { joinVoiceChannel, EndBehaviorType } = require('@discordjs/voice');

const { SlashCommandBuilder } = require('@discordjs/builders');

const prism = require('prism-media');
const fs = require('fs');
const path = require('node:path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('record')
    .setDescription('Record a user')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Who to record')
        .setRequired(true)),
  async execute(interaction) {
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
      rate: 48_000,
      channels: 2,
      frameSize: 960,
    });

    const stream = connection.receiver.subscribe(user.id,
      {
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 50_000,
        },
      },
    );

    const dirPath = path.join('.', 'recordings', user.username);
    console.log(`Checking ${dirPath}`);
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating ${dirPath}`);
      fs.mkdirSync(dirPath);
    }
    const filePath = path.join(dirPath, Date.now().toString());
    console.log(`Recording ${filePath}`);
    const file = fs.createWriteStream(filePath);

    stream.pipe(transcoder).pipe(file);
  },
};
