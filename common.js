function checkSignIn(location) {
    session_id = localStorage.getItem('session_id');
    if (undefined == session_id) window.location.href = location;
    var settings = {
        "async": true,
        "crossDomain": true,
        "url": "https://ngeeannpolyshop-1312.restdb.io/rest/session?q=" + JSON.stringify({}),
        "method": "GET",
        "headers": {
          "content-type": "application/json",
          "x-apikey": "61ef47c9b12f6e7084f734db",
          "cache-control": "no-cache"
        }
      }
      
      $.ajax(settings).done(function (response) {
            if (0 == response.length) window.location.href = location;
      });
}