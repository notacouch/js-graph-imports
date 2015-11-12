
var assert = require("assert");
var path = require("path");

var fixtures = path.resolve("test/fixtures");
var files = {
  'a.js': path.join(fixtures, 'a.js'),
  'b.js': path.join(fixtures, 'b.js'),
  '_c.js': path.join(fixtures, '_c.js'),
}

describe('js-graph', function(){
  var jsGraph = require('../js-graph');

  describe('parsing a graph of all js files', function(){
    var graph = jsGraph.parseDir(fixtures, {loadPaths: [fixtures]});

    it('should have all files', function(){
      assert.equal(Object.keys(files).length, Object.keys(graph.index).length);
    })

    it('should have the correct imports for a.js', function() {
      assert.deepEqual([files['b.js']], graph.index[files['a.js']].imports);
    });

    it('should have the correct importedBy for _c.js', function() {
      assert.deepEqual([files['b.js']], graph.index[files['_c.js']].importedBy);
    });

  
  });
});
