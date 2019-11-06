const { ensureDirExists } = require("./ensureDirExists");
const { colors } = require("./Colors");

var fs = require("fs").promises;
exports.fs = fs;
var fsSync = require("fs");
var mysql = require("mysql");
var Jimp = require("jimp");
var readCount = 0;
var writeCount = 0;
var totalCount = 0;

function pad(num, size) {
  var s = num + "";
  while (s.length < size) s = "0" + s;
  return s;
}

const log = {
  error   :msg=>console.error(colors.FgRed + msg),
  debug   :msg=>console.debug(colors.FgWhite + msg),
  success :msg=>console.log(colors.FgGreen + msg),
  info    :msg=>console.info(colors.FgBlue + msg)
}

async function blur(imagePath, targetPath, imageInfo) {
  try {
    if (fsSync.existsSync(targetPath)) {
      totalCount--;
      log.info('Skipping ' + imagePath);
      return;
    }
  } catch (err) {
    log.error(err);
  }

  console.log(
    `${colors.FgCyan}[${++readCount} / ${totalCount}] `,
    colors.FgBlue + "Reading ",
    imagePath
  );
  const img = await Jimp.read(imagePath);

  const width = imageInfo.toprightx - imageInfo.topleftx;
  const height = imageInfo.bottomlefty - imageInfo.toplefty;
  const left = imageInfo.topleftx;
  const top = imageInfo.toplefty;
  
  // console.debug( imageInfo );

  img.pixelate(15, left, top, width, height, 
    err=>{
      if (err) {
        log.error(err);
        throw err;
      }

      console.log(
        `${colors.FgCyan}[${++writeCount} / ${totalCount}] `,
        colors.FgGreen + "Writing ",
        targetPath
      );
    }).write(targetPath);
}

async function main(targetPath) {  
  await ensureDirExists(targetPath);

  const db_config = {
    ...require('./secrets'),
    ...require('./secrets.dev')
  };

  var dbConn = mysql.createConnection(db_config);
  dbConn.connect(err => {
    if (err) {
      log.error(colors.FgRed + "error when connecting to db:", err);
    }
  });

  async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  log.debug("Querying...");
  dbConn.query(
    `
    SELECT basepath, filename, len, topleftx, toplefty, toprightx, toprighty, bottomrightx, bottomrighty, bottomleftx, bottomlefty, scl_category
    FROM scl_image img
    JOIN scl_imageset s ON img.scl_imagesetid = s.scl_imagesetid
    JOIN scl_category cat ON cat.scl_categoryid = img.scl_categoryid
    JOIN vehicle v ON v.kenteken = img.lp
    WHERE img.conf > 600 AND country != ''
    -- ORDER BY len DESC
    LIMIT 0,10
    `,
    async (error, results, fields) => {
      log.debug("Querying done.");
      dbConn.destroy();
      if (error) throw error;

      const data = results;
      totalCount = data.length;

      log.debug("Updating paths...");
      data.forEach(e => {
        return (e.fullPath = e.basepath + e.filename.replace(".json", ".jpg"));
      });

      await asyncForEach(data, async e => {
        const src = e.fullPath;
        const dstPath = `${targetPath}/${e.scl_category}/`;
        await ensureDirExists(dstPath);
        const dstFile = `${pad(e.len, 6)}_${e.filename.replace(/^.*[\\\/]/, "").replace(".json", ".jpg")}`;
        const dst = dstPath + dstFile;
        blur(src, dst, e);
      });

      log.success('Done.');
      log.debug('');
    }
  );
}
if(process.argv.length > 2){
  let targetPath = process.argv[2];
  if(fsSync.exists(targetPath, 
      exists => exists
      ? main(targetPath)
      : console.error(`Error: Target path "${targetPath} not found."`)));
} else { 
  console.error(`Error: Please provide the target base folder as an argument. \nCategory folders will automatically be created under this folder.\n`);
  console.error(`Example: ${__dirname}> node index "n:/Databases/OWN/Images/Moped training/pre-label"`);
}
