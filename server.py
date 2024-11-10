from flask import Flask, render_template, request, session, url_for, redirect, jsonify
from flask_socketio import SocketIO, emit, join_room
from dotenv import find_dotenv, load_dotenv
from authlib.integrations.flask_client import OAuth
from os import environ as env
from urllib.parse import quote_plus, urlencode
import random
import string
import requests
from time import sleep
import json
import os
import session_manager
import logging

app = Flask(__name__)
app.secret_key = env.get("APP_SECRET_KEY")
socketio = SocketIO(app)

sessions = {}

ENV_FILE = find_dotenv()
if ENV_FILE:
    load_dotenv(ENV_FILE)

oauth = OAuth(app)

oauth.register(
    "auth0",
    client_id=env.get("AUTH0_CLIENT_ID"),
    client_secret=env.get("AUTH0_CLIENT_SECRET"),
    client_kwargs={
        "scope": "openid profile email",
    },
    server_metadata_url=f'https://{env.get("AUTH0_DOMAIN")}/.well-known/openid-configuration'
)

def generate_token():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=6))

session_manager.init_db()

@app.route("/")
def home():
    return render_template("index.html", session=session.get('user'))

@app.route("/create_new_session", methods=["POST"])
def create_new_session():
    """Create a new session for voting."""
    session_id = session_manager.create_session()
    return jsonify({"session_id": session_id})

@app.route("/join_session/<session_id>")
def join_session(session_id):
    """Join an existing session."""
    if session_manager.join_session(session_id):
        return jsonify({"success": True})
    else:
        return jsonify({"error": "Session not found"}), 404

@app.route("/vote", methods=["POST"])
def vote():
    data = request.get_json()
    logging.debug(f"Received vote data: {data}")
    
    session_id = data.get("session_id")
    restaurant_id = data.get("restaurant_id")
    vote_value = data.get("vote")

    # Check for missing or invalid data
    if not session_id or not restaurant_id or not vote_value:
        logging.error("Missing session_id, restaurant_id, or vote value")
        return jsonify({"error": "Missing data"}), 400

    # Convert 'Yes' to 1 and 'No' to -1, handle invalid vote value
    if vote_value == 'Yes':
        vote_value = 1
    elif vote_value == 'No':
        vote_value = -1
    else:
        logging.error("Invalid vote value")
        return jsonify({"error": "Invalid vote value"}), 400

    # Attempt to store the vote
    success = session_manager.store_vote(session_id, restaurant_id, vote_value)
    if success:
        logging.info(f"Vote stored successfully for session {session_id} and restaurant {restaurant_id}")
        return jsonify({"success": True})
    else:
        logging.error("Failed to store vote in session manager")
        return jsonify({"error": "Failed to store vote"}), 500
    
@app.route("/results/<session_id>")
def results(session_id):
    """Retrieve the top restaurant based on votes."""
    top_restaurant = session_manager.get_top_restaurant(session_id)
    if top_restaurant:
        return jsonify({"top_restaurant": top_restaurant})
    else:
        return jsonify({"error": "No votes cast in this session"}), 404

@app.route("/login")
def login():
    return oauth.auth0.authorize_redirect(
        redirect_uri=url_for("callback", _external=True)
    )

@app.route("/logout")
def logout():
    session.clear()
    return redirect(
        "https://" + env.get("AUTH0_DOMAIN")
        + "/v2/logout?"
        + urlencode(
            {
                "returnTo": url_for("home", _external=True),
                "client_id": env.get("AUTH0_CLIENT_ID"),
            },
            quote_via=quote_plus,
        )
    )

@app.route("/callback", methods=["GET", "POST"])
def callback():
    token = oauth.auth0.authorize_access_token()
    session["user"] = token
    return redirect("/")


@app.route('/create_session', methods=['POST'])
def create_session():
    with open('restaurants_info.txt', 'r') as f:
        raw_data = f.read()
    restaurants = json.loads(raw_data)

    # Ensure response matches expected format in JavaScript (an object with a "restaurants" key)
    return jsonify({"restaurants": restaurants}), 200


def get_restaurants(latitude, longitude, radius=8000):
    url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
    params = {
        'location': f"{latitude},{longitude}",
        'radius': radius,
        'type': 'restaurant',
        'key': os.getenv("GOOGLE_MAPS_API_KEY")
    }
    
    restaurants = []
    while True:
        print("fetching")
        response = requests.get(url, params=params)
        data = response.json()
        results = data.get('results', [])
        for restaurant in results:
            if len(restaurant['name']) > 28:
                continue
            id = restaurant['place_id']
            name = restaurant['name']
            rating = restaurant.get('rating')
            rating_amount = restaurant.get('user_ratings_total')
            address = restaurant.get('vicinity')

            photo_reference = None
            if 'photos' in restaurant:
                photo_reference = restaurant['photos'][0].get('photo_reference')

            photo_url = None
            if photo_reference:
                photo_url = f"https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference={photo_reference}&key={os.getenv('GOOGLE_MAPS_API_KEY')}"

            restaurants.append({
                'id': id,
                'name': name,
                'rating': rating,
                'rating_amount': rating_amount,
                'address': address,
                'photo_url': photo_url,
                'maps_url': f"https://www.google.com/maps/place/?q=place_id:{id}"
            })


        token = data.get('next_page_token')
        if token:
            sleep(1.75)
            params['pagetoken'] = token
        else:
            break

    for r in range(len(restaurants)):
        print("fetching details")
        
        place_id = restaurants[r]["id"]
        url = f"https://maps.googleapis.com/maps/api/place/details/json?placeid={place_id}&key={os.getenv('GOOGLE_MAPS_API_KEY')}"
        
        response = requests.get(url)
        data = response.json().get('result', {})

        restaurants[r]["dinein"] = data.get('dine_in', False)
        restaurants[r]["delivery"] = data.get('delivery', False)
        restaurants[r]["pickup"] = data.get('curbside_pickup', False)
        restaurants[r]["takeout"] = data.get('takeout', False)
        restaurants[r]["address"] = data.get('formatted_address')

    # with open('restaurants_info.txt', 'w') as file:
    #     json.dump(restaurants, file, indent=4)
    
    # to cache data!

    return restaurants
    
if __name__ == '__main__':
    socketio.run(app, host="0.0.0.0" ,port=3000, debug=True)