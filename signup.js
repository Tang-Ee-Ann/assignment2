$("#Submit").on("click", function(e) {
    event.preventDefault();
    var jsondata = {"Email": $("#Email").val(),"Username": $("#Username").val(),
        "Password": $("#Password").val() };
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": "https://ngeeannpolyshop-1312.restdb.io/rest/customer",
        "method": "POST",
        "headers": {
        "content-type": "application/json",
        "x-apikey": "61ef47c9b12f6e7084f734db",
        "cache-control": "no-cache"
        },
        "processData": false,
        "data": JSON.stringify(jsondata)
    }

    $.ajax(settings).done(function (response) {
        console.log(response);
    });
});