function parseImports(content) {
    var regex = /([\/]{2}|[\/][*]).?import.?[(]?.?["'](.*)["'].?[)]?[;]?.*?(\n[*][\/])?/g;
    var match = {};
    var results = [];

    while (match = regex.exec(content)) {
        results.push(match[2]);
    }

    return results;
}

module.exports = parseImports;
