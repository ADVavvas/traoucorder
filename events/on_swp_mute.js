const { playAudio } = require('../../soundboard_helper.js');

module.exports = {
  mission_swp(oldState, newState) {

    const user = newState.member.user;

    if (user.id === '393539089825267713' && newState.mute) {
      // if (user.id === '177165915731787776') {
      playAudio(newState.client, 'mission_swp', newState.member.voice.channel);
    }

  },
};