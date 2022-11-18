/*
module.exports = {
  name: 'sb',
  description: 'Sound board',
  args: true,
  execute(client, message, args) {
    const folder = './soundboard/'
    const channel = message.member.voice.channel;

    if (!channel) return console.error("You must connect to a voice channel!");

    sound = ""
    for (arg of args) {
      sound += arg;
      sound += " ";
    }
    sound = sound.slice(0, -1);
    //const sound = args[0];
    console.log(sound);
    if (!client.sounds.has(sound)) {
      message.reply("No such sound.");
      return;
    }

    const fileName = client.sounds.get(sound);

    channel.join().then(connection => {
      conn = connection;
      // Create an instance of a VoiceBroadcast
      const broadcast = client.voice.createBroadcast();
      // Play audio on the broadcast
      const dispatcher = broadcast.play(folder + fileName);
      // Play this broadcast across multiple connections (subscribe to the broadcast)
      conn.play(broadcast);
      console.log("Successfully connected.");
    }).catch(e => {
      // Oh no, it errored! Let's log it to console :)
      console.error(e);
    });
  },
};
*/

const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('soundboard')
    .setDescription("Traou's soundboard")
    .addStringOption(option =>
      option.setName('sound')
        .setDescription('Which sound to play')
        .setRequired(true)
        .addChoices(
          { name: 'Mantepse', value: 'sound_mantepse' },
          { name: 'Meme', value: 'gif_meme' },
          { name: 'Movie', value: 'gif_movie' },
        )),
  async execute(client, interaction) {
    await interaction.reply('Pong!');
    const folder = './soundboard/';
    const channel = interaction.member.voice.channel;

    if (!channel) return console.error("You must connect to a voice channel!");

    var sound = interaction.options.getString('sound')
    console.log(sound);
    if (!client.sounds.has(sound)) {
      message.reply("No such sound.");
      return;
    }

    const fileName = client.sounds.get(sound);

    channel.join().then(connection => {
      conn = connection;
      // Create an instance of a VoiceBroadcast
      const broadcast = client.voice.createBroadcast();
      // Play audio on the broadcast
      const dispatcher = broadcast.play(folder + fileName);
      // Play this broadcast across multiple connections (subscribe to the broadcast)
      conn.play(broadcast);
      console.log("Successfully connected.");
    }).catch(e => {
      // Oh no, it errored! Let's log it to console :)
      console.error(e);
    });
  },
};
