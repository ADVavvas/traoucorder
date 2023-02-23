const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');
const soundboard = require('./soundboard.json');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

// Helper dictionaries
client.commands = new Collection();
client.sounds = new Collection();
client.recording = new Collection();
client.recorders = new Collection();
client.permissions = new Collection();

// Read command/event files
const commandFiles = fs.readdirSync('./slash_commands').filter(file => file.endsWith('.js'));
const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

// Read soundboard config file.
for (const file of soundboard) {
  client.sounds.set(file.name, file.file);
  console.log(file.name);
}

// Add events
for (const file of eventFiles) {
  const event = require(`./events/${file}`);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Add commands
for (const file of commandFiles) {
  const command = require(`./slash_commands/${file}`);

  client.commands.set(command.data.name, command);
}

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

client.login(config.DISCORD_TOKEN);
