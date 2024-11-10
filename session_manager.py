import sqlite3
import random
import string
import logging

DATABASE = 'sessions.db'

# Set up logging
logging.basicConfig(level=logging.DEBUG)

def init_db():
    """Initialize the SQLite3 database and create tables if they don't exist."""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute('''CREATE TABLE IF NOT EXISTS sessions (
                        session_id TEXT PRIMARY KEY,
                        name TEXT
                    )''')
    cursor.execute('''CREATE TABLE IF NOT EXISTS votes (
                        session_id TEXT,
                        restaurant_id TEXT,
                        vote INTEGER,
                        FOREIGN KEY (session_id) REFERENCES sessions(session_id),
                        UNIQUE(session_id, restaurant_id)  -- Ensure no duplicate votes
                    )''')
    cursor.execute('''CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_session_restaurant
                      ON votes (session_id, restaurant_id)''')  # Ensure no duplicate votes
    conn.commit()
    conn.close()

def generate_session_id():
    """Generate a random session ID."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=6))

def create_session():
    """Create a new session and return the session ID."""
    session_id = generate_session_id()
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("INSERT INTO sessions (session_id, name) VALUES (?, ?)", (session_id, "New Session"))
    conn.commit()
    conn.close()
    return session_id

def join_session(session_id):
    """Verify if a session exists with the given session_id."""
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("SELECT session_id FROM sessions WHERE session_id = ?", (session_id,))
    result = cursor.fetchone()
    conn.close()
    return result is not None

def store_vote(session_id, restaurant_id, vote):
    """Store or update a vote for a restaurant in a session."""
    logging.debug(f"Attempting to store vote: session_id={session_id}, restaurant_id={restaurant_id}, vote={vote}")
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''INSERT INTO votes (session_id, restaurant_id, vote)
                          VALUES (?, ?, ?)
                          ON CONFLICT(session_id, restaurant_id)
                          DO UPDATE SET vote = excluded.vote''', (session_id, restaurant_id, vote))
        conn.commit()
        conn.close()
        logging.debug(f"Vote stored: session_id={session_id}, restaurant_id={restaurant_id}, vote={vote}")
    except sqlite3.Error as e:
        logging.error(f"Failed to store vote: {e}")
        raise

def get_top_restaurant(session_id):
    """Retrieve the restaurant with the most positive votes in a session."""
    try:
        conn = sqlite3.connect(DATABASE)
        cursor = conn.cursor()
        cursor.execute('''SELECT restaurant_id, SUM(vote) as score
                          FROM votes
                          WHERE session_id = ?
                          GROUP BY restaurant_id
                          ORDER BY score DESC
                          LIMIT 1''', (session_id,))
        result = cursor.fetchone()
        conn.close()
        if result:
            logging.debug(f"Top restaurant for session {session_id}: {result[0]}")
        return result[0] if result else None
    except sqlite3.Error as e:
        logging.error(f"Failed to retrieve top restaurant: {e}")
        return None
