'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var glob = require('glob');
var parseImports = require('./parse-imports');

// resolve a js module to a path
function resolveJsPath(jsPath, loadPaths, extensions) {
  // trim js file extensions
  var re = new RegExp('(\.('+extensions.join('|')+'))$', 'i');
  var jsPathName = jsPath.replace(re, '');
  // check all load paths
  var i, j, length = loadPaths.length, scssPath, partialPath;
  for (i = 0; i < length; i++) {
    for (j = 0; j < extensions.length; j++) {
      scssPath = path.normalize(loadPaths[i] + '/' + jsPathName + '.' + extensions[j]);
      try {
        if (fs.lstatSync(scssPath).isFile()) {
          return scssPath;
        }
      } catch (e) {}
    }

    // special case for _partials
    for (j = 0; j < extensions.length; j++) {
      scssPath = path.normalize(loadPaths[i] + '/' + jsPathName + '.' + extensions[j]);
      partialPath = path.join(path.dirname(scssPath), '_' + path.basename(scssPath));
      try {
        if (fs.lstatSync(partialPath).isFile()) {
          return partialPath;
        }
      } catch (e) {}
    }
  }

  // File to import not found or unreadable so we assume this is a custom import
  return false
}

function Graph(options, dir) {
  this.dir = dir;
  this.extensions = options.extensions || [];
  this.index = {};
  this.loadPaths = _(options.loadPaths).map(function(p) {
    return path.resolve(p);
  }).value();

  if(dir) {
    var graph = this;
    _.each(glob.sync(dir+'/**/*.@('+this.extensions.join('|')+')', { dot: true, nodir: true }), function(file) {
      graph.addFile(path.resolve(file));
    });
  }
}

// add a js file to the graph
Graph.prototype.addFile = function(filepath, parent) {
  var entry = this.index[filepath] = this.index[filepath] || {
    prepends: [],
    imports: [],
    appends: [],
    importedBy: [],
    modified: fs.statSync(filepath).mtime
  };

  var resolvedParent;
  var all_imports = parseImports(fs.readFileSync(filepath, 'utf-8'));
  var imports = all_imports.imports;
  var cwd = path.dirname(filepath);
  var extensions = this.extensions;

  var i, length = imports.length, loadPaths = _([cwd, this.dir]).concat(this.loadPaths).filter().uniq().value(), resolved;

  // Codekit support
  var resolve_path_list = function(old_list, resolved_list) {
    old_list.forEach(function(path, i){
      var resolved_path = resolveJsPath(path, loadPaths, extensions);
      resolved_list[i] = resolved_path;
    });
  }
  if (all_imports.prepends.length) {
    resolve_path_list(all_imports.prepends, entry.prepends);
  }
  if (all_imports.appends.length) {
    resolve_path_list(all_imports.appends, entry.appends);
  }

  for (i = 0; i < length; i++) {
    //[this.dir, cwd].forEach(function (path) {
    //  if (path && this.loadPaths.indexOf(path) === -1) {
    //    this.loadPaths.push(path);
    //  }
    //}.bind(this));
    resolved = resolveJsPath(imports[i], loadPaths, this.extensions);
    if (!resolved) continue;

    // recurse into dependencies if not already enumerated
    if (!_.includes(entry.imports, resolved)) {
      entry.imports.push(resolved);
      this.addFile(fs.realpathSync(resolved), filepath);
    }
  }

  // add link back to parent
  if (parent) {
    resolvedParent = _.find(this.loadPaths, function(path) {
      return parent.indexOf(path) !== -1;
    });

    if (resolvedParent) {
      resolvedParent = parent.substr(parent.indexOf(resolvedParent));//.replace(/^\/*/, '');
    } else {
      resolvedParent = parent;
    }

    entry.importedBy.push(resolvedParent);
  }
};

// visits all files that are ancestors of the provided file
Graph.prototype.visitAncestors = function(filepath, callback) {
  this.visit(filepath, callback, function(err, node) {
    if (err || !node) return [];
    return node.importedBy;
  });
};

// visits all files that are descendents of the provided file
Graph.prototype.visitDescendents = function(filepath, callback) {
  this.visit(filepath, callback, function(err, node) {
    if (err || !node) return [];
    return node.imports;
  });
};

// a generic visitor that uses an edgeCallback to find the edges to traverse for a node
Graph.prototype.visit = function(filepath, callback, edgeCallback, visited) {
  filepath = fs.realpathSync(filepath);
  var visited = visited || [];
  if (!this.index.hasOwnProperty(filepath)) {
    edgeCallback('Graph doesn\'t contain ' + filepath, null);
  }
  var edges = edgeCallback(null, this.index[filepath]);

  var i, length = edges.length;
  for (i = 0; i < length; i++) {
    if (!_.includes(visited, edges[i])) {
      visited.push(edges[i]);
      callback(edges[i], this.index[edges[i]]);
      this.visit(edges[i], callback, edgeCallback, visited);
    }
  }
};

function processOptions(options) {
  return _.assign({
    loadPaths: [process.cwd()],
    extensions: ['js'],
  }, options);
}

module.exports.parseFile = function(filepath, options) {
  if (fs.lstatSync(filepath).isFile()) {
    var filepath = path.resolve(filepath);
    var options = processOptions(options);
    var graph = new Graph(options);
    graph.addFile(filepath);
    return graph;
  }
  // throws
};

module.exports.parseDir = function(dirpath, options) {
  if (fs.lstatSync(dirpath).isDirectory()) {
    var dirpath = path.resolve(dirpath);
    var options = processOptions(options);
    var graph = new Graph(options, dirpath);
    return graph;
  }
  // throws
};
