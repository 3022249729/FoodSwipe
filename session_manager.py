import sqlite3
import random
import string
import logging
import time
from contextlib import contextmanager

DATABASE = 'sessions.db'

# Set up logging
logging.basicConfig(level=logging.DEBUG)

@contextmanager
def get_db_connection():
    """Context manager for database connections with retry logic."""
    max_attempts = 5
    attempt = 0
    while attempt < max_attempts:
        try:
            conn = sqlite3.connect(DATABASE, timeout=20.0)  # Increased timeout
            conn.row_factory = sqlite3.Row
            yield conn
            conn.close()
            break
        except sqlite3.OperationalError as e:
            attempt += 1
            if attempt == max_attempts:
                raise
            logging.warning(f"Database locked, attempt {attempt} of {max_attempts}. Retrying...")
            time.sleep(0.1 * attempt)  # Exponential backoff

def init_db():
    """Initialize the SQLite3 database and create tables if they don't exist."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute('''CREATE TABLE IF NOT EXISTS sessions (
                            session_id TEXT PRIMARY KEY,
                            name TEXT
                        )''')
        cursor.execute('''CREATE TABLE IF NOT EXISTS votes (
                            session_id TEXT,
                            restaurant_id TEXT,
                            user_id TEXT,
                            vote INTEGER,
                            FOREIGN KEY (session_id) REFERENCES sessions(session_id),
                            UNIQUE(session_id, restaurant_id, user_id)
                        )''')
        cursor.execute('''CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_session_restaurant_user
                          ON votes (session_id, restaurant_id, user_id)''')
        conn.commit()

def generate_session_id():
    """Generate a random session ID."""
    return ''.join(random.choices(string.ascii_letters + string.digits, k=6))

def create_session():
    """Create a new session and return the session ID."""
    session_id = generate_session_id()
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT INTO sessions (session_id, name) VALUES (?, ?)", 
                         (session_id, "New Session"))
            conn.commit()
            return session_id
    except sqlite3.Error as e:
        logging.error(f"Error creating session: {e}")
        raise

def join_session(session_id):
    """Verify if a session exists with the given session_id."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT session_id FROM sessions WHERE session_id = ?", 
                         (session_id,))
            result = cursor.fetchone()
            return result is not None
    except sqlite3.Error as e:
        logging.error(f"Error joining session: {e}")
        raise

def store_vote(session_id, restaurant_id, user_id, vote):
    """Store or update a vote for a restaurant in a session."""
    logging.debug(f"Attempting to store vote: session_id={session_id}, restaurant_id={restaurant_id}, user_id={user_id}, vote={vote}")
    
    if not user_id:
        raise ValueError("User ID is required")
    
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # First verify the session exists
            cursor.execute("SELECT 1 FROM sessions WHERE session_id = ?", (session_id,))
            if not cursor.fetchone():
                raise ValueError(f"Invalid session ID: {session_id}")

            # Check if user already voted for this restaurant in this session
            cursor.execute('''SELECT vote FROM votes 
                            WHERE session_id = ? AND restaurant_id = ? AND user_id = ?''',
                         (session_id, restaurant_id, user_id))
            existing_vote = cursor.fetchone()
            
            if existing_vote:
                raise ValueError("User has already voted for this restaurant in this session")

            # Store the vote
            cursor.execute('''INSERT INTO votes (session_id, restaurant_id, user_id, vote)
                            VALUES (?, ?, ?, ?)''',
                         (session_id, restaurant_id, user_id, vote))
            
            conn.commit()
            logging.debug(f"Vote stored successfully")
            return True
            
    except sqlite3.Error as e:
        logging.error(f"Database error storing vote: {e}")
        raise

def get_user_votes(session_id, user_id):
    """Retrieve all restaurants a user has voted on in a session."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''SELECT restaurant_id, vote
                            FROM votes
                            WHERE session_id = ? AND user_id = ?''',
                         (session_id, user_id))
            votes = cursor.fetchall()
            return {row[0]: row[1] for row in votes}
    except sqlite3.Error as e:
        logging.error(f"Error getting user votes: {e}")
        raise

def get_top_restaurant(session_id):
    """Retrieve the restaurant with the most positive votes in a session."""
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute('''SELECT restaurant_id, SUM(vote) as score
                            FROM votes
                            WHERE session_id = ?
                            GROUP BY restaurant_id
                            ORDER BY score DESC
                            LIMIT 1''', (session_id,))
            result = cursor.fetchone()
            if result:
                logging.debug(f"Top restaurant for session {session_id}: {result[0]}")
                return result[0]
            return None
    except sqlite3.Error as e:
        logging.error(f"Failed to retrieve top restaurant: {e}")
        return None