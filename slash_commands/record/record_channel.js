const { ComponentType } = require('discord.js');
const { ChannelRecorder } = require('../../voice_helpers');
const { buildButtonRow } = require('../../util/buttons.js');
const RecordState = require('../../util/RecordState.js');
const { playRecording, Duration } = require('../../util/playback');

module.exports = {
  async recordChannel(interaction) {

    const channel = interaction.options.getChannel('target');
    const client = interaction.client;
    const row = buildButtonRow();

    if (client.recording.has(channel.guild.id)) {
      await interaction.reply(`Traoucorder is already recording in the ${client.recording[channel.guild.id].channel} channel.`);
      return;
    }

    if (channel.members.size == 0) {
      await interaction.reply(`Channel ${channel} is empty. Please connect first.`);
      return;
    }


    await interaction.reply({ content: `Recording ${channel}`, components: [row] });

    const channelRecorder = new ChannelRecorder(client, channel);

    client.recording.set(channel.guild.id, new RecordState({ owner: interaction.user, channel: channel, user: null }));

    channelRecorder.connect();
    channelRecorder.startRecording();

    const message = await interaction.fetchReply();

    const filter = m => m.message.id === message.id;

    message.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 60000 })
      .then(i => {
        if (i.customId === 'stop') {
          i.update({ content: `Stopped recording ${channel}`, components: [] });
          channelRecorder.close();
          client.recording.delete(channel.guild.id);
        } else if (i.customId === 'rewind') {
          i.update({ content: `Stopped recording ${channel}\nPlaying last 30 seconds...`, components: [] });
          // Null user.
          playRecording(interaction, channel, null, Duration.Short);
        } else if (i.customId === 'rewind60') {
          i.update({ content: `Stopped recording ${channel}\nPlaying last 60 seconds...`, components: [] });
          // Null user.
          playRecording(interaction, channel, null, Duration.Long);
        }
      })
      .catch(err => console.log(`No interactions were collected: ${err}`));

  },
};