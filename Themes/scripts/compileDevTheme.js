// * compileDevTheme.js v3.1
// watch and compile dev file to mod folders

const Fs = require('fs');
const Path = require('path');
const Chokidar = require('chokidar');
const Sass = require('sass');

const ThemeFolder = process.cwd();
const ThemeName = Path.basename(ThemeFolder);
const InputFile = checkPath(Path.join(ThemeFolder, "dev", ThemeName + "-dev.theme.scss"));
const OutputFiles = getOutputPaths();

// for debug
// console.log(Paths = {
//   name: ThemeName,
//   folder: ThemeFolder,
//   devIn: InputFile,
//   devOut: OutputFiles
// });

const SassOptions = {
  style: 'expanded',
  sourceMap: false,
  sourceMapIncludeSources: false
};

Chokidar.watch(ThemeFolder, {
  ignored: (path, stats) => stats?.isFile() && !path.endsWith('.scss')
})
  .on('ready', () => {
    console.log(`Listening for changes in:\n\u001b[36m${ThemeFolder}\u001b[0m\nCompiling to:`);
    for (let filePath of OutputFiles) {
      console.log(`\u001b[36m${filePath}\u001b[0m \n`);
    }
    compileToCss()
  })
  .on('change', (trigger) => { compileToCss(trigger) }
);

function compileToCss(trigger) {
  try {
    let output = Sass.compile(InputFile, SassOptions);

    for (let filePath of OutputFiles) {
      Fs.writeFile(filePath, output.css, (err) => {
        if (err) { throw err }
      })
    }
    if (trigger) {
      let fileName = trigger.split(Path.sep).at(-1);
      console.log(`${getTimestamp()} Recompiled \u001b[34m${fileName}\u001b[0m`);
    }
  }
  catch (err) { 
    console.error(err) 
  }
}

function getOutputPaths() {
  let pathsList = [];
  let argList = process.argv.slice(2);

  const modNames = {
    bd: 'betterdiscord',
    betterdiscord: 'betterdiscord',
    ven: 'vencord',
    vencord: 'vencord'
  }

  function getModFolder(mod) {
    const modFolders = { // I think these are correct, but not sure
      win32: `${process.env.APPDATA}\\${mod}\\themes`,
      darwin: `${process.env.HOME}/Library/Application Support/${mod}/themes`,
      linux: `${process.env.HOME}/.config/${mod}/themes`
    }

    return checkPath(modFolders[process.platform])
  }

  if (argList[0]) {
    for (let arg of argList) {
      let modName = modNames[arg.toLowerCase()];
      if (!modName) quitWithError(new Error(), "Invalid mod", arg);
      let filePath = Path.join(getModFolder(modName), ThemeName + "-dev.theme.css");
      pathsList.push(filePath);
    }
  }
  else {
    let filePath = Path.join(getModFolder("betterdiscord"), ThemeName + "-dev.theme.css");
    pathsList.push(filePath);
  }

  return pathsList ;
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

  return `\u001b[32m${hour}:${minutes}:${seconds}\u001b[0m`
}

function quitWithError(err, msg, details) {
  err.message = `\n\u001b[31m${msg}:\u001b[0m \u001b[4m${details}\u001b[0m \n` ;
  console.error(err);
  console.error("\n");
  process.exit(1)
}
