const { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType } = require('@discordjs/voice');

const { SlashCommandBuilder } = require('@discordjs/builders');

const fs = require('node:fs');
const path = require('node:path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play recording')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('Whose recording to play')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply();
    const user = interaction.options.getUser('target');
    const member = interaction.guild.members.cache.get(interaction.member.user.id);
    const channel = member.voice.channel;
    console.log('User :' + user);

    if (!channel) return console.error('You must connect to a voice channel!');

    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    try {
      console.log('Successfully connected to voice.');

      const dirPath = path.join('.', 'recordings', user.username);
      console.log(dirPath);
      if (!fs.existsSync(dirPath)) {
        interaction.editReply(`No recordings for user ${user.username}`);
        return;
      }

      const soundFiles = fs.readdirSync(dirPath).filter(file => !file.startsWith('.') && !file.endsWith('.pcm') && !file.startsWith('_'));

      if (!soundFiles) {
        interaction.editReply(`No recordings for user ${user.username}`);
        return;
      }

      console.log(`Playing ${user.username}'s recording`);
      const buffers = [];
      for (const file of soundFiles) {
        console.log(file);
        buffers.push(fs.readFileSync('./recordings/' + user.username + '/' + file));
      }

      const totalBufferLength = buffers
        .map(buffer => buffer.length)
        .reduce((total, length) => total + length);
      console.log(totalBufferLength);
      const newFile = Buffer.concat(buffers, totalBufferLength);

      fs.writeFileSync('./recordings/concat.pcm', newFile);

      const player = createAudioPlayer();
      // Subscribe the connection to the audio player (will play audio on the voice connection)
      const subscription = connection.subscribe(player);

      // subscription could be undefined if the connection is destroyed!
      if (subscription) {

        // Unsubscribe after 5 seconds (stop playing audio on the voice connection)
        // setTimeout(() => subscription.unsubscribe(), 60_000);
        const resource = createAudioResource(fs.createReadStream('./recordings/concat.pcm'), { inputType: StreamType.Raw });
        player.play(resource);
        interaction.editReply(`Playing ${user.username}'s recordings...`);
        player.on('error', error => {
          console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });
      }

    } catch (error) {
      console.log(error);
    }
    /*
    channel.join().then(connection => {
      const conn = connection;
      // Create an instance of a VoiceBroadcast
      const broadcast = client.voice.createBroadcast();
      // Play audio on the broadcast
      const dispatcher = broadcast.play(folder + fileName);
      // Play this broadcast across multiple connections (subscribe to the broadcast)
      conn.play(broadcast);
      console.log('Successfully connected.');
    }).catch(e => {
      // Oh no, it errored! Let's log it to console :)
      console.error(e);
    });
    */
  },
};
