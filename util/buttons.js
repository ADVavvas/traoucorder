const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  buildButtonRow() {
    return new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('rewind60')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⏪'),

        new ButtonBuilder()
          .setCustomId('rewind')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('◀'),

        new ButtonBuilder()
          .setCustomId('stop')
          .setStyle(ButtonStyle.Secondary)
          .setEmoji('⏹'),
      );
  },
};