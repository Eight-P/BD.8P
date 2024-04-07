// v2
// watch and compile dev file to mod folder

const Fs = require('fs');
const Path = require('path');
const Chokidar = require('chokidar');
const Sass = require('sass');

const ThemeFolder = process.cwd();
const ThemeName = Path.basename(ThemeFolder);
const DevFile = CheckPath(Path.join(ThemeFolder, "dev", ThemeName + "-dev.theme.scss"));
const DevFileOut = Path.join(ModFolder(), ThemeName + "-dev.theme.css");

// for debug
// console.log(Paths = {
//   name: ThemeName,
//   folder: ThemeFolder,
//   dev: DevFile,
//   devOut: DevFileOut
// });

const SassOptions = {
  style: 'expanded',
  sourceMap: false,
  sourceMapIncludeSources: false
};

Chokidar.watch(ThemeFolder)
  .on('ready', () => {
    console.log(`Listening for changes in: ${ThemeFolder}`);
    console.log(`Compiling dev file to: ${DevFileOut}`);
    Compile();
  })
  .on('change', (trigger) => {
    Compile(trigger);
});

function Compile(trigger) {
  
  try {
    let output = Sass.compile(DevFile, SassOptions);
    Fs.writeFileSync(DevFileOut, output.css);

    if (trigger) {
      let file = trigger.split(Path.sep);
      console.log(`${Timestamp()} compiled changes: ${Path.join(file.at(-2),file.at(-1))}`);
    }
  } 
  catch (error) {
    console.error(error);
  }
}

function ModFolder() {

  const arg = process.argv[2] ? process.argv[2].toLowerCase() : "bd" ;

  const modNames = {
    bd: 'betterdiscord',
    betterdiscord: 'betterdiscord',
    ven: 'vencord',
    vencord: 'vencord'
  }

  const mod = modNames[arg];

  if (!mod) QuitProcess(`"${arg}" is not a valid mod name`);

  const modFolders = { // I think these are correct, but not sure
    win32: `${process.env.APPDATA}\\${mod}\\themes`,
    darwin: `${process.env.HOME}/Library/Application Support/${mod}/themes`,
    linux: `${process.env.HOME}/.config/${mod}/themes`
  }

  const folder = CheckPath(modFolders[process.platform]);
  
  return folder
}

function CheckPath(path) {
  if (Fs.existsSync(path)) {
    return path
  } else {
    QuitProcess(`Can not find: ${path}`);
  }
}

function Timestamp() {
  let date = new Date();

  let hh = date.getHours();
  let hour = ((hh < 10) ? '0' + hh : hh);
  let mm = date.getMinutes();
  let minutes = ((mm < 10) ? '0' + mm : mm);
  let ss = date.getSeconds();
  let seconds = ((ss < 10) ? '0' + ss : ss);

  return `[${hour}:${minutes}:${seconds}]`
}

function QuitProcess(msg) {
  console.error(msg);
  process.exit(1);
}