const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');

const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('soundboard')
    .setDescription('Traou\'s soundboard')
    .addStringOption(option =>
      option.setName('sound')
        .setDescription('Which sound to play')
        .setRequired(true)
        .addChoices(
          { name: 'kalh zwh', value: 'kalhzwh' },
          { name: 'mantepse', value: 'sound_mantepse' },
          { name: 'skase', value: 'sound_skase' },
          { name: 'gtxs', value: 'gtxs' },
          { name: 'laugh', value: 'sound_laugh' },
        )),
  async execute(interaction) {
    const folder = './soundboard/';
    const member = interaction.guild.members.cache.get(interaction.member.user.id);
    const channel = member.voice.channel;

    if (!channel) return console.error('You must connect to a voice channel!');

    const sound = interaction.options.getString('sound');
    console.log(sound);
    if (!interaction.client.sounds.has(sound)) {
      interaction.reply('No such sound.');
      return;
    }

    const fileName = interaction.client.sounds.get(sound);

    console.log(interaction.member.voice.channel.name);
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
    });

    try {
      console.log('Successfully connected.');

      const player = createAudioPlayer();
      // Subscribe the connection to the audio player (will play audio on the voice connection)
      const subscription = connection.subscribe(player);

      // subscription could be undefined if the connection is destroyed!
      if (subscription) {

        // Unsubscribe after 5 seconds (stop playing audio on the voice connection)
        setTimeout(() => subscription.unsubscribe(), 10_000);
        const resource = createAudioResource(`${folder}${fileName}`);
        player.play(resource);
        player.on('error', error => {
          console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });

        interaction.reply(`Playing ${interaction.options.get('sound').name}`);
      }

    } catch (error) {
      console.log('Error');
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
