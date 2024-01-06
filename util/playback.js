const { joinVoiceChannel, createAudioPlayer, createAudioResource, StreamType } = require('@discordjs/voice');
const fs = require('node:fs');
const path = require('node:path');
const ffmpeg = require('ffmpeg');
const { spawn } = require('node:child_process');


const Duration = {
  Short: 30,
  Long: 60,
};

module.exports = {
  playRecording: async function playRecording(interaction, channel, user, duration = Duration.Short) {

    // If user is defined use userId to find file, else channelId.
    const lookupId = user ? user.id : channel.id;
    const err = `No recordings for ${user ?? channel}`;

    try {
      console.log('Successfully connected to voice.');

      const dirPath = path.join('.', 'recordings', lookupId);
      console.log(dirPath);
      if (!fs.existsSync(dirPath)) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: err });
        } else {
          await interaction.reply({ content: err });
        }
        return false;
      }

      const soundFiles = fs.readdirSync(dirPath).filter(file => !file.startsWith('.') && !file.endsWith('.pcm') && !file.endsWith('.mp3') && !file.startsWith('_'));

      if (!soundFiles) {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: err });
        } else {
          await interaction.reply({ content: err });
        }
        return false;
      }

      console.log(`Playing ${user ?? channel.name}'s recording`);
      const timestamps = soundFiles.map(file => Number(file.split('.')[0]));
      console.log(typeof timestamps[0]);
      const latestRecording = Math.max(...timestamps);
      console.log(latestRecording);
      /*
      const buffers = [];
      for (const file of soundFiles) {
        buffers.push(fs.readFileSync('./recordings/' + lookupId + '/' + file));
      }

      const totalBufferLength = buffers
        .map(buffer => buffer.length)
        .reduce((total, length) => total + length);
      console.log(totalBufferLength);
      const newFile = Buffer.concat(buffers, totalBufferLength);

      fs.writeFileSync('./recordings/concat.pcm', newFile);
      */

      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
        selfDeaf: false,
      });

      const player = createAudioPlayer();

      // Subscribe the connection to the audio player (will play audio on the voice connection)
      const subscription = connection.subscribe(player);

      // subscription could be undefined if the connection is destroyed!
      if (subscription) {

        // Unsubscribe after 5 seconds (stop playing audio on the voice connection)
        // setTimeout(() => subscription.unsubscribe(), 60_000);
        // const resource = createAudioResource(fs.createReadStream('./recordings/concat.pcm'), { inputType: StreamType.Raw });
        const p = path.join('.', 'recordings', lookupId, latestRecording.toString());


        // Spawn ffmpeg to convert to mp3. Not necessary but helps with debugging and can easily get duration of audio from it.
        const test = spawn('ffmpeg', [
          '-f', 's16le',
          '-ar', '48k',
          '-ac', 2,
          '-i', p,
          `${p}.mp3`,
        ]);

        // TODO: Reject on code != 0
        // Open convert mp3 with ffmpeg (library not spawned process)
        const dur = await new Promise((resolve, reject) => {
          test.on('exit', (code, signal) => {
            console.log(`code: ${code}`);
            const test2 = new ffmpeg(`${p}.mp3`);
            test2.then(audio => {
              console.log(audio.metadata.duration);
              resolve(audio.metadata.duration?.seconds ?? 0);
            });
          });
        });

        // TODO: Check duration and seek. (-ss flag with ffmpeg)

        console.log(`Duration ${dur}`);

        const resource = createAudioResource(fs.createReadStream(p), { inputType: StreamType.Raw });
        player.play(resource);

        const reply = `Playing ${user ?? channel} recordings.`;
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: reply });
        } else {
          await interaction.reply({ content: reply });
        }

        player.on('error', error => {
          console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        });

      }

    } catch (error) {
      console.log(error);
    }
  },

  Duration: Duration,
};
