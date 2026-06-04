// * compileDevTheme.js v5
// watch and compile dev files to mod folders

const Fs = require('fs');
const Path = require('path');
const Chokidar = require('chokidar');
const Sass = require('sass-embedded');

let Config = {
  watchPaths: [process.cwd()],
  devFiles: new Set(),
  outputPaths: new Set(),
  Sass: {
    style: 'expanded',
    sourceMap: false,
    sourceMapIncludeSources: false,
    silenceDeprecations: ['import', 'if-function'],
    loadPaths: []
  }
};

setupArgs(); setupDevFiles();
const Compiler = Sass.initCompiler();


Chokidar.watch(Config.watchPaths, {
  ignored: (path, stats) => {
    if (path.includes('node_modules')) return true ;
    if (stats?.isFile() && !path.endsWith('.scss')) return true ;
    return false ;
  }
})
  .on('ready', () => {
    console.log(`Listening for changes in:`);
    for (const watchPath of Config.watchPaths) {
      console.log(` ${Cyan(watchPath)}`);
    }
    console.log("Input:");
    for (const devFile of Config.devFiles) {
      console.log(` ${Cyan(devFile)}`);
    }
    console.log("Output:");
    for (const filePath of Config.outputPaths) {
      console.log(` ${Cyan(filePath)}`);
    }
    console.log("\n");
    upateDevFiles();
  })
  .on('change', (trigger) => {
    upateDevFiles(trigger);
  })
  .on('error', (err) => { console.error(`Chokidar error:\n${err}`) })
;

function upateDevFiles(trigger) {
  let hadError = false ;

  for (const devFile of Config.devFiles) {
    let output ;
    try {
      output = Compiler.compile(devFile, Config.Sass);
    }
    catch (err) {
      if (Config.devFiles.size > 1) {
        console.error(`\n${Red("Error using Dev-file")}: ${Cyan(Path.basename(devFile))}\n`);
      }
      console.error(err);
      hadError = true ;
      continue ;
    }

    const devFileName = Path.parse(devFile).name ;

    for (let outputPath of Config.outputPaths) {
      const outputFile = Path.join(outputPath, devFileName + '.css');

      // sync seems better for bd
      Fs.writeFileSync(outputFile, output.css, (err) => {
        if (err) throw err ;
      });
    }
  }
  if (trigger && !hadError) {
    const triggerName = Path.parse(trigger).name ;
    console.log(getTimestamp() + " " + Blue(triggerName));
  }
}

function setupArgs() {
  const argsList = {
    lp: (path) => {
      const lp = checkPath(Path.resolve(path));
      Config.Sass.loadPaths.push(lp);

      if (!lp.startsWith(process.cwd())) {
        Config.watchPaths.push(lp);
      }
    },
    bd: () => {
      Config.outputPaths.add(getModFolder('BetterDiscord'));
    },
    ven: () => {
      Config.outputPaths.add(getModFolder('Vencord'));
    },
    vesk: () => {
      Config.outputPaths.add(getModFolder('vesktop'));
    },

    loadpath: (path) => { argsList.lp(path) },
    betterdiscord: () => { argsList.bd() },
    vencord: () => { argsList.ven() },
    vesktop: () => { argsList.vesk() }
  };

  let processArgs = new Set(); // no duplicates

  for (const arg of process.argv.slice(2)) {
    processArgs.add(arg.toLowerCase());
  }

  for (const fullArg of processArgs) {
    let splitArg = fullArg.split("=");
    let argName = splitArg[0];

    if (argsList[argName] && !splitArg[2]) {
      argsList[argName](splitArg[1]);
    }
    else {
      quitWithError(new Error(), "invalid argument", fullArg);
    }
  }

  if (Config.outputPaths.size == 0) {
    Config.outputPaths.add(getModFolder('BetterDiscord'));
  }
}

function setupDevFiles() {
  const devFolder = checkPath(Path.join(process.cwd(), 'dev'));
  const dirEntries = Fs.readdirSync(devFolder, { withFileTypes:true });

  for (const entry of dirEntries) {
    if (entry.isFile() && entry.name.endsWith('.theme.scss')) {
      Config.devFiles.add(Path.join(entry.parentPath, entry.name));
    }
  }
  if (Config.devFiles.size < 1) {
    quitWithError(new Error(), "Dev files need to end in .theme.scss. No dev file found in", devFolder);
  }
}

function getModFolder(mod) {
  const modFolders = { // I think these are correct, but not sure
    win32: `${process.env.APPDATA}\\${mod}\\themes`,
    darwin: `${process.env.HOME}/Library/Application Support/${mod}/themes`,
    linux: `${process.env.HOME}/.config/${mod}/themes`
  }

  return checkPath(modFolders[process.platform]);
}

function checkPath(path) {
  if (Fs.existsSync(path)) {
    return path ;
  } else {
    quitWithError(new Error(), "Can not find path", path);
  }
}

function getTimestamp() {
  const now = new Date();
  return Green(now.toLocaleTimeString('en-GB'));
}

const Cyan = (text) => `\u001b[36m${text}\u001b[0m` ;
      Red = (text) => `\u001b[31m${text}\u001b[0m` ;
      Green = (text) => `\u001b[32m${text}\u001b[0m` ;
      Blue = (text) => `\u001b[34m${text}\u001b[0m` ;

function quitWithError(err, msg, details) {
  err.message = `\n${Red(msg)}: ${details}\n` ;
  console.error(err);
  console.error("\n");
  process.exit(1);
}
