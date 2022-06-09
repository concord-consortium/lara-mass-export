require('dotenv').config();

const mysql = require('mysql2');
const Papa = require("papaparse");
const fs = require('fs');
const request = require('request');
const step = process.argv[2];

const die = (message) => {
  console.log(message);
  process.exit(0);
}

const getEnvValue = (key) => {
  if (process.env[key]) {
    return process.env[key];
  }
  die(`Unknown ENV value: ${key}`);
}

const getEnv = () => {
  const env = {
    laraUrl: getEnvValue("LARA_URL"),
    laraSession: getEnvValue("LARA_SESSION"),
    dbHostname: getEnvValue("DB_HOSTNAME"),
    dbUsername: getEnvValue("DB_USERNAME"),
    dbPassword: getEnvValue("DB_PASSWORD"),
    dbPort: getEnvValue("DB_PORT"),
    waitBetweenRequests: getEnvValue("WAIT_BETWEEN_REQUESTS"),
  };
  env.waitBetweenRequests = parseInt(env.waitBetweenRequests)
  if (isNaN(env.waitBetweenRequests)) {
    env.waitBetweenRequests = 250
  }
  return env
};

const getPath = () => {
  const d = (new Date()).toUTCString().replace(",", "").split(" ");
  return `./data/${d[1]}-${d[2]}-${d[3]}`;
}

const mkdir = (path) => {
  try {
    fs.mkdirSync(path, { recursive: true });
  } catch (e) {}
}

const generateCSVs = () => {
  const env = getEnv();

  const path = getPath();
  mkdir(path);

  const connection = mysql.createConnection({
    host: env.dbHostname,
    user: env.dbUsername,
    port: env.dbPort,
    password: env.dbPassword,
    database: 'portal'
  });

  connection.promise()
    .query('select la.id, la.name, u.email from lightweight_activities la, users u where la.user_id = u.id')
    .catch(err => {
      die(`Error getting activities: ${err.toString()}`);
    })
    .then(([rows, fields]) => {
      fs.writeFileSync(`${path}/activities.csv`, Papa.unparse(rows, {delimiter: ",", header: true}));
    })
    .then(() => {
      return connection.promise().query('select s.id, s.title, u.email from sequences s, users u where s.user_id = u.id');
    })
    .catch(err => {
      die(`Error getting sequences: ${err.toString()}`);
    })
    .then(([rows, fields]) => {
      fs.writeFileSync(`${path}/sequences.csv`, Papa.unparse(rows, {delimiter: ",", header: true}));
    })
    .then(() => connection.end());
};

const parseCSV = async (filename) => {
  return new Promise((resolve) => {
    Papa.parse(fs.createReadStream(filename), {
      delimiter: ",",
      header: true,
      complete: (results) => resolve(results.data)
    })
  })
}

const getJSON = (env, type, row, rowNum, numRows) => {
  return new Promise((resolve, reject) => {
    const jar = request.jar();
    const cookie = request.cookie(`_lightweight-standalone_session=${env.laraSession}`);
    const url = `${env.laraUrl}/${type}/${row.id}/export`
    console.log(`${rowNum} of ${numRows}: ${url}`)
    jar.setCookie(cookie, url);
    request({ url, jar }, (error, res, body) => {
      if (error) {
        reject(error)
      } else if (res.statusCode == 200) {
        resolve(body)
      } else {
        reject(`${res.statusCode}: ${url}`)
      }
    });
  })
}

const awaitTimer = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), ms)
  })
}

const exportJSON = () => {
  const env = getEnv();
  const path = getPath();

  (async _ => {
    for (const type of ["activities", "sequences"]) {
      const typePath = `${path}/${type}`;
      mkdir(typePath);

      rows = await parseCSV(`${path}/${type}.csv`);
      const numRows = rows.length;
      let rowNum = 1;
      for (let row of rows) {
        try {
          const startTime = Date.now();
          const nextTime = startTime + env.waitBetweenRequests;
          const json = await getJSON(env, type, row, rowNum, numRows);
          const waitTime = Math.max(0, nextTime - Date.now())
          const filename = `${typePath}/${row.id}.json`
          fs.writeFileSync(filename, json);
          await awaitTimer(waitTime)
          rowNum++
        } catch (e) {
          console.log(e.toString())
        }
      }
    }
  })();
};

switch (step) {
  case "generate-csvs":
    generateCSVs();
    break;

  case "export-json":
    exportJSON();
    break;

  case undefined:
    console.error("Missing step option!");
    break;

  default:
    console.error("Unknown step:", step);
    break;
}