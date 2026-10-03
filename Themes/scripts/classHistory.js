import { log as Log, error as LogE } from 'node:console' ;
import Path from 'node:path' ;
import FS from 'node:fs' ;
import Readline from 'node:readline';
import { Readable } from 'node:stream';
import { pipeline as Pipeline } from 'node:stream/promises';
import * as U from './util.js' ;

export default getClassHistory ;

const Config = {
  token: "undefined",
  devDir: "../dev",
  cacheFile: "classHistory.json",
  maxTimeframeMs: 1000 * 60 * 60 * 24 * 365,
  commitIdStart: null,
  commitIdEnd: null,
  maxFetched: 100,
  maxCached: 1000,
  readCache: true,
  offline: false,
  writeCache: true,
  requireCacheConnection: true,
  debug: false
}

const Github = {
  commitsUrls: 'https://api.github.com/repos/itmesarah/DiscordClasses/commits',
  classesUrl: 'https://api.github.com/repos/itmesarah/DiscordClasses/git/blobs',
  graphQl: {
    api: 'https://api.github.com/graphql',
    repo: 'DiscordClasses',
    owner: 'itmesarah',
    branch: 'refs/heads/main',
    file: 'discordclasses.json',
  }
}

const Setup = {};

async function getClassHistory(params) {
  await setup(params);

  if (Config.offline && !Config.readCache) U.cancel(U.Red("Can not use 'offline' and ignore cache"));

  const cachedHistory = Config.readCache ? await getCache() : [];
  let wasCached = false, reachedCache = false, newestCachedCommit = false ;

  if (cachedHistory.length) {
    Log(`\n${cachedHistory.length} cached commits found`);

    if (Config.offline) return cachedHistory ;

    Setup.endDate = cachedHistory[0].committedDate ;
    newestCachedCommit = cachedHistory[0].oid ;
    wasCached = true ;
  }
  else if (Config.offline) U.cancel(U.Red("Set as 'offline', but no cache found"));
  else if (Config.readCache) Log("\nNo cached commits found");

  if (Config.debug) Log(Setup);

  Log(U.Magenta("\nFinding new class history..."));
  const startTime = performance.now();

  const commitHistory = await getCommitHistory(newestCachedCommit);

  if (commitHistory.length && newestCachedCommit && newestCachedCommit == commitHistory.at(-1).oid) {
    reachedCache = true ;
		commitHistory.pop();
  }

  const newHistory = await getClasses(commitHistory);

  if (newHistory.length) {
    Log(`${U.Green("\nDone in")} ${((performance.now() - startTime) / 1000).toFixed(2)} seconds`);
  }
  // no fetched commits
  if (!newHistory.length) {
    const msg =
      `No new commits${!wasCached ? " or cache found:" : ", but cache found."}` +
      `\nSearched from: ${U.Blue(U.date(Setup.startDate))}` +
      `\nUntil ${wasCached ? "cache:" : ""} ${U.Blue(U.date(Setup.endDate))}`
    ;
      // no fetched commits and no cache
    if (!wasCached) U.cancel(msg);
    Log("\n" + msg);
  }
  // fetched commits, no cache
  else if (!wasCached) {
    Log(U.Green(`\nFetched: ${newHistory.length} new commits`));
  }
  // fetched commits, reached cache
  else if (reachedCache) {
    Log(U.Green(`\nAdded: ${newHistory.length} new commit${newHistory.length > 1 ? "s":""} to cache`));
  }
  // fetched commits, didn't reached cache, but didn't need to.
  else if (!Config.requireCacheConnection) {
    Log(U.Yellow(`\nAdded: ${newHistory.length} new commits, but without direct connection to cache`));
  }
  // fetched commits, didn't reached cache, but had to.
  else {
    const lastFetchedTime = U.Blue( U.IsoDateReadable(newHistory.at(-1).committedDate) );
    const newestCachedTime = U.Blue( U.IsoDateReadable(cachedHistory[0].committedDate) );

    U.cancel(U.Red("Unable to connect new commits to cache.") +
      `\nFetched ${U.Yellow(newHistory.length)} commits from: ${U.Green(newHistory[0].abbreviatedOid)}` +
      `\nUntil: ${U.Green(newHistory.at(-1).abbreviatedOid)} - ${lastFetchedTime}` +
      `\nNewest cached: ${U.Green(cachedHistory[0].abbreviatedOid)} ${newestCachedTime}`
    );
  }

  if (wasCached) newHistory.push(...cachedHistory);

	newHistory.splice(Config.maxCached);
	if (Config.writeCache) cacheHistory(newHistory);

	return newHistory ;
}

async function setup(params) {
  if (params) {
    Object.assign(Config, Object.fromEntries(
      Object.entries(params).filter(([key]) => Object.hasOwn(Config, key))
    ));
  }

  Setup.devDir = U.checkPath(Path.join(U.ScriptDir, Config.devDir), { make:true });
  Setup.cacheFile = Path.join(Setup.devDir, Config.cacheFile);

  Setup.startDate = Config.commitIdStart ?
    getCommitDate(Config.commitIdStart) : new Date().toISOString();

  Setup.endDate = Config.commitIdEnd ?
    getCommitDate(Config.commitIdEnd) : new Date(Date.now() - Config.maxTimeframeMs).toISOString();

  [Setup.startDate, Setup.endDate] = await Promise.all([Setup.startDate, Setup.endDate]);
}

async function getCommitDate(id) {
  const res = await fetch(`${Github.commitsUrls}/${id}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/vnd.github.raw+json',
      'Authorization': `Bearer ${Config.token}`,
      'X-GitHub-Api-Version': '2026-03-10'
    }
  });
  if (res.ok) {
    const json = await res.json();
    return json.commit.committer.date ;
  }
  else {
    U.cancel(`${U.Red("Invalid git object id")}: ${id}\n${url}\nReturned: ${res.status} ${res.statusText}`);
  }
}

async function getCache() {
  const cachedHistory = [];
  const cacheFile = U.checkPath(Setup.cacheFile, { file:true, soft:true});

  if (!Config.readCache || !cacheFile) return cachedHistory;

  const rl = Readline.createInterface({
    input: FS.createReadStream(cacheFile, { encoding: 'utf8' }), crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (line.trim()) cachedHistory.push(JSON.parse(line));
  }

  return cachedHistory ;
}

async function getCommitHistory(newestCachedCommit) {
  const commitHistory = [];
  const maxPageSize = 50 ; // api limit = 100, might timeout tho if to high.
  const maxRetries = 3 ; // per page
  const variables = {
    repo: Github.graphQl.repo,
    owner: Github.graphQl.owner,
    branch: Github.graphQl.branch,
    file: Github.graphQl.file,
    startDate: Setup.startDate,
    endDate: Setup.endDate,
    pageSize: maxPageSize,
    cursor: null
  };

  const query = `query getClassChangesHistory(
    $repo: String!
    $owner: String!
    $branch: String!
    $file: String!
    $startDate: GitTimestamp!
    $endDate: GitTimestamp!
    $pageSize: Int!
    $cursor: String
  ){
    repository(owner: $owner, name: $repo) {
      ref(qualifiedName: $branch) {
        target {
          ... on Commit {
            history(
              path: $file,
              first: $pageSize,
              until: $startDate,
              since: $endDate,
              after: $cursor
            ) {
              nodes {
                oid
                abbreviatedOid
                committedDate
                file(path: $file) {
                  object {
                    ... on Blob {
                      oid
                    }
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      }
    }
  }`;

  let remaining = Config.maxFetched ;

  while (remaining > 0) {
    let numRetries = 1 ;
    variables.pageSize = Math.min(maxPageSize, remaining);

    const res = await fetch(Github.graphQl.api, {
      method: 'POST',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${Config.token}`
      },
      body: JSON.stringify({ query, variables })
    });

    if ((res.status == 502 || res.status == 504) && numRetries <= maxRetries) {
      const delay = 5000 * numRetries ;
      Log(`${numRetries=1?"\n":""}Bad response: ${res.status} from Github. Retrying in: ${delay / 1000}sec`);
      await new Promise(resolve => setTimeout(resolve, delay));

      numRetries++ ;
      continue ;
    }
    else if (!res.ok) U.cancel(
      `Error fetching commit history from Github | ${res.status}` +
      (numRetries > 1 ? `\nTried ${numRetries} times` : "")
    );

    const json = await res.json();
    const history = json.data.repository.ref.target.history ;

    commitHistory.push(...history.nodes);

    if (!history.pageInfo.hasNextPage) break ;

    if (variables.pageSize !== history.nodes.length) { // should never happen
      LogE("Github returned less commits than expected");
      LogE("expected:", variables.pageSize, "got:", history.nodes.length);
      break ;
    };

    variables.cursor = history.pageInfo.endCursor ;
    remaining -= variables.pageSize ;

    process.stdout.write(
      `\x1b[2K\r${U.Green(U.time())} Found ${commitHistory.length} commits and searching...`
    );
  }

  return commitHistory ;
}

async function getClasses(commitHistory) {
  const newHistory = [];

  for (const node of commitHistory) {
    const res = await fetch(`${Github.classesUrl}/${node.file.object.oid}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/vnd.github.raw+json',
        'Authorization': `Bearer ${Config.token}`,
        'X-GitHub-Api-Version': '2026-03-10' // correct use ?
      }
    });
    if (!res.ok) {
      U.cancel(`${U.Red("Failed to fetch")}:\n${url}\nResponse: ${res.status} ${res.statusText}`);
    }

    node.blobOid = node.file.object.oid ; // not actually needed
    try { node.file = await res.json() }
    catch {
      LogE("\nA Commit had invalid json formatting and was skipped.\n Oid:", node.oid);
      continue ;
    }
    node.meta = {
      host: node.file.host ?? { version: "undefined" },
      channel: node.file.channel ?? { undefined: "undefined" },
    }
    delete node.file.host ;
    delete node.file.channel ;

    newHistory.push(node);

    process.stdout.write(
      `\x1b[2K\r${U.Green(U.time())} Fetching commits ${newHistory.length}/${commitHistory.length}`
    );
  }

  return newHistory ;
}

async function cacheHistory(classHistory) {
  async function* linesGen() {
    for (const moduleObj of classHistory) yield JSON.stringify(moduleObj) + "\n" ;
  }
  await Pipeline(Readable.from(linesGen()), FS.createWriteStream(Setup.cacheFile, { encoding: 'utf8' }));
}

const OutputHistoryExample = [
  {
    oid: "6b6311609e0f57699c90f6f6eb1b2c067eadfeee",
    abbreviatedOid: "6b63116",
    committedDate: "2026-08-15T00:24:48Z",
    blobOid: "6231facf608b2752d1f1492085e63f26fcb46884",
    meta: {
      host: { version: "1.0.1115 x64 (88507)" },
      channel: { canary: "593817 (fc90e6a)" }
    },
    file: {
      998809: {
        field: "field_ccf340",
        editing: "editing_ccf340",
        titleRow: "titleRow_ccf340"
      },
      // ...
    }
  },
  // ...
];
