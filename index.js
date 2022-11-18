const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');
const soundboard = require('./soundboard.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
client.commands = new Collection();
client.sounds = new Collection();
client.recording = new Collection();
const fs = require('fs');

const commandFiles = fs.readdirSync('./slash_commands').filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of soundboard) {
  client.sounds.set(file.name, file.file);
  console.log(file.name);
}

for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

for (const file of commandFiles) {
  const command = require(`./slash_commands/${file}`);

  // set a new item in the Collection
  // with the key as the command name and the value as the exported module
  client.commands.set(command.data.name, command);
}

/*
client.on('onGuildMemberVoice', function(member, speaking) {
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
*/

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.log(`No command matching ${interaction.commandName} was found.`);
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
client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  try {
    const action = (oldState.mute && !newState.mute) ? 'unmuted' : 'muted';
    console.log(`User ${newState.member.user.username} ${action}`);
  } catch (error) {
    console.log(error);
  }
});
*/

client.login(config.DISCORD_TOKEN);
