let restaurants = [];

function random_index() {
    return Math.floor(Math.random() * restaurants.length);
}

function create_session() {
    navigator.geolocation.getCurrentPosition(function(position) {
        const data = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        };

        fetch("/create_session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
        $("#restaurant-image").attr("src", restaurant.photo_url || '/path/to/default-image.jpg');
        $("#restaurant-rating").text("Rating: " + restaurant.rating);
        $("#restaurant-address").html(`Address: <a href="${restaurant.maps_url}" target="_blank">${restaurant.address}</a>`);
        
        restaurantInfo.style.opacity = "1";
    }, 300); 
}

function swipeLeft() {
    handleSwipe("No", "swipe-left");
}

function swipeRight() {
    handleSwipe("Yes", "swipe-right");
}

function handleSwipe(response, buttonId) {
    const restaurantInfo = document.getElementById("restaurant-info");
    const leftButton = document.getElementById("swipe-left");
    const rightButton = document.getElementById("swipe-right");
    
    restaurantInfo.classList.add(buttonId); // Add swipe class
    if (buttonId === "swipe-left") {
        leftButton.classList.add("active-red"); // Add active-red class for left button
        rightButton.classList.remove("active"); // Ensure right button is not active
    } else if (buttonId === "swipe-right") {
        rightButton.classList.add("active"); // Add active class for right button
        leftButton.classList.remove("active-red"); // Remove active-red class from left button
    }
    
    displayResponseMessage(response);

    setTimeout(() => {
        restaurantInfo.classList.remove(buttonId); // Remove swipe class
        leftButton.classList.remove("active-red"); // Remove active-red class
        rightButton.classList.remove("active"); // Remove active class
        getNextRestaurant();  
    }, 500); 
}

function displayResponseMessage(response) {
    const responseMessage = document.getElementById("response-message");
    if (responseMessage) { 
        responseMessage.textContent = `You selected: ${response}`;
        responseMessage.style.opacity = "1"; 
        setTimeout(() => {
            responseMessage.style.opacity = "0"; 
        }, 2000); 
    } else {
        console.error('Response message element not found');
    }
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("swipe-left").addEventListener("click", swipeLeft);
    document.getElementById("swipe-right").addEventListener("click", swipeRight);

    document.addEventListener("keydown", function(event) {
        if (event.key === "ArrowLeft") {
            swipeLeft();
            document.getElementById("swipe-left").classList.add("active-red"); // Add red class for left arrow
            document.getElementById("swipe-right").classList.remove("active"); // Ensure right button is not active
        } else if (event.key === "ArrowRight") {
            swipeRight();
            document.getElementById("swipe-left").classList.remove("active-red"); // Remove red class from left arrow
        }
    });
});

$(document).ready(function() {
    $("#restaurant-info").hide();
    $("#swipe-buttons").hide();
});