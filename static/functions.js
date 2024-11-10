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

function attachSwipeEventListeners() {
    const swipeLeftButton = document.getElementById("swipe-left");
    const swipeRightButton = document.getElementById("swipe-right");

    // Only attach event listeners if the elements are present
    if (swipeLeftButton) {
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
    const authContainer = document.getElementById('auth-container');
    const sessionActions = document.getElementById('session-actions');
    const loginStatus = document.getElementById('login-status');
    const userInfo = document.getElementById('user-info');
    const logoutButton = document.getElementById('logout-button');
    const createSessionBtn = document.getElementById('create-session-btn');

    if (currentUser) {
        // User is logged in
        if (authContainer) authContainer.style.display = 'none';
        if (sessionActions) sessionActions.style.display = 'flex';
        if (loginStatus) loginStatus.style.display = 'flex';
        if (logoutButton) logoutButton.style.display = 'block';

        // Update user info display if available
        if (userInfo) {
            userInfo.textContent = currentUser.is_guest
                ? 'Logged in as Guest'
                : `Welcome, ${currentUser.name}`;
        }

        // Show/hide create session button based on guest status
        if (createSessionBtn) {
            createSessionBtn.style.display = currentUser.is_guest ? 'none' : 'block';
        }
    } else {
        // No user logged in
        if (authContainer) authContainer.style.display = 'flex';
        if (sessionActions) sessionActions.style.display = 'none';
        if (loginStatus) loginStatus.style.display = 'none';
        if (logoutButton) logoutButton.style.display = 'none';
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
        } else {
            // alert(data.error || "Failed to login as guest");
        }
    })
    .catch(error => {
        console.error("Error logging in as guest:", error);
        // alert("Failed to login as guest. Please try again.");
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
            document.getElementById("session-url").textContent = `/join_session/${sessionData.session_id}`;
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
        console.error("Error casting vote:", error);
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
