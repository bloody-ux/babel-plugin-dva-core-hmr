# babel-plugin-dva-core-hmr

<p>
  <a href="https://www.npmjs.com/package/babel-plugin-dva-core-hmr">
    <img src="https://img.shields.io/teamcity/codebetter/bt428.svg" alt="Build Status" />
  </a>

  <a href="https://www.npmjs.com/package/babel-plugin-dva-core-hmr">
    <img src="https://img.shields.io/npm/l/express.svg" alt="License" />
  </a>

  <a href="https://www.npmjs.com/package/babel-plugin-dva-core-hmr">
    <img src="https://img.shields.io/badge/dependencies-none-brightgreen.svg" alt="No Dependencies" />
  </a>
</p>

HMR support for dva-core/dva

## Installation

### yarn
```
yarn add babel-plugin-dva-core-hmr
```

### npm 
```
npm install babel-plugin-dva-core-hmr
```

*.babelrc:*
```js
{
  "plugins": ["dva-core-hmr"]
}
```


## What it does

It will add HMR code for `app.model` call. require `"dva-core": "^1.4.0"`

Taking from the [test snapshots](./__tests__/__snapshots__/index.js.snap), it does this:

```js
import HomeModel from '../model/home';
      app.model(HomeModel)

      ↓ ↓ ↓ ↓ ↓ ↓

import HomeModel from '../model/home';
app.model(HomeModel);

if (module.hot) {
  module.hot.accept("../model/home", () => {
    try {
      let newModel = require("../model/home");

      if (newModel.default) newModel = newModel.default;
      app.replaceModel(newModel);
    } catch (e) {
      console.error(e);
    }
  });
}
```

> For more usages, please find the detail in `./__tests__/index.js`


## Options

`appNames`：what dva-core/dva instance names should be matched. default: `['app']`
