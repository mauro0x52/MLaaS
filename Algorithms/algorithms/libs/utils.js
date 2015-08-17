var Utils = {};

Utils.cloneArray = function (arr) {
    var clone = [];
    for (var i in arr) {
        if (Array.isArray(arr[i])) {
            var inside = [];
            for (var j in arr[i]) {
                inside.push(arr[i][j]);
            }
            clone.push(inside);
        } else {
            clone.push(arr[i]);
        }
    }
    return clone;
}

module.exports = Utils;
