module.exports = class RecordState {
  RecordState(args) {
    this.channel = args.channel;
    this.user = !args.user ? null : args.user;
    this.owner = args.owner;
    this.guild = this.channel.guild;
  }
};