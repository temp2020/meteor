//Regex for search text.
export default buildRegExp = function (search) {
    let words = search.trim().split(/[ \-\:]+/);
    let exps = _.map(words, function(word) {
      return "(?=.*" + word + ")";
    });
    let fullExp = exps.join('') + ".+";
    return new RegExp(fullExp, "i");
}