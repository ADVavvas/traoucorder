const { SlashCommandBuilder } = require('discord.js');
const { ChannelType } = require('discord.js');
const { recordUser } = require('./record/record_user');
const { recordChannel } = require('./record/record_channel');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('record')
    .setDescription('record')
    // Record User subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('Record a user')
        .addUserOption(option =>
          option.setName('target')
            .setDescription('User to record')
            .setRequired(true))
        .addBooleanOption(option =>
          option.setName('silence')
            .setDescription('Whether or not to add silence between user audio.')
            .setRequired(false)),
    )
    // Record Channel subcommand
    .addSubcommand(subcommand =>
      subcommand
        .setName('channel')
        .setDescription('Record a channel')
        .addChannelOption(option =>
          option.setName('target')
            .setDescription('Channel to record')
            .addChannelTypes(ChannelType.GuildVoice)
            .setRequired(true)),
    ),


  async execute(interaction) {
    if (interaction.options.getSubcommand() === 'user') {
      // Record user
      recordUser(interaction);
    } else if (interaction.options.getSubcommand() === 'channel') {
      // Record channel
      recordChannel(interaction);
    }
  },
};
