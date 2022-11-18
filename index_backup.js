const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');
const soundboard = require('./soundboard.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
client.commands = new Collection();
client.sounds = new Collection();
client.recording = new Collection();
const fs = require('fs');

const commandFiles = fs.readdirSync('./slash_commands').filter(file => file.endsWith('.js'));

for (const file of soundboard) {
  client.sounds.set(file.name, file.file);
  console.log(file.name);
}

for (const file of commandFiles) {
  const command = require(`./slash_commands/${file}`);

  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.commands.set(command.data.name, command);
}


/*
let conn = null;
client.on('ready', () => {
  const channel = client.channels.cache.get('710021887954124830');
  const prism = require('prism-media');
  channel.guild.members.fetch().then(fetchedMembers => {
    console.log('Fetched users');
  });
  if (!channel) return console.error('The channel does not exist!');
  channel.join().then(connection => {
    // Yay, it worked!
    conn = connection;
    // Create an instance of a VoiceBroadcast
    const broadcast = client.voice.createBroadcast();
    // Play audio on the broadcast
    const dispatcher = broadcast.play(fs.createReadStream('./recordings/concat.pcm'));

    dispatcher.on('finish', () => { console.log('finish'); });
    // Play this broadcast across multiple connections (subscribe to the broadcast)
    //connection.play(broadcast, {type: 'converted'});
    console.log('Successfully connected.');
    //connection.play(fs.createReadStream('./recordings/concat.pcm'), {type: 'converted'});
  }).catch(e => {
    // Oh no, it errored! Let's log it to console :)
    console.error(e);
  });

  //st = fs.createReadStream('./recordings/concat').pipe(new prism.opus.Encoder({frameSize: 960, channels:2, rate: 48000})).pipe(fs.createWriteStream('./recordings/pipa.opus'));
});
*/

client.on('guildMemberSpeaking', function (member, speaking) {
  console.log('Speaking' + speaking);
  if (speaking != true) {
    console.log('Stopped speaking');
    return;
  }
  if (!client.recording.has(member.user)) return;
  if (client.recording.get(member.user)) {
    console.log('Creating Recording');
    const audio = conn.receiver.createStream(member, { mode: 'pcm' });
    audio.pipe(fs.createWriteStream('./recordings/' + member.user.username + '/' + Date.now()));
  }

});

client.on('guildMemberAdd', (member, speaking) => {
  // Create a ReadableStream of s16le PCM audio
  console.log('member added');
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

/*
client.on('message', message => {
  console.log(message.content);
  if (!message.content.startsWith(prefix) || message.author.bot) return;
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();

  console.log(commandName);
  if (!client.commands.has(commandName)) return;


  const command = client.commands.get(commandName);

  console.log(command);
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

*/

client.on('guildMemberUpdate', function (oldMember, newMember) {
  console.error('a guild member changes - i.e. new role, removed role, nickname.');
});

client.on('voiceStateUpdate', (oldState, newState) => {
  console.log('mute/unmute');
});

client.login(config.DISCORD_TOKEN);
