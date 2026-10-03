// Mapping class changes with confidence score
// Using class modules from https://github.com/itmesarah/DiscordClasses
// Requires: ./config.json with: { "mapClassChanges": { "token": "github_pat" } }
// · https://github.com/settings/personal-access-tokens

// Score = numSharedKeys / max(numKeysModuleA, numKeysModuleB) / (numTopMatchesA + numTopMatchesB)

import { log as Log, error as LogE } from 'node:console' ;
import Path from 'node:path' ;
import FS from 'node:fs' ;
import * as U from './util.js' ;
import getClassHistory from './classHistory.js' ;

const Config = {
	token: "undefined",
	devDir: "../dev",
	cacheFile: "classHistory.json",
	changesFile: "classChanges.json",
	maxTimeframeMs: 1000 * 60 * 60 * 24 * 365,
	maxFetched: 100,
	maxCached: 1000,
	readCache: true,
	offline: false,
	writeCache: true,
	requireCacheConnection: true,
	minConfidenceScore: 0.1,
	newOutputFile: false,
	dummy: false,
	debug: false,
	debugOutput: false
}

const Arguments = [
	{
		names: ["debug"],
		flag() { Config.debug = true }
	},
	{
		names: ["overrideCache", "orc"],
		flag() { Config.readCache = false }
	},
	{
		names: ["laxCache", "lxc"],
		flag() { Config.requireCacheConnection = false }
	},
	{
    names: ["noCache"],
		flag() { Config.readCache = false ; Config.writeCache = false }
  },
	{
		names: ["offline"],
		flag() { Config.offline = true }
	},
	{
		names: ["newOutput", "newOut"],
		flag() { Config.newOutputFile = true }
	},
	{
		names: ["devDir", "dir"],
		cmd(path) { Config.devDir = path }
	},
	{
		names: ["token", "t"],
		cmd(token) { Config.token = token }
	},
	{
		names: ["fetch", "f"],
		cmd(n) { Config.maxFetched = Number(n) }
	},
	{
		names: ["minScore", "min"],
		cmd(score) { Config.minConfidenceScore = Number(score) }
	},
	{
		names: ["start", "s"],
		cmd(id) {
			Config.commitIdStart = id ;
			Config.readCache = false ;
      Config.writeCache = false ;
		 }
	},
	{
		names: ["end", "e"],
		cmd(id) {
			Config.commitIdEnd = id ;
			Config.readCache = false ;
      Config.writeCache = false ;
		}
	}
];

U.setConfig(Config, Path.join(U.ScriptDir, "config.json"), 'mapClassChanges');
await U.handleArguments(Arguments, Config);

const Setup = {
	devDir: U.checkPath(Path.join(U.ScriptDir, Config.devDir), { make:true }),
	changesFile: Path.join(U.ScriptDir, Config.devDir, Config.changesFile),
}


try {
	if (Config.debug) Log(`\n${Config}\n${Setup}\n`);
	if (!Config.token || Config.token == "undefined") U.cancel("No api token found");

	const classHistory = Config.dummy ?
		getDummyHistory() : await getClassHistory(Config)
	;

	mapClassChanges(classHistory);
}
catch (err) {Log(Config.debug ? `\n${Config}\n${Setup}\n` :""); LogE((err.custom ?? err), "\n")}


function mapClassChanges(classHistory) {
	const mappedChanges = [];

	if (classHistory.length < 2) U.cancel("Not enough commits found.");

	logHistoryInfo(classHistory);
	Log(U.Magenta("\nMapping class changes..."));
	const startTime = performance.now();

	// old to second newest
  for (let i = classHistory.length - 1 ; i > 0 ; i--) {
		const oldModules = classHistory[i];
    const newModules = classHistory[i-1];

		// All modules | map< moduleObj*, { moduleId, keyCount } > | (mostly for debugging)
		let moduleInfo = new Map();

		// All (first) full class strings per commit | set<classString>
		const classListOld = getAllClasses(oldModules.file, moduleInfo);
		const classListNew = getAllClasses(newModules.file, moduleInfo);

		// All keys per commit mapped with the modules that contain them
		// · if the the class was changed
		// · map< keyName, array<moduleObj*> >
    const keyIndexOld = indexKeys(oldModules.file, classListNew);
    const keyIndexNew = indexKeys(newModules.file, classListOld);

		// candidateInfo : { moduleObj*, score, debug?moduleId }

		// Per commit modules mapped with possible match candidates, sorted by confidence score
    // · map< moduleObj*, array<candidateInfo> >
		const modulesIndexOld = indexModules(oldModules.file, keyIndexNew, moduleInfo);
    const modulesIndexNew = indexModules(newModules.file, keyIndexOld, moduleInfo);

		let usedOldModules = new Set(); // set<moduleObj*>

		for (const [newModuleObj, candidates] of modulesIndexNew) { // [ moduleObj*, array<candidateInfo>* ]
			let bestMatches = []; // array<candidateInfo*>
			let numTopCandidates = 0 ;
      let matchScore = null ;

			for (const candidateInfo of candidates) {
				// worse then previously found candidate
				if (matchScore && candidateInfo.score < matchScore) break ;

				numTopCandidates++ ; // even if not matched

				// candidate (old module) was already mapped to another (new) module
				if (usedOldModules.has(candidateInfo.moduleObj)) continue ;

				const reverseCandidates = modulesIndexOld.get(candidateInfo.moduleObj);
				if (!reverseCandidates) continue // e.g.: if old module was removed
				// best matches from candidates perspective
				let reverseCandidateTopScore = null ;
				for (const reverseCandidateInfo of reverseCandidates) {
					// no more top candidates
					if (reverseCandidateTopScore && reverseCandidateInfo.score < reverseCandidateTopScore) break ;
					// is top candidate
					reverseCandidateTopScore = reverseCandidateInfo.score ;

					if (newModuleObj == reverseCandidateInfo.moduleObj) {
						// moduleNew is in top reverseCandidates
						matchScore = candidateInfo.score ;
						bestMatches.push(candidateInfo);
					}
					else { // main candidate had other top candidates as well
						numTopCandidates++ ;
					}
				}
			}

			matchScore = matchScore / Math.max(numTopCandidates, 1);

			if (!bestMatches.length || matchScore < Config.minConfidenceScore) continue ;

			const newModuleID = Config.debug ? moduleInfo.get(newModuleObj).moduleId : null ;

			for (const candidateInfo of bestMatches) {
				usedOldModules.add(candidateInfo.moduleObj);

				for (const key of Object.keys(candidateInfo.moduleObj)) {
					if (!Object.hasOwn(newModuleObj, key)) continue ;

					const oldClass = candidateInfo.moduleObj[key];
					const newClass = newModuleObj[key];

					if (oldClass == newClass) continue ; // needed?

					if (Config.debug) {
						mappedChanges.push([
							oldClass, newClass, matchScore,
							`old: ${oldModules.abbreviatedOid} | module: ${candidateInfo.moduleId}`,
							`new: ${newModules.abbreviatedOid} | module: ${newModuleID}`
						])
					}
					else {
						mappedChanges.push([ oldClass, newClass, Number(matchScore.toFixed(2)) ])
					}
				}
			}
		}

		if (Config.debugOutput) {
			const debugOutput = {
				timestamp: U.date(),
				moduleInfo,
				classListOld, classListNew,
				keyIndexOld, keyIndexNew,
				modulesIndexOld, modulesIndexNew,
				usedOldModules
			}

			const commits = oldModules.abbreviatedOid + "-" + newModules.abbreviatedOid ;
			const testFolder = U.checkPath(Path.join(Setup.devDir, 'testing'), { make:true })
			U.storeJson(Path.join(testFolder, `debug_${commits}.json`), debugOutput);
		}
	}

	const outputPath = Config.newOutputFile ?
		U.getMultiOutputName(Setup.changesFile) : Setup.changesFile
	;

	FS.writeFile(outputPath, JSON.stringify(mappedChanges), (err) => {
		Log(
			`${U.Green("Done in:")} ${((performance.now() - startTime) / 1000).toFixed(2)} seconds`,
			`\n\nMapped ${U.Yellow(mappedChanges.length)} class changes from ${U.Yellow(classHistory.length)} commits.`
		);
		if (err) LogE(err);
		else Log(U.Cyan(outputPath), "\n");
	});
}

function getAllClasses(commitModulesObj, moduleInfoObj) {
	let classList = new Set();

	for (const [moduleId, moduleObj] of Object.entries(commitModulesObj)) {
		let keyCount = 0 ;

		for (const key in moduleObj) {
			const firstClass = moduleObj[key].split(' ')[0];
			moduleObj[key] = firstClass ;
			classList.add(firstClass);
			keyCount++
		}
		moduleInfoObj.set(moduleObj, { moduleId, keyCount });
	}

	return classList ;
}

function indexKeys(commitModulesObj, classList) {
	let index = new Map();

	for (const moduleObj of Object.values(commitModulesObj)) {
		const entries = Object.entries(moduleObj);
		const hasSameHash = entries.some(([_, classString]) => classList.has(classString));

		if (hasSameHash) continue ;

		for (const [key] of entries) {
			const mappedModules = index.get(key);
			if (mappedModules) {
				mappedModules.push(moduleObj)
			} else {
				index.set(key, [ moduleObj ])
			}
		}
	}

	return index ;
}

function indexModules(modulesObj, keyIndex, moduleInfoObj) {
	let moduleIndex = new Map();

	for (const moduleObj of Object.values(modulesObj)) {
		const moduleKeys = Object.keys(moduleObj);
		const moduleKeyCount = moduleKeys.length ;
		// candidates | map<moduleObj*, sharedKeysCount>
		const candidates = new Map();

		for (const key of moduleKeys) {
			// modules that share the same key with moduleObj | array<moduleObj>*
			const potentialCandidates = keyIndex.get(key);
			if (!potentialCandidates) continue ;

			for (const candidateObj of potentialCandidates) {
				const numSharedKeys = candidates.get(candidateObj);
				if (numSharedKeys) {
					candidates.set(candidateObj, numSharedKeys + 1);
				}
				else candidates.set(candidateObj, 1);
			}
		}

		if (!candidates.size) continue ;
		moduleIndex.set(moduleObj, []);

		for (const [candidateObj, numSharedKeys] of candidates) {
			const candidateKeyCount = moduleInfoObj.get(candidateObj).keyCount ;
			const candidateInfo = {
				moduleObj: candidateObj,
				score: numSharedKeys / Math.max(moduleKeyCount, candidateKeyCount),
			}
			if (Config.debug) candidateInfo.moduleId = moduleInfoObj.get(candidateObj).moduleId ;

			moduleIndex.get(moduleObj).push(candidateInfo);
		}
		moduleIndex.get(moduleObj).sort(
			(candidateA, candidateB) => candidateB.score - candidateA.score
		);
	}

	return moduleIndex ;
}

function logHistoryInfo(history) {
	logCommitDetails(history[0], "Newest");
	logCommitDetails(history.at(-1), "Oldest");

	function logCommitDetails(commit, preTxt="") {
		const commitOid = commit.abbreviatedOid ;
		const commitDate = U.date(commit.committedDate);
		const [channel, build] = Object.entries(commit.meta.channel)[0];

		Log(`\n${preTxt} commit: ${U.Blue(commitOid)} ${U.Gray(commitDate)}\n`,
			`· Release channel: ${U.Gray(channel)} build: ${U.Blue(build)}`
		);
	}
	if(!Config.debug) return ;

	const meta = { modulesTotal: 0, keysTotal: 0, keysMax: 0 };

	for (const commit of history) {
		const modules = Object.values(commit.file);
		meta.modulesTotal += modules.length ;

		for (const module of modules) {
			const keys = Object.keys(module);
			meta.keysTotal += keys.length ;

			if (keys.length > meta.keysMax) meta.keysMax = keys.length ;
		}
	}
	meta.modulesAvg = Number((meta.modulesTotal / history.length).toFixed(2));
	meta.keysAvg = Number((meta.keysTotal / meta.modulesTotal).toFixed(2));

	Log("\n", meta);
}

function getDummyHistory() {
	const path = U.checkPath(Path.join(Setup.devDir, 'testing', 'classHistoryDummy.json'), { file:true });
	return JSON.parse(FS.readFileSync(path, { encoding: 'utf8' }));
}
