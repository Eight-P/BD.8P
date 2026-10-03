// watch and compile dev themes
// - watch directory: process CWD
// - default dev files path: CWD/dev
// Optional arguments:
// - mods: BetterDiscord/BD (default) | Vencord/Ven | Vesktop/Vesk | Equicord/Eq
// - paths: LoadPath/LP={dirPath} | OutputPath/OP={dirPath}
// - misc: debug

import { log as Log, error as LogE } from 'node:console';
import Path from 'node:path';
import FS from 'node:fs';
import { initCompiler } from 'sass-embedded';
import { watch } from 'chokidar';
import * as U from './util.js';

let Compiler ;
const Config = {
	watchPaths: [U.CWD],
	devFiles: new Set(),
	outputPaths: new Set(),
	sassOptions: {
		style: 'expanded',
		sourceMap: false,
		sourceMapIncludeSources: false,
		silenceDeprecations: ['import', 'if-function'],
		loadPaths: []
	},
	debug: false,
	errorCSS: ":root { --SassError: red }"
};

const Arguments = [
	{
		names: ["debug"],
		flag() { Config.debug = true }
	},
	{
		names: ["LP", "loadPath"],
		multi: true,
		cmd(path) {
			const loadPath = U.checkPath(Path.resolve(path));
			Config.sassOptions.loadPaths.push(loadPath);

			if (!loadPath.startsWith(U.CWD)) {
				Config.watchPaths.push(loadPath);
			}
		}
	},
	{
		names: ["OP", "outputPath"],
		multi: true,
		cmd(path) {
			const outputPath = U.checkPath(Path.resolve(path));
			Config.outputPaths.add(outputPath);
		}
	},
	{
		names: ["BD", "BetterDiscord"],
		flag() { Config.outputPaths.add(getModFolder('BetterDiscord')) }
	},
	{
		names: ["Ven", "Vencord"],
		flag() { Config.outputPaths.add(getModFolder('Vencord')) }
	},
	{
		names: ["Vesk", "Vesktop"],
		flag() { Config.outputPaths.add(getModFolder('vesktop')) }
	},
	{
		names: ["Eq", "Equicord"],
		flag() { Config.outputPaths.add(getModFolder('Equicord')) }
	},
];


await U.handleArguments(Arguments, Config);
setupPaths();
if (Config.debug) Log(Config);
initWatch();


function initWatch() {
	watch(Config.watchPaths, {
		ignored: (path, stats) => {
			if (path.includes('node_modules')) return true ;
			if (stats?.isFile() && !path.endsWith('.scss')) return true ;
			return false ;
		}
	})
	.on('ready', () => {
		Compiler = initCompiler();

		if (!Config.debug) {
			new Map ([
				["Watching:", Config.watchPaths],
				["Dev files:", Config.devFiles],
				["Output folders:", Config.outputPaths]
			]).forEach((paths, text) => {
				Log(text);
				for (const path of paths) Log(" " + U.Cyan(U.getLocalPath(path)))
			});
		}
		Log();
		updateDevFiles();
	})
	.on('change', (trigger) => { updateDevFiles(trigger) })
	.on('error', (err) => { throw err });
}

function updateDevFiles(trigger) {
	let hadError = false ;

	for (const devFile of Config.devFiles) {
		const devFileName = Path.parse(devFile).name ;
		let devFileError = false ;
		let output ;

		try { output = Compiler.compile(devFile, Config.sassOptions).css }
		catch (err) {
			if (!hadError) {
				logCompilerError(err, devFile);
			}
			hadError = true ;
			devFileError = true ;
		}

		for (const outputPath of Config.outputPaths) {
			const filePathOut = Path.join(outputPath, devFileName + '.css');

			if (devFileError) {
				if (!U.checkPath(filePathOut, { file:true, soft:true })) continue ;

				const existingFile = FS.readFileSync(filePathOut, { encoding: 'utf8' });
				if (existingFile.endsWith(Config.errorCSS)) continue ;

				output = existingFile + Config.errorCSS ;
			}

			FS.writeFileSync(filePathOut, output);
		}
	}
	if (trigger && !hadError) {
		Log(U.Green(U.time()), U.Blue(Path.parse(trigger).name));
	}
}

function logCompilerError(err, devFile) {
	if (!Config.debug && err.sassMessage && err.span) {
		LogE(`\nError:\n${U.Red(err.sassMessage)}\n`);

		const codeLines = (err.span.context ?? err.span.text).split("\r\n") ?? [] ;
		let lineNumber = err.span.start.line ;

		for (const line of codeLines) {
			if (line) {
				lineNumber++ ;
				LogE(U.Green(lineNumber), "|", line.trim());
			}
		}
		const path = U.Cyan(U.getLocalPath(err.span.url.pathname));
		LogE(`\n${path}:${U.Green(err.span.start.line + 1)}`);

		if (Config.devFiles.size > 1) {
			LogE("·", U.Cyan(Path.basename(devFile)));
		}
		Log("")
	}
	else { LogE(err.message) }
}

function setupPaths() {
	if (!Config.outputPaths.size) {
		Config.outputPaths.add(getModFolder('BetterDiscord'));
	}

	const devDir = U.checkPath(Path.join(U.CWD, 'dev'));
	U.getFiles(devDir, '.theme.scss').forEach(file => Config.devFiles.add(file));

	if (!Config.devFiles.size) {
		U.quit(`${U.Red("No dev file found in")}: ${U.Cyan(devDir)}\nDev files need to end in .theme.scss`);
	}
}

function getModFolder(mod) {
	const modFolders = { // I think these are correct, but not sure
		win32: `${process.env.APPDATA}\\${mod}\\themes`,
		darwin: `${process.env.HOME}/Library/Application Support/${mod}/themes`,
		linux: `${process.env.HOME}/.config/${mod}/themes`
	}
	return U.checkPath(modFolders[process.platform]);
}
