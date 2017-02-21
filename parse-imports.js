function parseImports(content) {
    var regex = /([\/]{2}|[\/][*]).?(import|@codekit-prepend|@codekit-append).?[(]?.?["'](.*)["'].?[)]?[;]?.*?(\n[*][\/])?/g;
    var match = {};
    var results = [];

    while (match = regex.exec(content)) {
        results.push(match[3]);
    }

    return results;
}

module.exports = parseImports;
