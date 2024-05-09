// * replaceClasses.js v1
// Replace classes using diff mappings from Nyx/Hijiri/nightflower
// https://github.com/NyxIsBad/discordscripts/tree/master

const OverwriteFiles = false ;

const Fs = require('fs');
const Path = require('path');

const ThemePath = process.cwd();
const ThemesPath = Path.dirname(ThemePath);
const ThemeFilesPath = checkPath(Path.join(ThemePath, "src", "components"));

const MappingsFilePath = checkPath(Path.join(ThemesPath, "scripts", "classes_mapping.txt"));
const MappingsContent = Fs.readFileSync(MappingsFilePath, {encoding: 'utf8'});
const ClassMappings = MappingsContent.split(/\r\n|\r|\n/);

const FilePrefix = OverwriteFiles ? "" : "new" ;

console.log(
`Overwriting existing files: ${OverwriteFiles ? "\u001b[31mtrue" : "\u001b[32mfalse"}\u001b[0m \n
Mappings file: \u001b[34m${MappingsFilePath}\u001b[0m \n
Replacing classes in:`
);

getFiles(ThemeFilesPath);

function getFiles(dirPath) {
  let dirEntries = Fs.readdirSync(dirPath, {withFileTypes:true});

  for (let entry of dirEntries) {
    let entryPath = Path.join(entry.path, entry.name)
    
    if (entry.isDirectory()) {
      getFiles(entryPath)
    }
    else if (entry.isFile()) {
      let fileContent = Fs.readFileSync(entryPath, {encoding: 'utf8'});

      for (let i = 0 ; i < ClassMappings.length; i += 2) {
        let classOld = ClassMappings[i];
        let classNew = ClassMappings[i + 1];
        fileContent = fileContent.replaceAll(classOld, classNew);
      }
      let filePath = Path.join(entry.path, FilePrefix + entry.name);
      console.log(`\u001b[36m${filePath}\u001b[0m`);
      Fs.writeFileSync(filePath, fileContent);
    }
  }
}

function checkPath(path) {
  if (Fs.existsSync(path)) {
    return path
  } else {
    quitWithError(new Error(), "Can not find path", path)
  }
}

function quitWithError(err, msg, details) {
  err.message = `\n\u001b[31m${msg}:\u001b[0m \u001b[4m${details}\u001b[0m \n` ;
  console.error(err);
  console.error("\n");
  process.exit(1)
}
