# minimal-storage-server

Server for store and manage files.

# Usage

## Upload

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

## Delete

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

## Download

`GET /download/:collection/:fileid/:filename`
