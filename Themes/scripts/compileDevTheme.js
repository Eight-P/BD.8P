// * compileDevTheme.js v2.1
// watch and compile dev file to mod folder

const Fs = require('fs');
const Path = require('path');
const Chokidar = require('chokidar');
const Sass = require('sass');

const ThemeFolder = process.cwd();
const ThemeName = Path.basename(ThemeFolder);
const DevFile = checkPath(Path.join(ThemeFolder, "dev", ThemeName + "-dev.theme.scss"));
const DevFileOut = Path.join(getModFolder(), ThemeName + "-dev.theme.css");

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
    console.log(`Listening for changes in: \u001b[36m${ThemeFolder}\u001b[0m`);
    console.log(`Compiling dev file to: \u001b[36m${DevFileOut}\u001b[0m \n`);
    compileToCss()
  })
  .on('change', (trigger) => {
    compileToCss(trigger)
});

function compileToCss(trigger) {
  try {
    let output = Sass.compile(DevFile, SassOptions);
    Fs.writeFileSync(DevFileOut, output.css);

    if (trigger) {
      let fileName = trigger.split(Path.sep).at(-1);
      console.log(`${getTimestamp()} recompiled for: \u001b[34m${fileName}\u001b[0m`);
    }
  } 
  catch (err) {
    console.error(err)
  }
}

function getModFolder() {

  const arg = process.argv[2]
  const modArg = arg ? arg.toLowerCase() : "bd" ;

  const modNames = {
    bd: 'betterdiscord',
    betterdiscord: 'betterdiscord',
    ven: 'vencord',
    vencord: 'vencord'
  }

  const mod = modNames[modArg];

  if (!mod) quitWithError(new Error(), "Invalid mod", arg);

  const modFolders = { // I think these are correct, but not sure
    win32: `${process.env.APPDATA}\\${mod}\\themes`,
    darwin: `${process.env.HOME}/Library/Application Support/${mod}/themes`,
    linux: `${process.env.HOME}/.config/${mod}/themes`
  }

  const folder = checkPath(modFolders[process.platform]);
  
  return folder
}

function checkPath(path) {
  if (Fs.existsSync(path)) {
    return path
  } else {
    quitWithError(new Error(), "Can not find path", path)
  }
}

function getTimestamp() {
  let date = new Date();

  let hh = date.getHours();
  let hour = ((hh < 10) ? '0' + hh : hh);
  let mm = date.getMinutes();
  let minutes = ((mm < 10) ? '0' + mm : mm);
  let ss = date.getSeconds();
  let seconds = ((ss < 10) ? '0' + ss : ss);

  return `[\u001b[32m${hour}:${minutes}:${seconds}\u001b[0m]`
}

function quitWithError(err, msg, details) {

  err.message = `\n\u001b[31m${msg}:\u001b[0m \u001b[4m${details}\u001b[0m \n` ;
  console.error(err);
  console.error("\n");
  process.exit(1)
}
