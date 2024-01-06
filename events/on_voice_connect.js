const { Events } = require('discord.js');
const { playAudio } = require('../soundboard_helper.js');

module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,
  execute(oldState, newState) {
    try {

      const client = newState.client;
      // Connected
      /*
      if (newState.client.recordings.has(newState.channel.id)) {

        // TODO: Ask permission.
        // Add user to recorded.

      } else if (newState.client.recordings.has(oldState.channel.id)) {
        // Disconnected

      }
      */


    } catch (error) {
      console.log(error);
    }
  },
};