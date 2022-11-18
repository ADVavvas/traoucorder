const { Events } = require('discord.js');
const { playAudio } = require('../soundboard_helper.js');

module.exports = {
  name: Events.VoiceStateUpdate,
  once: false,
  execute(oldState, newState) {
    try {
      const action = (oldState.mute && !newState.mute) ? 'unmuted' : 'muted';
      console.log(`User ${newState.member.user.username} ${action}`);
      const user = newState.member.user;


      if (user.id === '393539089825267713' && newState.mute) {
        // if (user.id === '177165915731787776') {
        playAudio(newState.client, 'mission_swp', newState.member.voice.channel);
      }

    } catch (error) {
      console.log(error);
    }
  },
};