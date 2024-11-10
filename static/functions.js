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

document.getElementById("swipe-left").addEventListener("click", function() {
    const restaurantInfo = document.getElementById("restaurant-info");
    restaurantInfo.classList.add("swipe-left");
    setTimeout(getNextRestaurant, 500); // Delay to let animation finish before changing the restaurant
});

document.getElementById("swipe-right").addEventListener("click", function() {
    const restaurantInfo = document.getElementById("restaurant-info");
    restaurantInfo.classList.add("swipe-right");
    setTimeout(getNextRestaurant, 500); // Delay to let animation finish before changing the restaurant
});

function getNextRestaurant() {
    $.get("/get_restaurant", function(data) {
        $("#restaurant-name").text(data.name);
        $("#restaurant-image").attr("src", data.image_url);
        $("#restaurant-rating").text("Rating: " + data.rating);
        $("#restaurant-address").text("Address: " + data.address);
    });

    // Reset swipe animation
    const restaurantInfo = document.getElementById("restaurant-info");
    restaurantInfo.classList.remove("swipe-left", "swipe-right");
}
