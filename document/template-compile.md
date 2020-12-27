## 模板编译

用到的正则：

```javascript
// https://jex.im/regulex/#!flags=&re=%5E%5Cs*(%5B%5E%5Cs%22'%3C%3E%5C%2F%3D%5D%2B)(%3F%3A%5Cs*(%3D)%5Cs*(%3F%3A%22(%5B%5E%22%5D*)%22%2B%7C'(%5B%5E'%5D*)'%2B%7C(%5B%5E%5Cs%22'%3D%3C%3E%60%5D%2B)))%3F
const attribute = /^\s*([^\s"'<>\/=]+)(?:\s*(=)\s*(?:"([^"]*)"+|'([^']*)'+|([^\s"'=<>`]+)))?/;
const ncname = `[a-zA-Z_][\\-\\.0-9_a-zA-Z]*`;
// https://jex.im/regulex/#!flags=&re=((%3F%3A%5Ba-zA-Z_%5D%5B%5C-%5C.0-9_a-zA-Z%5D*%5C%3A)%3F%5Ba-zA-Z_%5D%5B%5C-%5C.0-9_a-zA-Z%5D*)
const qnameCapture = `((?:${ncname}\\:)?${ncname})`;
// https://jex.im/regulex/#!flags=&re=%5E%3C((%3F%3A%5Ba-zA-Z_%5D%5B%5C-%5C.0-9_a-zA-Z%5D*%5C%3A)%3F%5Ba-zA-Z_%5D%5B%5C-%5C.0-9_a-zA-Z%5D*)
const startTagOpen = new RegExp(`^<${qnameCapture}`);
// https://jex.im/regulex/#!flags=&re=%5E%5Cs*(%5C%2F%3F)%3E
const startTagClose = /^\s*(\/?)>/;
// https://jex.im/regulex/#!flags=&re=%5E%3C%5C%2F((%3F%3A%5Ba-zA-Z_%5D%5B%5C-%5C.0-9_a-zA-Z%5D*%5C%3A)%3F%5Ba-zA-Z_%5D%5B%5C-%5C.0-9_a-zA-Z%5D*)%5B%5E%3E%5D*%3E
const endTag = new RegExp(`^<\\/${qnameCapture}[^>]*>`);
```
