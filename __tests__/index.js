/* eslint-disable no-template-curly-in-string */

const pluginTester = require('babel-plugin-tester')
const createBabylonOptions = require('babylon-options')
const plugin = require('../index')

const babelOptions = {
  filename: 'currentFile.js',
  parserOpts: createBabylonOptions({
    stage: 2
  })
}

pluginTester({
  plugin,
  babelOptions,
  snapshot: true,
  tests: {
    'import default app.model': `import HomeModel from '../model/home';
      app.model(HomeModel);
    `,
    'import namepsace app.model': `import { HomeModel } from '../model/home';
    app.model(HomeModel);
    `,
    'require app.model': `const HomeModel = require('../model/home');
    app.model(HomeModel);
    `,
    'require app.model with member': `const HomeModel = require('../model/home').HomeModel;
    app.model(HomeModel);
    `,
    'require app.model inline': `app.model(require('../model/home'));
    `,
    'require app.model inline with member': `app.model(require('../model/home').HomeModel);
    `,
    'app.model with babel options': {
      code: `import HomeModel from '../model/home';
      dva.model(HomeModel)`,
      pluginOptions: { appNames: ['dva'] }
    },
    'should not hit hmr dva.model': `import HomeModel from '../model/home';
    dva.model(HomeModel);
    `,
    'app.model with appImport & appImportName': {
      code: `import React, { Component } from '@alipay/oc/react';
      function doModel({ app }) {
        app.model(require('../model/home').xxxx);
        app.model(require('../model/about'));
      }`,
      pluginOptions: {
        appImport: 'import { getApp } from \'@alipay/oc\';',
        appImportName: 'getApp()'
      }
    }
  }
})

