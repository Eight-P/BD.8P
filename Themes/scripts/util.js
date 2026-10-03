import { log as Log, error as LogE } from 'node:console' ;
import Path from 'node:path' ;
import FS from 'node:fs' ;

export const CWD = process.cwd();
export const ScriptDir = import.meta.dirname ?? quit("No meta directory");


export function setConfig(defaultConfig, configPath, configKey="undefined") {
	if (!checkPath(configPath, { file:true, soft:true} )) return ;

	const configFile = FS.readFileSync(configPath, { encoding: 'utf8' });
	const config = JSON.parse(configFile)[configKey];

	if (!config) {
		LogE(`${Red("No config for")}: "${configKey}" in:\n · ${Cyan(configPath)}`);
		return ;
	};

	Object.assign(defaultConfig, Object.fromEntries(
		Object.entries(config).filter(([key, value]) => {
			if (!Object.hasOwn(defaultConfig, key)) return false ;

			const defaultType = typeof defaultConfig[key];
			const configFileType = typeof value ;

			if (defaultType !== configFileType) {
				Log(`\n(Config) "${key}" should be ${defaultType}, but is ${configFileType}`);
				return false ;
			}
			return true ;
		})
	));
}

export async function handleArguments(Arguments, config) {
	const processArgs = new Set(process.argv.slice(2));
	let processArgsMap = new Map();

	for (const fullArg of processArgs) {
		const splitArg = fullArg.split("=");
		const name = splitArg[0].toLowerCase();

		splitArg.splice(0, 1);
		let params = processArgsMap.get(name);

		if (params) params.push(...splitArg);
		else processArgsMap.set(name, splitArg);
	}

	for (const arg of Arguments) {
		for (const argName of arg.names) {
			const name = argName.toLowerCase();
			if (!processArgsMap.has(name)) continue ;
			if (arg.flag) {
				await arg.flag();
				processArgsMap.delete(name);
				continue ;
			}

			for (const param of processArgsMap.get(name)) {
				if (!param) break ;
				if (arg.cmd) {
					await arg.cmd(param);
					processArgsMap.delete(name);
				};
				if (!arg.multi) break ;
			}
		}
	}

	if (config.debug && processArgsMap.size) {
		LogE(Red("\nInvalid arguments:"));

		for (const [key, value] of processArgsMap) {
			const name = key ? key : Red("undefined");
			const params = (value.length && !value[0]) ?
				Red("undefined") : value.join(", ");
			LogE(`[ ${name}${(value.length ? " = " + params : "")} ]`);
		}
	}
}

export function getFiles(path, ext="") {
	if (!path) throw new Error("getFiles() expects path");
	const dirEntries = FS.readdirSync(path, {
		recursive: true, withFileTypes: true
	});
	return dirEntries
		.filter(entry => entry.isFile() && entry.name.endsWith(ext))
		.map(file => Path.join(file.parentPath, file.name));
}

export function getLocalPath(path) {
	const fullPath = Path.normalize(path);
	const dirPath = CWD.replace(Path.basename(CWD), "");
	const dirIndex = fullPath.indexOf(dirPath);
	const shortPath = fullPath.slice(dirIndex + dirPath.length);

	return (dirIndex !== -1 ) ? shortPath : fullPath ;
}

export function storeJson(path, json) {
	const data = JSON.stringify(json, (key, value) => {
		if (value instanceof Map) {
			return {
				dataTypeMap: Array.from(value.entries())
			};
		}
		else if (value instanceof Set) {
			return {
				dataTypeSet: Array.from(value)
			}
		}
		else return value ;
	});

	FS.writeFileSync(path, data);
}

export function checkPath(path, expected={file:false, soft:false, make:false}) {
	const type = expected.file ? "file" : "directory/folder" ;

	try { FS.accessSync(path, FS.constants.F_OK) }
	catch {
		if (!expected.file && expected.make) {
			FS.mkdirSync(path);
			return path ;
		}
		else if (expected.soft) {
			return false ;
		}
		throw new Error(`${Red("No such " + type)}:\n${Cyan(path)}`);
	}

	const pStats = FS.statSync(path);
	if ((expected.file && pStats.isFile()) ||
		 (!expected.file && pStats.isDirectory())) {
		return path ;
	}
	if (expected.soft) {
		return false
	}
	throw new Error(`${Red(`Path is not a ${type}`)}:\n${Cyan(path)}`);
}

export function getMultiOutputName(filePath) {
	const outputName = Path.basename(filePath);
	const outputDir = Path.dirname(filePath);
	const existingFiles = [];

	const dirEntries = FS.readdirSync(outputDir, { withFileTypes: true });

	for (const entry of dirEntries) {
		if (entry.isFile() && entry.name.endsWith(outputName)) {
			existingFiles.push(entry.name);
		};
	}

	if (existingFiles.length) {
		let i = existingFiles.length ;
		let filename = `(${i})` + outputName ;

		while (existingFiles.includes(filename)) {
			i++ ;
			filename = `(${i})` + outputName ;
		};
		return Path.join(outputDir, filename);
	}
	return filePath ;
}

export function time() {
	return new Date().toLocaleTimeString('en-GB');
}

export function date(input) {
	const date = input ? new Date(input) : new Date();
	return date.toLocaleString();
}

export function cancel(text) {
	const err = new Error();
  err.custom = text ;
  throw err ;
}

export function quit(text) {
	Log(); LogE(text, "\n");
  process.exit(1);
}

export function Red(text) { return `\x1b[31m${text}\x1b[0m` }
export function Green(text) { return `\x1b[32m${text}\x1b[0m` }
export function Yellow(text) { return `\x1b[33m${text}\x1b[0m` }
export function Blue(text) { return `\x1b[34m${text}\x1b[0m` }
export function Magenta(text) { return `\x1b[35m${text}\x1b[0m` }
export function Cyan(text) { return `\x1b[36m${text}\x1b[0m` }
export function Gray(text) { return `\x1b[90m${text}\x1b[0m` }
