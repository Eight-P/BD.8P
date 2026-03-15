// * compileDevTheme.js v4
// watch and compile dev files to mod folders

const Fs = require('fs');
const Path = require('path');
const Chokidar = require('chokidar');
const Sass = require('sass');

const SourceFolder = process.cwd();
const DevFiles = getDevFiles();
const OutputPaths = getOutputPaths();

const SassOptions = {
  style: 'expanded',
  sourceMap: false,
  sourceMapIncludeSources: false,
  silenceDeprecations: ["import", "if-function"]
};

Chokidar.watch(SourceFolder, {
  ignored: (path, stats) => stats?.isFile() && !path.endsWith('.scss')
})
  .on('ready', () => {
    console.log(`Listening for changes in:\n \u001b[36m${SourceFolder}\u001b[0m \nInput:`);
    for (let devFile of DevFiles) {
      console.log(` \u001b[36m${devFile}\u001b[0m`);
    }
    console.log("Output:");
    for (let filePath of OutputPaths) {
      console.log(` \u001b[36m${filePath}\u001b[0m`);
    }
    console.log("\n");
    upateDevFiles();
  })
  .on('change', (trigger) => { upateDevFiles(trigger) }
);

function upateDevFiles(trigger) {
  let hadError = false ;

  for (let devFile of DevFiles) {
    let output ;
    try {
      // Sync: To favor fewer dev files, as docs state it's faster.
      // (and proper mt would need workers or so i think)
      output = Sass.compile(devFile, SassOptions);
    }
    catch (err) {
      if (DevFiles.length > 1) {
        console.error(`\n\u001b[31mError using Dev-file:\u001b[0m \u001b[34m${Path.basename(devFile)}\u001b[0m\n`);
      }
      console.error(err);
      hadError = true ;
      continue ;
    }

    let devFileName = Path.parse(devFile).name ;

    for (let outputPath of OutputPaths) {
      outputFile = Path.join(outputPath, devFileName + '.css');

      Fs.writeFile(outputFile, output.css, (err) => {
        if (err) { throw err }
      });
    }
  }
  if (trigger && !hadError) {
    console.log(`${getTimestamp()} Recompiled \u001b[34m${Path.parse(trigger).name}\u001b[0m`);
  }
}

function getDevFiles() {
  let devFiles = [] ;
  let devFolder = checkPath(Path.join(SourceFolder, 'dev'));
  let dirEntries = Fs.readdirSync(devFolder, { withFileTypes:true });

  for (let entry of dirEntries) {
    if (entry.isFile() && entry.name.endsWith('.scss')) {
      devFiles.push(Path.join(entry.path, entry.name));
    }
  }
  return devFiles;
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
      pathsList.push(getModFolder(modName));
    }
  }
  else {
    pathsList.push(getModFolder("betterdiscord"));
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
