const { ComponentType } = require('discord.js');
const { UserRecorder } = require('../../voice_helpers');
const { buildButtonRow } = require('../../util/buttons.js');
const RecordState = require('../../util/RecordState.js');
const { playRecording } = require('../../util/playback');
const { Duration } = require('../../util/playback');

module.exports = {

  async recordUser(interaction) {

    const client = interaction.client;
    const user = interaction.options.getUser('target');
    const silence = interaction.options.getBoolean('silence');
    const member = interaction.guild.members.cache.get(user.id);
    const channel = member.voice.channel;

    if (member.voice.channelId === null) {
      interaction.reply(`User ${user} is not connected to a channel.`);
      return;
    }

    if (client.recording.has(channel.guild.id)) {
      console.log(client.recording[channel.guild.id]);
      await interaction.reply(`Traoucorder is already recording in the ${client.recording[channel.guild.id].channel} channel.`);
      return;
    }

    const row = buildButtonRow();

    const userRecorder = new UserRecorder(client, channel, user);

    client.recording.set(channel.guild.id, new RecordState({ owner: interaction.user, channel: channel, user: user }));

    userRecorder.connect();
    userRecorder.startRecording(silence);

    await interaction.reply({ content: `Recording ${user}`, components: [row] });

    const message = await interaction.fetchReply();

    const filter = m => m.message.id === message.id;

    message.awaitMessageComponent({ filter, componentType: ComponentType.Button, time: 60000 })
      .then(i => {
        if (i.customId === 'stop') {
          i.update({ content: `Stopped recording ${user}.`, components: [] });
          userRecorder.close();
          client.recording.delete(channel.guild.id);
        } else if (i.customId === 'rewind') {
          i.update({ content: `Stopped recording ${user}\nPlaying last 30 seconds...`, components: [] });
          playRecording(interaction, channel, user, Duration.Short);
        } else if (i.customId === 'rewind60') {
          i.update({ content: `Stopped recording ${user}\nPlaying last 60 seconds...`, components: [] });
          playRecording(interaction, channel, user, Duration.Long);
        }
      })
      .catch(err => console.log(`No interactions were collected: ${err}`));
  },
};