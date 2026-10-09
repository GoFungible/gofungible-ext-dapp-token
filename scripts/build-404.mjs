import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const base = '/gofungible-ext-dapp-token/';
const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=${base}" />
    <title>Redirecting</title>
  </head>
  <body>
    Redirecting...
  </body>
</html>
`;

writeFileSync(join('dist', '404.html'), html);
console.log('Generated dist/404.html');