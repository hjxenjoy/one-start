One Start
==========

## Install

```sh
npm install --save-dev one-start
# or
yarn add -D one-start
# or
pnpm add -D one-start
```

## Add config file

create file `one-start.config.js` in project root directory

```js
const createConfig = require('one-start/createConfig')
module.exports = createConfig({
  ...
})
```

## Add script

```json
{
  "scripts": {
    "start": "one-start"
  }
}
```
