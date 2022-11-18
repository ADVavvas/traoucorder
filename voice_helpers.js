const { joinVoiceChannel, createAudioPlayer, createAudioResource } = require('@discordjs/voice');

class MuteState {
  static Muted = new Direction('mute');
  static Unmuted = new Direction('unmute');
  static Deafened = new Direction('deafen');
  static Undeafened = new Direction('undeafen');
  static Joined = new Direction('joined');

  constructor(name) {
    this.name = name;
  }
  toString() {
    return `Color.${this.name}`;
  }
}

module.exports = {
  getMuteState(oldState, newState) {

  },
};