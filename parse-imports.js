function parseImports(content) {
    var regex = /([\/]{2}|[\/][*]).?(import|@codekit-prepend|@codekit-append).?[(]?.?["'](.*)["'].?[)]?[;]?.*?(\n[*][\/])?/g;
    var match = {};
    var results = { prepends: [], imports: [], appends: [] };

    while (match = regex.exec(content)) {
        switch (match[2]) {
            case '@codekit-prepend':
                results.prepends.push(match[3]);
            break;

            case '@codekit-append':
                results.appends.push(match[3]);
            break;

            default:
            break;
        }
        
        results.imports.push(match[3]);
    }

    return results;
}

module.exports = parseImports;
