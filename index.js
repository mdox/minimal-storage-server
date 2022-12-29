const express = require("express");
const cors = require("cors");
const formidable = require("formidable");
const path = require("path");
const fs = require("fs/promises");

const port = 8000;
const storagePath = path.resolve(__dirname, "storage");

const server = express();

server.use(cors());
server.use(express.json());
server.use(express.static(storagePath));

server.post("/upload/:collection", handleUpload);
server.post("/delete/:collection", handleDelete);

server.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});

// Route Functions
/** @type {express.RequestHandler} */
async function handleUpload(req, res) {
  const collection = req.params.collection;
  const collectionPath = path.join(storagePath, collection);

  /** @type {formidable.File[]} */
  const files = await new Promise((resolve, reject) => {
    formidable({
      hashAlgorithm: "md5",
      multiples: true,
      allowEmptyFiles: false,
      maxFileSize: 1024 * 1024 * 100,
    }).parse(req, (err, _fields, files) => {
      if (err) res.status(500).send(void reject(err));
      else resolve(Array.isArray(files.file) ? files.file : [files.file]);
    });
  });

  const paths = [];

  for (const file of files) {
    const filepath = path.join(
      collectionPath,
      Buffer.from(file.hash, "hex").toString("base64url"),
      file.originalFilename
    );

    try {
      await fs.mkdir(path.dirname(filepath), { recursive: true });
      await fs.copyFile(file.filepath, filepath, fs.constants.COPYFILE_EXCL);

      paths.push(filepath.replace(storagePath, ""));
    } catch (err) {
      console.error(err);
      paths.push(0);
    }
  }

  res.json(paths);
}

/** @type {express.RequestHandler} */
async function handleDelete(req, res) {
  const items = req.body;
  const collection = req.params.collection;
  const collectionPath = path.join(storagePath, collection);

  const fails = [];

  for (const key in items) {
    const index = parseInt(key);
    const item = items[index];
    const [filehash = "MISS", filename = "MISS"] = item.split("/");
    const filepath = path.join(collectionPath, filehash, filename);

    if (!filepath.startsWith(collectionPath)) {
      fails.push(index);
      continue;
    }

    try {
      await fs.unlink(filepath);
      try {
        await fs.rmdir(path.join(filepath, ".."));
        await fs.rmdir(path.join(collectionPath));
      } catch (err) {
        if (err.code !== "ENOTEMPTY") {
          console.error(err);
          fails.push(index);
        }
      }
    } catch (err) {
      if (err.code !== "ENOENT") {
        console.error(err);
      }
      fails.push(index);
    }
  }

  res.json(fails);
}
