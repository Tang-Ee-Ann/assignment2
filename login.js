$("#Submit").on("click", function(e) {
    event.preventDefault();
    var jsondata = { "Username" : $("#Username-Email").val(), "Password" :
        $("#Password").val() };
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": "https://ngeeannpolyshop-1312.restdb.io/rest/customer?q=" + JSON.stringify(jsondata),
        "method": "GET",
        "headers": {
        "content-type": "application/json",
        "x-apikey": "61ef47c9b12f6e7084f734db",
        "cache-control": "no-cache"
        }
    }

    $.ajax(settings).done(function (response) {
        console.log(response);
        if (1 == response.length) {
            var rand_session_id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
            console.log(response);
            jsondata = { customer_id : response[0]._id, session_id : rand_session_id };
            console.log(jsondata);
            settings = {
                "async": true,
                "crossDomain": true,
                "url": "https://ngeeannpolyshop-1312.restdb.io/rest/session",
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
                localStorage.setItem('session_id', rand_session_id);
                window.location.href = "index.html";
            });
        }
    });
});