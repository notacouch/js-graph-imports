var parseImports = require('../parse-imports');
var assert = require("assert");
var path = require("path");

describe('parse-imports', function () {

  it('should parse single import with single quotes', function () {
    var js = "//import('app'); ";
    var result = parseImports(js);
    assert.equal(result.length, 1);
    assert.equal(result[0], "app");
  });

  it('should parse single import with double quotes', function () {
    var js = '//import("app"); ';
    var result = parseImports(js);
    assert.equal(result.length, 1);
    assert.equal(result[0], "app");
  });

  it('should parse single import with extra spaces after import', function () {
    var js = '//import("app"); ';
    var result = parseImports(js);
    assert.equal(result.length, 1);
    assert.equal(result[0], "app");
  });

  it('should parse single import with extra spaces before ;', function () {
    var js = '//import("app") ; ';
  });

  it('should parse two individual imports', function () {
    var js = '//import("app"); \n ' + 
               '//import("foo"); \n';
    var result = parseImports(js);
    ["app", "foo"].forEach(function (dep) {
      assert.equal(result.length, 2);
      assert.notEqual(result.indexOf(dep), -1);
    });       
  });

});
