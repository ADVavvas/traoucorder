const { REST, Routes } = require('discord.js');
const { clientId, guildId, DISCORD_TOKEN } = require('./config.json');
const commandConfig = require('./commands.json');

const commands = [];
// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandConfig) {
  const command = require(`./slash_commands/${file.file}`);
  console.log(command);
  commands.push(command.data.toJSON());
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

// and deploy your commands!
(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();