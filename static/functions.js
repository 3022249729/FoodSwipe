let restaurants = [];
let sessionData = {}; // Store session data globally

function random_index() {
    return Math.floor(Math.random() * restaurants.length);
}

let currentUser = null;

function checkLoginStatus() {
    fetch('/check_login_status')
        .then(response => response.json())
        .then(data => {
            currentUser = data.user;
            updateUIForLoginStatus();
            if (currentUser) {
                attachSwipeEventListeners();
            }
        })
        .catch(error => {
            updateUIForLoginStatus();
        });
}

function updateSessionUI() {
    attachSwipeEventListeners();
    const authButtons = document.getElementById("auth-buttons");
    const guestJoinContainer = document.getElementById("guest-join-container");
    const createSessionBtn = document.getElementById("create-session");
    const joinSessionBtn = document.getElementById("join-session");

    if (currentUser) {
        // Hide auth buttons regardless of user type
        if (authButtons) authButtons.style.display = 'none';

        if (currentUser.is_guest) {
            // Guest user - only show join container
            if (guestJoinContainer) guestJoinContainer.style.display = 'block';
            if (createSessionBtn) createSessionBtn.style.display = 'none';
            if (joinSessionBtn) joinSessionBtn.style.display = 'none';
        } else {
            // Regular user - show create/join buttons in header
            if (guestJoinContainer) guestJoinContainer.style.display = 'none';
            if (createSessionBtn) createSessionBtn.style.display = 'block';
            if (joinSessionBtn) joinSessionBtn.style.display = 'block';
        }
    } else {
        // No user logged in - show auth buttons, hide everything else
        if (authButtons) authButtons.style.display = 'block';
        if (guestJoinContainer) guestJoinContainer.style.display = 'none';
        if (createSessionBtn) createSessionBtn.style.display = 'none';
        if (joinSessionBtn) joinSessionBtn.style.display = 'none';
    }
}

function attachSwipeEventListeners() {
    const swipeLeftButton = document.getElementById("swipe-left");
    const swipeRightButton = document.getElementById("swipe-right");

    // Only attach event listeners if the elements are present
    if (swipeLeftButton) {
        console.log("swipeLeftButton");
        swipeLeftButton.addEventListener("click", swipeLeft);
    }

    if (swipeRightButton) {
        swipeRightButton.addEventListener("click", swipeRight);
    }

    // Attach keyboard listeners
    document.addEventListener("keydown", function(event) {
        if (event.key === "ArrowLeft" && swipeLeftButton) {
            swipeLeft();
            swipeLeftButton.classList.add("active-red");
            swipeRightButton.classList.remove("active");
        } else if (event.key === "ArrowRight" && swipeRightButton) {
            swipeRight();
            swipeLeftButton.classList.remove("active-red");
        }
    });
}

function updateUIForLoginStatus() {
    if (currentUser) {
        console.log("logged in");
        
        // Update session-related UI elements
        updateSessionUI();

        // Make sure restaurant info and swipe buttons are initially hidden
        $("#restaurant-info").hide();
        $("#swipe-buttons").hide();
    } else {
        // No user logged in
        updateSessionUI();
    }
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

function loginAsGuest() {
    fetch('/guest_login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = {
                ...data.user,
                is_guest: true
            };
            updateUIForLoginStatus();
            attachSwipeEventListeners();
        } else {
            console.error('Failed to login as guest');
        }
    })
    .catch(error => {
        console.error("Error logging in as guest:", error);
    });
}

function getNextRestaurant() {
    if (restaurants.length === 0) return; 

    const restaurantIndex = random_index();
    const restaurant = restaurants.splice(restaurantIndex, 1)[0];
    const restaurantInfo = document.getElementById("restaurant-info");
    
    restaurantInfo.setAttribute('data-restaurant-id', restaurant.id); // Set restaurant ID
    restaurantInfo.style.opacity = "0"; 

    setTimeout(() => {
        $("#restaurant-name").text(restaurant.name);
        $("#restaurant-image").attr("src", restaurant.photo_url);
        $("#restaurant-rating").text("Rating: " + restaurant.rating + "⭐ (" + restaurant.rating_amount + ")");
        let options = '';
        if (restaurant.dinein){
            options += "Dine-in: ✅ "
        } else {
            options += "Dine-in: ❌ "
        }
        if (restaurant.delivery){
            options += "Delivery: ✅ "
        } else {
            options += "Delivery: ❌ "
        }
        if (restaurant.pickup){
            options += "Pick-up: ✅ "
        } else {
            options += "Pick-up: ❌ "
        }
        if (restaurant.takeout){
            options += "Takeout: ✅ "
        } else {
            options += "Takeout: ❌ "
        }
        $("#restaurant-options").text(options);
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
    
    const restaurantId = restaurantInfo.getAttribute('data-restaurant-id');
    
    if (!restaurantId) {
        console.error('No restaurant ID found!');
        // alert('Error: No restaurant selected');
        return;
    }

    // Update UI to show response
    restaurantInfo.classList.add(buttonId);
    if (buttonId === "swipe-left") {
        leftButton.classList.add("active-red");
        rightButton.classList.remove("active");
    } else if (buttonId === "swipe-right") {
        rightButton.classList.add("active");
        leftButton.classList.remove("active-red");
    }
    
    displayResponseMessage(response);

    // Cast the vote
    castVote(restaurantId, response);

    // Remove animation classes after delay
    setTimeout(() => {
        restaurantInfo.classList.remove(buttonId);
        leftButton.classList.remove("active-red");
        rightButton.classList.remove("active");
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
            document.getElementById("session-url").textContent = `${sessionData.session_id}`;
            startSession(); // Start session after creating
        });
}

function joinSession() {
    const sessionId = prompt("Enter session ID:");
    if (!sessionId) return;

    fetch(`/join_session/${sessionId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                sessionData = { session_id: sessionId };
                // alert("Joined session successfully!");
                startSession();
            } else {
                // alert(data.error || "Failed to join session");
            }
        })
        .catch(error => {
            console.error("Error joining session:", error);
            // alert("Failed to join session. Please try again.");
        });
}

function startSession() {
    const authButtons = document.getElementById("auth-buttons");
    const guestJoinContainer = document.getElementById("guest-join-container");
    const restaurantInfo = document.getElementById("restaurant-info");
    const swipeButtons = document.getElementById("swipe-buttons");
    const createSessionButton = document.getElementById("create-session");
    const joinSessionButton = document.getElementById("join-session");

    if (authButtons) authButtons.style.display = "none";
    if (guestJoinContainer) guestJoinContainer.style.display = "none";
    if (restaurantInfo) restaurantInfo.style.display = "block";
    if (swipeButtons) swipeButtons.style.display = "block";
    if (createSessionButton) createSessionButton.style.display = "none";
    if (joinSessionButton) joinSessionButton.style.display = "none";

    create_session();
}

function castVote(restaurantId, vote) {
    if (!sessionData.session_id) {
        console.error('No session ID available');
        return;
    }

    if (!restaurantId) {
        console.error('No restaurant ID provided');
        return;
    }

    const voteData = {
        session_id: sessionData.session_id,
        restaurant_id: restaurantId,
        vote: vote
    };

    console.log("Casting vote:", voteData);

    fetch("/vote", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
        },
        body: JSON.stringify(voteData)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log("Vote recorded successfully");
            // Only proceed to next restaurant if vote was successful
            getNextRestaurant();
        } else {
            throw new Error(data.error || "Failed to record vote");
        }
    })
    .catch(error => {
        // console.error("Error casting vote:", error); // unique constraint
        getNextRestaurant();
        // alert(`Error recording vote: ${error.message || "Unknown error occurred"}`);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    checkLoginStatus();
});

$(document).ready(function() {
    $("#restaurant-info").hide();
    $("#swipe-buttons").hide();
});
