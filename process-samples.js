const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

const samplePath = '/media/sf_vboxshare/samples';
const files = fs.readdirSync(samplePath);

const MAX_VOL_PATTERN = /max_volume:\s*([-.\d]+)\s*dB/;
const NORMALIZE_TARGET = -3;

files.forEach(filename => {
  const fullname = path.join(samplePath, filename);
  const outname = path.join('./public/samples', `${filename.split('.')[0]}.ogg`);
  const ffmpeg = 'ffmpeg';
  const normalization = `${ffmpeg} -i ${fullname} -filter:a volumedetect -f null /dev/null`;
  exec(normalization, (error, stdout, stderr) => {
    if (error) {
      console.error(error);
    }
    const match = stderr.match(MAX_VOL_PATTERN);
    if (!match) {
      throw new Error('can not normalize!');
    }
    const delta = NORMALIZE_TARGET - parseFloat(match[1]);
    const cmd = `${ffmpeg} -y -i ${fullname} -filter:a "volume=${delta}dB" -codec:a libvorbis ${outname}`;
    console.log(`Normalize ${filename}: ${delta}`);
    exec(cmd, error => {
      if (error) {
        console.error(error);
      }
      console.log(filename);
    });
  });
});
