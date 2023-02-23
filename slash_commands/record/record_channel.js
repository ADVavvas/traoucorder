const { ChannelRecorder } = require('../../voice_helpers');

module.exports = {
  async recordChannel(interaction) {

    const channel = interaction.options.getChannel('target');
    const client = interaction.client;
    await interaction.reply(`Recording ${channel}`);

    const channelRecorder = new ChannelRecorder(client, channel);
    client.recorders.set(channel.id, channelRecorder);
    channelRecorder.connect();
    channelRecorder.startRecording();
    /*
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: channel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });

    const transcoder = new prism.opus.Decoder({
      rate: 48_000,
      channels: 2,
      frameSize: 960,
    });

    const mixer = new AudioMixer.Mixer({
      channels: 2,
      sampleRate: 48_000,
      bitDepth: 16,
      clearInterval: 10,
    });

    const members = channel.members.filter(m => m.user.id != interaction.client.user.id);

    for (const [id, member] of members) {
      const name = member.nickname ?? member.user.username;
      console.log(`Recording ${name}(${id}) in ${channel.name}`);
      const stream = connection.receiver.subscribe(member.user.id,
        {
          // Stops after 50 seconds of silence.
          end: {
            behavior: EndBehaviorType.AfterSilence,
            duration: 50_000,
          },
        },
      );

      // Create an input stream for the mixer.
      const input = mixer.input({ channels: 2 });

      // Pipe the decoded stream to the mixer input.
      stream.pipe(transcoder).pipe(input);

    }

    // Save into file
    const dirPath = path.join('.', 'recordings', channel.id);
    console.log(`Checking ${dirPath}`);
    if (!fs.existsSync(dirPath)) {
      console.log(`Creating ${dirPath}`);
      fs.mkdirSync(dirPath);
    }

    const filePath = path.join(dirPath, Date.now().toString());

    console.log(`Recording ${filePath}`);

    const file = fs.createWriteStream(filePath);

    mixer.pipe(file);


    // TODO: Add silence.
  */
  },
};