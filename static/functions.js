function create_session() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(send_location);
    } else {
        console.log("Geolocation is not supported, please update your browser to the lastest version.");
        return
    }
}

function send_location(position) {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    
    const data = {
        latitude: latitude,
        longitude: longitude
    };

    const request = new XMLHttpRequest();
    request.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            const restaurants = JSON.parse(this.responseText);
            console.log('Restaurants data:', restaurants);
        }
    };
    
    request.open("POST", "/create_session");
    request.setRequestHeader('Content-Type', 'application/json');
    request.send(JSON.stringify(data));
}