let restaurants = [];

function random_index(){
    let random = Math.floor(Math.random() * restaurants.length);
    return random
}

function create_session() {
    navigator.geolocation.getCurrentPosition(function(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        
        const data = {
            latitude: latitude,
            longitude: longitude
        };

        fetch("/create_session", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(responseData => {
            restaurants = responseData;
            $(".button-container").hide();
            $("#restaurant-info").show();
            $("#swipe-buttons").show();

            const restaurantIndex = random_index();
            displayRestaurant(restaurantIndex);
        })
    });
}

function displayRestaurant(index) {
    restaurants.splice(index, 1);
    const restaurant = restaurants[index];
    $("#restaurant-name").text(restaurant.name);
    $("#restaurant-image").attr("src", restaurant.photo_url);
    $("#restaurant-rating").text("Rating: " + restaurant.rating);
    $("#restaurant-address").text("Address: " + restaurant.address);
}

$("#swipe-left, #swipe-right").click(function() {
    const restaurantIndex = random_index();
    displayRestaurant(restaurantIndex);
});

$(document).ready(function() {
    $("#restaurant-info").hide();
    $("#swipe-buttons").hide();
});
