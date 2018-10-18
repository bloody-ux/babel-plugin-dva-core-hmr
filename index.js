'use-strict'

const visited = Symbol('visited')
const imported = Symbol('imported')

module.exports = function dvaCoreHmrPlugin({
  types: t,
  template
}) {
  function getImportRequirePath(identifierName, scope) {
    if (scope.hasBinding(identifierName)) {
      const binding = scope.getBinding(identifierName)
      if (binding) {
        const parent = binding.path.parent

        if (t.isImportDeclaration(parent)) { // import xxx from 'xxx' or import { xxx } from 'xxx'
          return parent.source.value
        } else if (t.isVariableDeclaration(parent)) {
          const declarator = findDeclarator(parent.declarations, identifierName)
          if (declarator) {
            if (isRequire(declarator.init)) { // const xxx = require('xxx')
              return getArguments0(declarator.init)
            } else if (isRequireMember(declarator.init)) { // const xxx = require('xxx').xxx
              return getArguments0(declarator.init.object)
            }
          }
        }
      }
    }
    return null
  }

  function isModelCall(node, appNames = ['app']) {
    if (!t.isMemberExpression(node)) return false
    const {
      object,
      property
    } = node
    return (
      (t.isIdentifier(property) && property.name === 'model') &&
      (t.isIdentifier(object) && appNames.indexOf(object.name) >= 0)
    )
  }


  function isRequire(node) {
    return t.isCallExpression(node) &&
      t.isIdentifier(node.callee) &&
      node.callee.name === 'require'
  }

  function isRequireMember(node) {
    if (!t.isMemberExpression(node)) return false
    const {
      object,
      property
    } = node
    return isRequire(object) &&
      t.isIdentifier(property) &&
      property.name
  }

  function findDeclarator(declarations, identifier) {
    // eslint-disable-next-line
    for (const d of declarations) {
      if (t.isIdentifier(d.id) && d.id.name === identifier) {
        return d
      }
    }

    return null
  }

  function getArguments0(node) {
    if (t.isLiteral(node.arguments[0])) {
      return node.arguments[0].value
    }

    return null
  }

  function getRequirePath(node, scope) {
    switch (node.type) {
      // app.model(require('xxxx))
      case 'CallExpression':
        {
          const path = getArguments0(node)
          if (path) {
            return path
          }
          break
        }
      case 'Identifier':
        {
          const path = getImportRequirePath(node.name, scope)
          if (path) {
            return path
          }
          break
        }
      // app.model(require('xxxx).xxxxx)
      case 'MemberExpression':
        {
          if (isRequireMember(node)) {
            const path = getArguments0(node.object)
            if (path) {
              return path
            }
          }
          break
        }
      default:
        break
    }

    return null
  }

  const hmrTemplate = template(`
  if (module.hot) {
    module.hot.accept('MODELPATH', () => {
      try {
        let newModel = require('MODELPATH');
        if (newModel.default) newModel = newModel.default;
        APPNAME.replaceModel(newModel);
      } catch(e) {
        console.error(e);
      }
    });
  }`)

  return {
    name: 'dva-core-hmr',
    visitor: {
      CallExpression(path) {
        if (path[visited]) return
        path[visited] = true

        const { callee, arguments: args } = path.node

        const isDva =
          this.file.opts.filename &&
          (
            this.file.opts.filename.indexOf('/node_modules/_dva-core@') >= 0 || // tnpm
            this.file.opts.filename.indexOf('/node_modules/_dva@') >= 0 ||
            this.file.opts.filename.indexOf('/node_modules/dva-core/') >= 0 || // npm
            this.file.opts.filename.indexOf('/node_modules/dva/') >= 0
          )

        // don't do anything within dva itself
        if (!isDva && isModelCall(callee, this.opts.appNames)) {
          const modelPath = getRequirePath(args[0], path.scope)

          // if modelPath can be found directly
          if (modelPath) {
            if (!this.opts.appImport || !this.opts.appImportName) {
              const hmrExpression = hmrTemplate({
                MODELPATH: t.stringLiteral(modelPath),
                APPNAME: callee.object
              })

              path.parentPath.insertAfter(hmrExpression)
            } else {
              const programPath = path.findParent(p => p.isProgram())
              if (!programPath[imported]) {
                const importer = template(this.opts.appImport)
                programPath.node.body.push(importer({}))
                programPath[imported] = true
              }

              const hmrExpression = hmrTemplate({
                MODELPATH: t.stringLiteral(modelPath),
                APPNAME: t.identifier(this.opts.appImportName)
              })

              programPath.node.body.push(hmrExpression)
            }
          }
        }
      }
    }
  }
}
