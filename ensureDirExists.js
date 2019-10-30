async function ensureDirExists(dirpath) {
  const fs = require("fs").promises;
  try {
    await fs.mkdir(dirpath, { recursive: true });
  }
  catch (err) {
    if (err.code !== "EEXIST")
      throw err;
  }
}
exports.ensureDirExists = ensureDirExists;
