const Discord = require("discord.js");
const config = require("./config.json");
const soundboard = require("./soundboard.json");

const client = new Discord.Client();
client.commands = new Discord.Collection();
client.sounds = new Discord.Collection();
client.recording = new Discord.Collection();
const fs = require('fs');

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of soundboard) {
  client.sounds.set(file.name, file.file);
}

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);

  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.commands.set(command.name, command);
}

prefix = config.PREFIX; 

user = null
conn = null

client.on("ready", () => {
  const channel = client.channels.cache.get("778595313984077824");
  const prism = require('prism-media');
  channel.guild.members.fetch().then(fetchedMembers => {
    console.log("Fetched users");
  });
  if (!channel) return console.error("The channel does not exist!");
  channel.join().then(connection => {
    // Yay, it worked!
    conn = connection;
    // Create an instance of a VoiceBroadcast
    const broadcast = client.voice.createBroadcast();
    // Play audio on the broadcast
    const dispatcher = broadcast.play(fs.createReadStream('./recordings/concat.pcm'));

    dispatcher.on('finish', ()=> {console.log('finish');});
    // Play this broadcast across multiple connections (subscribe to the broadcast)
    //connection.play(broadcast, {type: 'converted'});
    console.log("Successfully connected.");
    //connection.play(fs.createReadStream('./recordings/concat.pcm'), {type: 'converted'});
  }).catch(e => {
    // Oh no, it errored! Let's log it to console :)
    console.error(e);
  });

  //st = fs.createReadStream('./recordings/concat').pipe(new prism.opus.Encoder({frameSize: 960, channels:2, rate: 48000})).pipe(fs.createWriteStream('./recordings/pipa.opus'));
});

client.on("guildMemberSpeaking", function(member, speaking){
  console.log("Speaking" + speaking);
  if(speaking != true) {
    console.log("Stopped speaking");
    return;
  };
  if(!client.recording.has(member)) return;
  if(client.recording.get(member)) {
    console.log("Creating Recording");
    const audio = conn.receiver.createStream(member, { mode: 'pcm' });
    audio.pipe(fs.createWriteStream('./recordings/' + member.nickname + '/' + Date.now()));
  }

});

client.on("guildMemberAdd", (member, speaking) => {
  // Create a ReadableStream of s16le PCM audio
  console.log("member added");
});


client.on('message', message => {
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  if (!client.commands.has(commandName)) return;


  const command = client.commands.get(commandName);

  if(command.args && !args.length) {
    return message.channel.send(`You didn't provide any arguments, ${message.author}! kek`);
  }

  try {
    command.execute(client, message, args);
  } catch (error) {
    console.error(error);
    message.reply('there was an error trying to execute that command!');
  }
});

client.on("guildMemberUpdate", function(oldMember, newMember){
    console.error(`a guild member changes - i.e. new role, removed role, nickname.`);
});

client.on("voiceStateUpdate", (oldState, newState) => {
  console.log("mute/unmute");
});

client.login(config.DISCORD_TOKEN);
