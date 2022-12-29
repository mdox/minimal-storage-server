const express = require("express");
const cors = require("cors");
const formidable = require("formidable");
const z = require("zod").z;
const fs = require("fs/promises");
const path = require("path");

const FILES_MAX_SIZE = 1024 * 1024 * 100;
const FILES_NAX_COUNT = 100;
const PORT = 8000;
const STORAGE_PATH = path.resolve(__dirname, "_storage");
const UPLOAD_PATH = path.resolve(__dirname, "_upload");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/download", express.static(STORAGE_PATH));

app.post(
  "/delete/:collection",
  validate(
    z.object({
      params: z.object({ collection: z.string().min(1).max(255) }),
      body: z.string().min(1).max(255).array().length(2).array(),
    })
  ),
  async (req, res) => {
    const collection = req.params.collection;
    const items = req.body;

    const collectionDir = path.join(STORAGE_PATH, collection);

    /** @type {number[]} */
    const failIndices = [];

    for (const itemKey in items) {
      const itemIndex = parseInt(itemKey);
      const [fileid, filename] = items[itemIndex];
      const filepath = path.join(collectionDir, fileid, filename);
      const filedir = filepath.slice(0, -filename.length - 1);

      try {
        await fs.unlink(filepath);
      } catch (err) {
        console.error(err);
        failIndices.push(itemIndex);
      }

      try {
        await fs.rmdir(filedir);
        await fs.rmdir(collectionDir);
      } catch (err) {
        if (err.code !== "ENOTEMPTY") console.error(err);
      }
    }

    res.json(failIndices);
  }
);

app.post(
  "/upload/:collection",
  validate(
    z.object({
      params: z.object({ collection: z.string().min(1).max(255) }),
    })
  ),
  async (req, res) => {
    try {
      const collection = req.params.collection;

      await fs.mkdir(UPLOAD_PATH, { recursive: true });

      /** @type {formidable.File[]} */
      const files = await new Promise((resolve, reject) => {
        formidable({
          allowEmptyFiles: false,
          hashAlgorithm: "md5",
          maxFileSize: FILES_MAX_SIZE,
          maxFiles: FILES_NAX_COUNT,
          multiples: true,
          uploadDir: UPLOAD_PATH,
        }).parse(req, (err, _fields, { file }) => {
          if (err) reject(err);
          else resolve(Array.isArray(file) ? file : [file]);
        });
      });

      /** @type {(string|0)[]} */
      const results = [];

      for (const file of files) {
        const fileid = Buffer.from(file.hash, "hex").toString("base64url");
        const filename = file.originalFilename;
        const filepath = path.join(STORAGE_PATH, collection, fileid, filename);
        const filedir = filepath.slice(0, -filename.length - 1);

        try {
          await fs.mkdir(filedir, { recursive: true });
          await fs.copyFile(
            file.filepath,
            filepath,
            fs.constants.COPYFILE_EXCL
          );
          await fs.unlink(file.filepath);
          results.push(fileid);
        } catch (err) {
          if (err.code !== "EEXIST") console.error(err);
          results.push(0);
        }
      }

      res.json(results);
    } catch (err) {
      console.error(err);
      res.status(500).send(null);
    }
  }
);

app.listen(PORT, function () {
  console.log("Server listening on port " + PORT + " ...");
});

// Utils
function validate(schema) {
  return (req, res, next) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (err) {
      return res.status(400).send(err.errors);
    }
  };
}
