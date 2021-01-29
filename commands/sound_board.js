module.exports = {
  name: 'sb',
  description: 'Sound board',
  args: true,
  execute(client, message, args) {
    const folder = './soundboard/'
    const channel = message.member.voice.channel;
    
    if (!channel) return console.error("You must connect to a voice channel!");

    const sound = args[0];
    if(!client.sounds.has(sound)) {
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
