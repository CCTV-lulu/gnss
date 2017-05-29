MetronicApp.factory('alertBox', function () {
    var alertBox = function (content, id, type) {
        var boxHtml = "<div class='alert alert-" + type + " alert-dismissable' >" +
            "<button id=" + id + " type='button' class='close' data-dismiss='alert' aria-hidden='true'>" +
            "&times;" +
            "</button>" + content +
            "</div>"
        return boxHtml
    }
    return {alertBox: alertBox}

}).factory("closeBox", function ($timeout) {
    var close = function (id) {
        $timeout(function () {
            $('#' + id).click();
        }, 5000)
    }
    return {closeBox: close}
}).factory('Prompt', function(alertBox, closeBox) {
    function promptBox(boxType, boxTxt) {
        var boxId = Math.random().toString(36).substr(2)
        var Box = alertBox.alertBox(boxTxt, boxId, boxType)
        $('#remind').append(Box);
        closeBox.closeBox(boxId);
    }
    return {promptBox: promptBox}
})
//.factory