module.exports = {
  name: 'rec',
  description: 'Record',
  args: false,
  execute(client, message, args) {
    const fs = require('fs');
    const channel = message.member.voice.channel;
    
    user = message.member;
    if(message.mentions.users.size) {
      user = message.mentions.users.first();
    }
    //user = message.guild.members.cache.get("232564635201568769");
    console.log(user);
    fs.mkdirSync('./recordings/' + user.username, {recursive:true});
    
    if (!channel) return console.error("You must connect to a voice channel!");


    if(!client.recording.has(user)) {
      client.recording.set(user, true);
      message.reply("Started recording");
    } else {
      recording = client.recording.get(user);
      client.recording.set(user, !recording);
      if(!recording) {
        message.reply("Started recording");
      } else {
        message.reply("Stopped recording");
      }
    }

    /*
    channel.join().then(connection => {
      const broadcast = client.voice.createBroadcast();
      // Play audio on the broadcast
      const dispatcher = broadcast.play('./soundboard/mantepse.mp3');
      // Play this broadcast across multiple connections (subscribe to the broadcast)
      connection.play(broadcast);
        
      //const audio = conn.receiver.createStream(message.member, { mode: 'pcm' });
      //audio.pipe(fs.createWriteStream('./recordings/user/' + Date.now()));

    }).catch(e => {
      // Oh no, it errored! Let's log it to console :)
      console.error(e);
    });
    */
  },
};
