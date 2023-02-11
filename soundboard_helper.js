const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');

module.exports = {
  async playAudio(client, sound, channel) {

    const folder = './soundboard/';

    if (!channel) return console.error('You must connect to a voice channel!');

    if (!client.sounds.has(sound)) {
      console.log('No such sound');
      return;
    }

    const fileName = client.sounds.get(sound);

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
        const resource = createAudioResource(`${folder}${fileName}`);
        player.play(resource);
        player.on('error', error => {
          console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });
      }

    } catch (error) {
      console.log('Error');
    }
  },

  async playRecording(client, sound, channel) {
    const folder = './soundboard/';

    if (!channel) return console.error('You must connect to a voice channel!');

    if (!client.sounds.has(sound)) return;

    const fileName = client.sounds.get(sound);

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
      }

    } catch (error) {
      console.log('Error');
    }
  },
};