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
    <title>MSS Tester</title>
    <style>
      body {
        font-family: sans-serif;
        font-size: 1rem;
        line-height: 1.5;
      }

      form {
        margin: 0.5rem 0 0.5rem;
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 0.5rem;
      }
    </style>
  </head>
  <body>
    <form id="uploadForm" onsubmit="handleSubmitForUpload(event)">
      <span>Upload</span>
      <input type="file" name="file" multiple />
      <button type="submit">Submit</button>
    </form>

    <form id="deleteForm" onsubmit="handleSubmitForDelete(event)">
      <span>Delete</span>
      <textarea name="file"></textarea>
      <button type="submit">Submit</button>
    </form>

    <script>
      async function handleSubmitForDelete(event) {
        event.preventDefault();

        const form = document.getElementById("deleteForm");
        const formData = new FormData(form);
        const text = formData.get("file");

        const paths = text.split(/\n/);

        const response = await fetch("http://localhost:8000/delete/test", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(paths),
        });

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            console.log(data.data);
          }
        }
      }

      async function handleSubmitForUpload(event) {
        event.preventDefault();

        const form = document.getElementById("uploadForm");

        const response = await fetch("http://localhost:8000/upload/test", {
          method: "POST",
          body: new FormData(form),
        });

        if (response.ok) {
          const data = await response.json();

          if (data.success) {
            console.log(data.data);
          }
        }
      }
    </script>
  </body>
</html>
```
