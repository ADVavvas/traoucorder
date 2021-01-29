module.exports = {
  name: 'kz',
  description: 'Kalh zwh!',
  args: false,
  execute(client, message, args) {
    message.channel.send('Kalh zwh.');
    const channel = message.member.voice.channel;
    
    if (!channel) return console.error("The channel does not exist!");
    channel.join().then(connection => {
      conn = connection;
      // Create an instance of a VoiceBroadcast
      const broadcast = client.voice.createBroadcast();
      // Play audio on the broadcast
      const dispatcher = broadcast.play('kalhzwh.mp3');
      // Play this broadcast across multiple connections (subscribe to the broadcast)
      conn.play(broadcast);
      console.log("Successfully connected.");
    }).catch(e => {
      // Oh no, it errored! Let's log it to console :)
      console.error(e);
    });
  },
};
