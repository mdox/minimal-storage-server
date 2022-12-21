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

server.post("/accessible", accessible);
server.post("/:collection", upload);
server.delete("/", deletion);

server.listen(port, () => {
  console.log(`Listening on port: ${port}`);
});

// Route Functions

/** @type {import("express").RequestHandler} */
function accessible(req, res) {
  /** @type {string[]} */
  const uriPaths = req.body;

  Promise.allSettled(
    uriPaths.map((uriPath) =>
      fs.access(path.join(storagePath, uriPath), fs.constants.R_OK)
    )
  ).then((settledResults) => {
    /** @type {boolean[]} */
    const results = settledResults.map(
      (settledResult) => settledResult.status === "fulfilled"
    );

    res.json(ResultObject(results));
  });
}

/** @type {import("express").RequestHandler} */
function upload(req, res) {
  formidable({
    hashAlgorithm: "MD5",
    multiples: true,
    allowEmptyFiles: false,
    maxFileSize: 104900000,
  }).parse(req, async (err, _fields, files) => {
    if (err) {
      res.json(ErrorObject());
      return;
    }

    const paths = (
      await Promise.allSettled(
        (Array.isArray(files.file) ? files.file : [files.file]).map(
          async (file) => {
            const filePath = path.join(
              storagePath,
              req.params.collection,
              file.hash,
              file.originalFilename
            );

            await fs.mkdir(path.dirname(filePath), {
              recursive: true,
            });

            await fs.copyFile(
              file.filepath,
              filePath,
              fs.constants.COPYFILE_EXCL
            );

            return filePath.replace(storagePath, "");
          }
        )
      )
    ).map((result) => {
      return result.value;
    });

    res.json(ResultObject(paths));
  });
}

/** @type {import("express").RequestHandler} */
function deletion(req, res) {
  /** @type {string[]} */
  const uriPaths = req.body;

  Promise.allSettled(
    uriPaths.map(async (uriPath) => {
      const [collection, id, filename] = uriPath.split("/").filter(Boolean);

      if (!collection) throw new Error("Invalid collection.");
      if (!id) throw new Error("Invalid id.");
      if (!filename) throw new Error("Invalid filename.");

      try {
        await fs.rm(path.join(storagePath, collection, id, filename));
        await fs.rmdir(path.join(storagePath, collection, id));
        await fs.rmdir(path.join(storagePath, collection));
      } catch (err) {
        if (err.code !== "ENOTEMPTY") {
          console.error(err);
          throw err;
        }
      }
    })
  ).then((settledResults) => {
    /** @type {boolean[]} */
    const results = settledResults.map(
      (settledResult) => settledResult.status === "fulfilled"
    );

    res.json(ResultObject(results));
  });
}

// Util Functions

function ResultObject(data) {
  return {
    data,
  };
}
