module.exports = {
  name: 'play',
  description: 'Play pcm',
  args: false,
  execute(client, message, args) {
    const channel = message.member.voice.channel;
    const fs = require('fs');
    
    user = message.member;
    //user = message.guild.members.cache.get("232564635201568769");
    const soundFiles = fs.readdirSync('./recordings/' + user.nickname + '/').filter(file => !file.startsWith("."));

    buffers = []

    for(file of soundFiles) {
        console.log(file);
        buffers.push(fs.readFileSync('./recordings/' + user.nickname + '/' + file));
    }

    const totalBufferLength = buffers
    .map(buffer => buffer.length)
    .reduce((total, length) => total + length);
    console.log(totalBufferLength);
    const newFile = Buffer.concat(buffers, totalBufferLength);

    fs.writeFileSync('./recordings/concat.pcm', newFile);

    if (!channel) return console.error("The channel does not exist!");
    channel.join().then(connection => {
      connection.play(fs.createReadStream('./recordings/concat.pcm'), {type:'converted'});
    }).catch(e => {
      // Oh no, it errored! Let's log it to console :)
      console.error(e);
    });
  },
};
