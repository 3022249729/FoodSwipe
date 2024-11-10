let restaurants = [];

let sessionData = {};

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
            console.error("Error checking login status:", error);
            updateUIForLoginStatus();
        });
}

function updateSessionUI() {
    attachSwipeEventListeners();
    const authButtons = document.getElementById("auth-buttons");
    const guestJoinContainer = document.getElementById("guest-join-container");
    const createSessionBtn = document.getElementById("create-session");
    const joinSessionBtn = document.getElementById("join-session");
    
    let resultsBtn = document.getElementById("show-results");
    if (!resultsBtn) {
        resultsBtn = document.createElement("button");
        resultsBtn.id = "show-results";
        resultsBtn.className = "btn btn-primary";
        resultsBtn.textContent = "Show Results";
        resultsBtn.onclick = showResults;
        resultsBtn.style.display = 'none';
        document.body.appendChild(resultsBtn);
    }

    if (currentUser) {
        if (authButtons) authButtons.style.display = 'none';
        resultsBtn.style.display = 'block';

        if (currentUser.is_guest) {
            if (guestJoinContainer) guestJoinContainer.style.display = 'block';
            if (createSessionBtn) createSessionBtn.style.display = 'none';
            if (joinSessionBtn) joinSessionBtn.style.display = 'none';
        } else {
            if (guestJoinContainer) guestJoinContainer.style.display = 'none';
            if (createSessionBtn) createSessionBtn.style.display = 'block';
            if (joinSessionBtn) joinSessionBtn.style.display = 'block';
        }
    } else {
        if (authButtons) authButtons.style.display = 'block';
        if (guestJoinContainer) guestJoinContainer.style.display = 'none';
        if (createSessionBtn) createSessionBtn.style.display = 'none';
        if (joinSessionBtn) joinSessionBtn.style.display = 'none';
        if (resultsBtn) resultsBtn.style.display = 'none';
    }
}

function attachSwipeEventListeners() {
    const swipeLeftButton = document.getElementById("swipe-left");
    const swipeRightButton = document.getElementById("swipe-right");

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
    const authButtons = document.getElementById("auth-buttons");
    const guestJoinContainer = document.getElementById("guest-join-container");
    const createSessionBtn = document.getElementById("create-session");
    const joinSessionBtn = document.getElementById("join-session");

    if (currentUser) {
        if (authButtons) authButtons.style.display = 'none';

        if (currentUser.is_guest) {
            if (guestJoinContainer) guestJoinContainer.style.display = 'block';
            if (createSessionBtn) createSessionBtn.style.display = 'none';
            if (joinSessionBtn) joinSessionBtn.style.display = 'none';
        } else {
            if (guestJoinContainer) guestJoinContainer.style.display = 'none';
            if (createSessionBtn) createSessionBtn.style.display = 'block';
            if (joinSessionBtn) joinSessionBtn.style.display = 'block';
        }
    } else {
        if (authButtons) authButtons.style.display = 'block';
        if (guestJoinContainer) guestJoinContainer.style.display = 'none';
        if (createSessionBtn) createSessionBtn.style.display = 'none';
        if (joinSessionBtn) joinSessionBtn.style.display = 'none';
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
    if (restaurants.length === 0) {
        document.getElementById("restaurant-info").style.opacity = "0";
        setTimeout(() => {
            showResults();
            document.getElementById("restaurant-info").style.opacity = "1";
        }, 300);
        return;
    }

    const restaurantIndex = random_index();
    const restaurant = restaurants.splice(restaurantIndex, 1)[0];
    const restaurantInfo = document.getElementById("restaurant-info");
    
    restaurantInfo.setAttribute('data-restaurant-id', restaurant.id);
    restaurantInfo.style.opacity = "0"; 

    setTimeout(() => {
        $("#restaurant-name").text(restaurant.name);
        $("#restaurant-image").attr("src", restaurant.photo_url);
        $("#restaurant-rating").text("Rating: " + restaurant.rating + "⭐ (" + restaurant.rating_amount + ")");
        let options = '';
        if (restaurant.dinein) {
            options += "Dine-in: ✅ "
        } else {
            options += "Dine-in: ❌ "
        }
        if (restaurant.delivery) {
            options += "Delivery: ✅ "
        } else {
            options += "Delivery: ❌ "
        }
        if (restaurant.pickup) {
            options += "Pick-up: ✅ "
        } else {
            options += "Pick-up: ❌ "
        }
        if (restaurant.takeout) {
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
        return;
    }

    restaurantInfo.classList.add(buttonId);
    if (buttonId === "swipe-left") {
        leftButton.classList.add("active-red");
        rightButton.classList.remove("active");
    } else if (buttonId === "swipe-right") {
        rightButton.classList.add("active");
        leftButton.classList.remove("active-red");
    }
    
    displayResponseMessage(response);

    castVote(restaurantId, response);

    setTimeout(() => {
        restaurantInfo.classList.remove(buttonId);
        leftButton.classList.remove("active-red");
        rightButton.classList.remove("active");
    }, 500);
}

function displayResponseMessage(response) {
    const responseMessage = document.getElementById("response-message");
    if (responseMessage) {
        setTimeout(() => {
            responseMessage.style.opacity = "0";
        }, 2000);
    } else {
        console.error('Response message element not found');
    }
}

function restartSwiping() {
    if (restaurants.length === 0) {
        create_session();
    } else {
        const restaurantInfo = document.getElementById("restaurant-info");
        restaurantInfo.innerHTML = `
            <h2 id="restaurant-name"></h2>
            <img id="restaurant-image" src="" alt="Restaurant Image" style="max-width: 300px;">
            <p id="restaurant-rating"></p>
            <p id="restaurant-options"></p>
            <p id="restaurant-address"></p>
        `;
        document.getElementById("swipe-buttons").style.display = "block";
        getNextRestaurant();
    }
}

function showResults() {
    if (!sessionData.session_id) {
        console.error('No session ID available');
        return;
    }

    fetch(`/results/${sessionData.session_id}`)
        .then(response => response.json())
        .then(data => {
            if (!data.top_restaurant) {
                const message = "No votes recorded yet. Keep swiping!";
                // document.getElementById("restaurant-info").innerHTML = `
                //     <div class="results-container">
                //         <h2>${message}</h2>
                //         <button onclick="restartSwiping()" class="btn btn-primary">Continue Swiping</button>
                //     </div>
                // `;
                document.getElementById("swipe-buttons").style.display = "none";
                return;
            }
            
            const restaurantId = data.top_restaurant;
            fetch(`/restaurant/${restaurantId}`)
                .then(response => response.json())
                .then(restaurant => {
                    const resultsHtml = `
                        <div class="results-container">
                            <h2>Top Match!</h2>
                            <div class="restaurant-card">
                                <img src="${restaurant.photo_url}" alt="${restaurant.name}" style="max-width: 300px;">
                                <h3>${restaurant.name}</h3>
                                <p>Rating: ${restaurant.rating}⭐ (${restaurant.rating_amount})</p>
                                <p><a href="${restaurant.maps_url}" target="_blank">${restaurant.address}</a></p>
                            </div>
                        </div>
                    `;
                    
                    document.getElementById("restaurant-info").innerHTML = resultsHtml;
                    document.getElementById("swipe-buttons").style.display = "none";
                });
        })
        .catch(error => {
            console.error("Error fetching results:", error);
            displayHighestRatedRestaurant();
        });
}

function displayHighestRatedRestaurant() {
    const highestRatedRestaurant = restaurants.reduce((highest, restaurant) => {
        return (restaurant.rating > highest.rating) ? restaurant : highest;
    }, restaurants[0]);

    const resultsHtml = `
        <div class="results-container">
            <h2>Top Match!</h2>
            <div class="restaurant-card">
                <img src="${highestRatedRestaurant.photo_url}" alt="${highestRatedRestaurant.name}" style="max-width: 300px;">
                <h3>${highestRatedRestaurant.name}</h3>
                <p>Rating: ${highestRatedRestaurant.rating}⭐ (${highestRatedRestaurant.rating_amount})</p>
                <p><a href="${highestRatedRestaurant.maps_url}" target="_blank">${highestRatedRestaurant.address}</a></p>
            </div>
        </div>
    `;

    document.getElementById("restaurant-info").innerHTML = resultsHtml;
    document.getElementById("swipe-buttons").style.display = "none";
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
            startSession();
        });
    if (restaurants.length == 0) {
        create_session();
    }
}

function joinSession() {
    const sessionId = prompt("Enter session ID:");
    if (!sessionId) return;
    
    sessionData = { session_id: sessionId };
    
    startSession();
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

    getNextRestaurant();

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
        } else {
            throw new Error(data.error || "Failed to record vote");
        }
    })
    .catch(error => {
        console.error("Error recording vote:", error);
    });
}

document.addEventListener("DOMContentLoaded", function() {
    checkLoginStatus();
});

$(document).ready(function() {
    $("#restaurant-info").hide();
    $("#swipe-buttons").hide();
});
