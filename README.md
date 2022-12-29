# minimal-storage-server

Server for store and manage files.

## Usage

### Upload

`POST /upload/:collection`

Request Body:

```js
// All fields name must be `file`
FormData.append("file", fileA);
FormData.append("file", fileB);
FormData.append("file", fileC);
// ...
```

Response Body:

```json
[0, "dnawnd92989834/fileB.txt", "dnawnd92989834/fileC.txt"]
```

`Response Body: if element is 0 number, the file could not be uploaded, if string value then upload path as fileid and filename. Order respects FormData file fields order. fileid is md5 hash of file in base64url encoding format.`

### Delete

`POST /delete/:collection`

Request Body:

```json
[
  ["fileid1", "filename1"],
  ["fileid2", "filename2"]
]
```

Response Body:

```json
[0, 1]
```

`Response Body array elements are indices of Request Body elements. This means delete did not work with them.`

### Download

`GET /download/:collection/:fileid/:filename`

## Testing

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MSSv2.0</title>
    <style>
      body {
        font-family: sans-serif;
        font-size: 1rem;
        line-height: 1.5;
        margin: 0;
        padding: 0.5rem;
      }

      form {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
        width: 100%;
        max-width: 768px;
      }

      form > label {
        font-weight: 600;
      }

      textarea {
        width: 100%;
        resize: vertical;
      }

      hr {
        border: 1px solid black;
        border-bottom: 0;
      }
    </style>
  </head>
  <body>
    <form id="upload" onsubmit="handleUpload(event)">
      <label>Upload</label>
      <input type="file" name="file" multiple />
      <button type="submit">Submit</button>
    </form>
    <hr />
    <form id="delete" onsubmit="handleDelete(event)">
      <label>Delete</label>
      <textarea rows="5" name="text"></textarea>
      <button type="submit">Submit</button>
    </form>
    <script>
      const STORAGE_URL = "http://localhost:8000";
      const COLLECTION = "test";

      async function handleUpload(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);

        const response = await fetch(`${STORAGE_URL}/upload/${COLLECTION}`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          console.log(await response.json());
        } else {
          console.error(await response.text());
        }
      }

      async function handleDelete(event) {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);

        const text = formData.get("text");

        const items = text.split(/\n/).map((item) => item.split("/"));

        const response = await fetch(`${STORAGE_URL}/delete/${COLLECTION}`, {
          method: "POST",
          body: JSON.stringify(items),
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          console.log(await response.json());
        } else {
          console.error(await response.text());
        }
      }
    </script>
  </body>
</html>
```
