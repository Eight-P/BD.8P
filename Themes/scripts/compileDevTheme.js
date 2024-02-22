// v1.3
// compile dev to bd folder

const { cwd } = require('process');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const sass = require('sass');

const ThemeFolder = cwd();
const ThemeName = path.basename(ThemeFolder);
const DevFile = CheckPath(path.join(ThemeFolder, "dev", ThemeName + "-dev.theme.scss"));
const DevFileOut = path.join(BDFolder(), ThemeName + "-dev.theme.css");

// for debug
// console.log(ThemePaths = {
//   name: ThemeName,
//   folder: ThemeFolder,
//   dev: DevFile,
//   devOut: DevFileOut
// });

const SassOptions = {
  style: "expanded",
  sourceMap: false,
  sourceMapIncludeSources: false
};

chokidar.watch(ThemeFolder)
  .on('ready', () => {
    console.log(`Listening for changes in: ${ThemeFolder}`);
    console.log(`Compiling dev file to: ${DevFileOut}`);
    Compile();
  })
  .on('change', (file) => {
    Compile(file);
});

function Compile(file) {
  
  try {
    let output = sass.compile(DevFile, SassOptions);
    fs.writeFileSync(DevFileOut, output.css);

    if (file) {
      let cFile = file.split(path.sep);
      console.log(`${Timestamp()} Compiled changes ${path.join(cFile.at(-2),cFile.at(-1))}`);
    }
  } 
  catch (error) {
    console.error(error);
  }
}

function BDFolder() {

  const paths = {
    win32: `${process.env.APPDATA}\\betterdiscord\\themes`,
    darwin: `${process.env.HOME}/Library/Application Support/betterdiscord/themes`,
    linux: `${process.env.HOME}/.config/BetterDiscord/themes`
  }

  let path = CheckPath(paths[process.platform]);

  return path
}

function CheckPath(path) {
  if (fs.existsSync(path)) {
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