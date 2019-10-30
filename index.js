const { ensureDirExists } = require("./ensureDirExists");
const  colors = require("./Colors");

var fs = require("fs").promises;
exports.fs = fs;
var fsSync = require("fs");
var mysql = require("mysql");
var Jimp = require('jimp'); 

function pad(num, size) {
    var s = num+"";
    while (s.length < size) s = "0" + s;
    return s;
}

async function blur(imagePath, targetPath, i){
    try {
        if (fsSync.existsSync(targetPath)) {
          // console.log(colors.Dim + 'Skipping ',imagePath);
          return;
        }
      } catch(err) {
        console.error(err)
    }    

    console.log('Reading ',imagePath);
    const img = await Jimp.read(imagePath); 
    
    const width = i.toprightx - i.topleftx;
    const height = i.bottomlefty - i.toplefty;
    const left = i.topleftx;
    const top = i.toplefty;   
    //pixelate function using callback function 
    img.pixelate(15, left, top, width, height, function(err){ 
        if (err) throw err; 
        console.log(colors.FgGreen + "Writing ",targetPath);
      }) 
      .write(targetPath); 
    };

async function main() {
  const targetPath = "n:/Databases/OWN/Images/Moped training/pre-label";
  await ensureDirExists(targetPath);

  const db_config = {
    host: "10.4.1.23",
    user: "scl_api.user",
    password: "scl",
    database: "scapeye"
  };

  var dbConn = mysql.createConnection(db_config);
  dbConn.connect(err => {
    if (err) {
      console.log(colors.FgRed + "error when connecting to db:", err);
    }
  });

  async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
      await callback(array[index], index, array);
    }
  }

  dbConn.query(
    `   SELECT * 
        FROM scl_image img
        JOIN scl_imageset s ON img.scl_imagesetid = s.scl_imagesetid
        JOIN scl_category cat ON cat.scl_categoryid = img.scl_categoryid
        JOIN vehicle v ON v.kenteken = img.lp
        ORDER BY len DESC
        LIMIT 8840`,
    async (error, results, fields) => {

      dbConn.destroy();
      if (error) throw error;

      const data = results;

      data.forEach(e => {
        return (e.fullPath = e.basepath + e.filename.replace(".json", ".jpg"));
      });

      await asyncForEach(data, async e => {
          const src = e.fullPath;
          const dstPath = `${targetPath}/${e.scl_category}/`;
          await ensureDirExists(dstPath);          
          const dstFile = `${pad(e.len,6)}_${e.filename.replace(/^.*[\\\/]/, '').replace(".json",".jpg")}`;
          const dst = dstPath + dstFile;                    
          blur(src,dst, e)          
      });
    }
  );

}

main();
