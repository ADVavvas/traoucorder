const { UserRecorder } = require('../../voice_helpers');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {

  async recordUser(interaction) {

    const client = interaction.client;
    const user = interaction.options.getUser('target');
    const silence = interaction.options.getBoolean('silence');
    const member = interaction.guild.members.cache.get(user.id);
    const channel = member.voice.channel;

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('stop')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('◽'),
      );

    const userRecorder = new UserRecorder(client, channel, user);
    userRecorder.connect();
    userRecorder.startRecording(silence);

    await interaction.reply({ content: `Recording ${user}`, components: [row] });

    const filter = i => i.customId === 'stop';

    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
      userRecorder.close();
      await i.update({ content: `Stopped recording ${user}`, components: [] });
    });

  },
};