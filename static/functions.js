let restaurants = [];

function random_index() {
    let random = Math.floor(Math.random() * restaurants.length);
    return random;
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

            document.getElementById("message").textContent = "Swipe Your Decisions!";
            getNextRestaurant(); 
        });
    });
}

function getNextRestaurant() {
    if (restaurants.length === 0) return; 

    const restaurantIndex = random_index();
    const restaurant = restaurants.splice(restaurantIndex, 1)[0];

    
    const restaurantInfo = document.getElementById("restaurant-info");
    restaurantInfo.style.opacity = "0"; 

    setTimeout(() => {
        
        $("#restaurant-name").text(restaurant.name);
        const imageUrl = restaurant.photo_url || '/path/to/default-image.jpg';
        $("#restaurant-image").attr("src", imageUrl);
        $("#restaurant-rating").text("Rating: " + restaurant.rating);
        $("#restaurant-address").text("Address: " + restaurant.address);

        
        restaurantInfo.style.opacity = "1";
    }, 300); 
}


document.getElementById("swipe-left").addEventListener("click", function() {
    const restaurantInfo = document.getElementById("restaurant-info");

    
    restaurantInfo.classList.add("swipe-left");

    
    setTimeout(() => {
        restaurantInfo.classList.remove("swipe-left"); 
        getNextRestaurant();  
    }, 500); 
});


document.getElementById("swipe-right").addEventListener("click", function() {
    const restaurantInfo = document.getElementById("restaurant-info");


    restaurantInfo.classList.add("swipe-right"); 
    setTimeout(() => {
        restaurantInfo.classList.remove("swipe-right"); 
        getNextRestaurant();
    }, 500); 
});

$(document).ready(function() {
    $("#restaurant-info").hide();
    $("#swipe-buttons").hide();
});
