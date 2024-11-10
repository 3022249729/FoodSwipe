let restaurants = [];
let sessionData = {}; // Store session data globally

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
            sessionData["restaurants"] = responseData; // Store session data
            console.log("Session data after creation 1:", sessionData); // Debugging line
            restaurants = responseData.restaurants;
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

        // Store restaurant data on the session so we can reference it during swipes
        restaurantInfo.setAttribute('data-restaurant-id', restaurant.id);
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
    
    const restaurantId = restaurantInfo.getAttribute('data-restaurant-id');
    
    if (!restaurantId) {
        console.error('No restaurant ID found!');
        return;
    }

    // Call the function to cast the vote
    castVote(restaurantId, response);

    restaurantInfo.classList.add(buttonId);
    if (buttonId === "swipe-left") {
        leftButton.classList.add("active-red");
        rightButton.classList.remove("active");
    } else if (buttonId === "swipe-right") {
        rightButton.classList.add("active");
        leftButton.classList.remove("active-red");
    }
    
    displayResponseMessage(response);

    setTimeout(() => {
        restaurantInfo.classList.remove(buttonId);
        leftButton.classList.remove("active-red");
        rightButton.classList.remove("active");
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

function createNewSession() {
    fetch('/create_new_session', { method: 'POST' })
        .then(response => response.json())
        .then(data => {
            sessionData["session_id"] = data.session_id; // Store new session data
            console.log("Session data after creation:", sessionData); // Debugging line
            document.getElementById("session-link").style.display = "block";
            document.getElementById("session-url").href = `/join_session/${sessionData.session_id}`;
            document.getElementById("session-url").textContent = `/join_session/${sessionData.session_id}`;
            startSession(); // Start session after creating
        });
}

function joinSession() {
    const sessionId = prompt("Enter session ID:");
    fetch(`/join_session/${sessionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                sessionData = { session_id: sessionId }; // Update session data with session ID
                console.log("Session data after joining:", sessionData); // Debugging line
                alert("Joined session successfully!");
                startSession();
            } else {
                alert(data.error);
            }
        });
}

function startSession() {
    // Hide create/join buttons and show swipe interface
    document.getElementById("create-session").style.display = "none";
    document.getElementById("join-session").style.display = "none";
    document.getElementById("restaurant-info").style.display = "block";
    document.getElementById("swipe-buttons").style.display = "block";
    create_session(); // Start swiping
}

function castVote(restaurantId, vote) {
    console.log("vote", sessionData);
    const sessionId = sessionData.session_id; // Retrieve session ID from session data
    console.log("Session ID:", sessionId); // Debugging line
    console.log("Restaurant ID:", restaurantId); // Debugging line
    console.log("Vote:", vote); // Debugging line
    fetch("/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, restaurant_id: restaurantId, vote: vote })
    }).then(response => response.json())
      .then(data => {
          if (data.success) {
              alert("Vote recorded!");
          } else {
              alert("There was an error casting your vote.");
          }
      });
}

document.addEventListener("DOMContentLoaded", function() {
    document.getElementById("swipe-left").addEventListener("click", swipeLeft);
    document.getElementById("swipe-right").addEventListener("click", swipeRight);

    document.addEventListener("keydown", function(event) {
        if (event.key === "ArrowLeft") {
            swipeLeft();
            document.getElementById("swipe-left").classList.add("active-red");
            document.getElementById("swipe-right").classList.remove("active");
        } else if (event.key === "ArrowRight") {
            swipeRight();
            document.getElementById("swipe-left").classList.remove("active-red");
        }
    });
});

$(document).ready(function() {
    $("#restaurant-info").hide();
    $("#swipe-buttons").hide();
});
