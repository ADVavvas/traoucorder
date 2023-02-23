const { UserRecorder } = require('../../voice_helpers');

module.exports = {

  async recordUser(interaction) {

    const client = interaction.client;
    const user = interaction.options.getUser('target');
    const silence = interaction.options.getBoolean('silence');
    const member = interaction.guild.members.cache.get(user.id);
    const channel = member.voice.channel;

    await interaction.reply(`Recording ${user.username}`);


    const userRecorder = new UserRecorder(client, channel, user);
    userRecorder.connect();
    userRecorder.startRecording(silence);
  },
};