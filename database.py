 # ========================================
# SINDH ICE FACTORY - Database Setup
# ========================================

import sqlite3
import hashlib
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'sindh_ice.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users Table (Login)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    ''')

    # Default admin user (password: admin123)
    default_pass = hashlib.sha256('admin123'.encode()).hexdigest()
    cursor.execute('''
        INSERT OR IGNORE INTO users (username, password)
        VALUES (?, ?)
    ''', ('admin', default_pass))

    # Dealers Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS dealers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT,
            cnic TEXT,
            location TEXT,
            address TEXT,
            balance REAL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Transactions Table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            serial_number TEXT UNIQUE,
            dealer_id INTEGER,
            dealer_name TEXT,
            type TEXT,
            qty REAL DEFAULT 0,
            price REAL DEFAULT 0,
            total REAL DEFAULT 0,
            reference TEXT,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (dealer_id) REFERENCES dealers(id)
        )
    ''')

    conn.commit()
    conn.close()
    print("✅ Database ready!")

# ── Serial Number Generator ──
 def generate_serial():
    conn = get_db()
    # Max serial number se next generate karo
    last = conn.execute('''
        SELECT serial_number FROM transactions
        WHERE serial_number LIKE "REC-%"
        ORDER BY id DESC LIMIT 1
    ''').fetchone()
    conn.close()
    if last:
        try:
            num = int(last['serial_number'].split('-')[1])
            return f"REC-{str(num + 1).zfill(4)}"
        except:
            pass
    return "REC-0001"

# ── User Functions ──
def verify_user(username, password):
    conn = get_db()
    hashed = hashlib.sha256(password.encode()).hexdigest()
    user = conn.execute(
        'SELECT * FROM users WHERE username=? AND password=?',
        (username, hashed)
    ).fetchone()
    conn.close()
    return dict(user) if user else None

# ── Dealer Functions ──
def get_all_dealers():
    conn = get_db()
    dealers = conn.execute(
        'SELECT * FROM dealers ORDER BY name'
    ).fetchall()
    conn.close()
    return [dict(d) for d in dealers]

def get_dealer(id):
    conn = get_db()
    dealer = conn.execute(
        'SELECT * FROM dealers WHERE id = ?', (id,)
    ).fetchone()
    conn.close()
    return dict(dealer) if dealer else None

def add_dealer(name, phone, cnic, location, address):
    conn = get_db()
    conn.execute('''
        INSERT INTO dealers (name, phone, cnic, location, address)
        VALUES (?, ?, ?, ?, ?)
    ''', (name, phone, cnic, location, address))
    conn.commit()
    conn.close()

def update_dealer(id, name, phone, cnic, location, address):
    conn = get_db()
    conn.execute('''
        UPDATE dealers
        SET name=?, phone=?, cnic=?, location=?, address=?
        WHERE id=?
    ''', (name, phone, cnic, location, address, id))
    conn.commit()
    conn.close()

def delete_dealer(id):
    conn = get_db()
    conn.execute(
        'UPDATE transactions SET dealer_id=NULL WHERE dealer_id=?',
        (id,)
    )
    conn.execute('DELETE FROM dealers WHERE id=?', (id,))
    conn.commit()
    conn.close()

 def update_dealer_balance(dealer_id, type, amount):
    conn = get_db()
    dealer_id = int(dealer_id)
    if type == 'Credit':
        conn.execute('''
            UPDATE dealers SET balance = balance + ?
            WHERE id = ?
        ''', (float(amount), dealer_id))
    elif type == 'Payment':
        conn.execute('''
            UPDATE dealers SET balance = balance - ?
            WHERE id = ?
        ''', (float(amount), dealer_id))
    conn.commit()
    conn.close()

# ── Transaction Functions ──
def add_transaction(dealer_id, dealer_name,
                    type, qty, price, total,
                    reference, date):
    serial = generate_serial()
    conn = get_db()
    conn.execute('''
        INSERT INTO transactions
        (serial_number, dealer_id, dealer_name, type,
         qty, price, total, reference, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (serial, dealer_id, dealer_name, type,
          qty, price, total, reference, date))
    conn.commit()
    conn.close()
    if dealer_id and type in ['Credit', 'Payment']:
        update_dealer_balance(dealer_id, type, total)
    return serial

def get_all_transactions():
    conn = get_db()
    txns = conn.execute('''
        SELECT * FROM transactions ORDER BY date DESC
    ''').fetchall()
    conn.close()
    return [dict(t) for t in txns]

def get_transaction(id):
    conn = get_db()
    txn = conn.execute(
        'SELECT * FROM transactions WHERE id=?', (id,)
    ).fetchone()
    conn.close()
    return dict(txn) if txn else None

def get_transaction_by_serial(serial):
    conn = get_db()
    txn = conn.execute(
        'SELECT * FROM transactions WHERE serial_number=?',
        (serial,)
    ).fetchone()
    conn.close()
    return dict(txn) if txn else None

def update_transaction(id, qty, price, total, reference):
    conn = get_db()
    old = conn.execute(
        'SELECT * FROM transactions WHERE id=?', (id,)
    ).fetchone()
    if old and old['dealer_id'] and old['type'] == 'Credit':
        conn.execute('''
            UPDATE dealers SET balance = balance - ? + ?
            WHERE id = ?
        ''', (old['total'], total, old['dealer_id']))
    conn.execute('''
        UPDATE transactions
        SET qty=?, price=?, total=?, reference=?
        WHERE id=?
    ''', (qty, price, total, reference, id))
    conn.commit()
    conn.close()

def delete_transaction(id):
    conn = get_db()
    txn = conn.execute(
        'SELECT * FROM transactions WHERE id=?', (id,)
    ).fetchone()
    if txn and txn['dealer_id']:
        if txn['type'] == 'Credit':
            conn.execute('''
                UPDATE dealers SET balance = balance - ?
                WHERE id = ?
            ''', (txn['total'], txn['dealer_id']))
        elif txn['type'] == 'Payment':
            conn.execute('''
                UPDATE dealers SET balance = balance + ?
                WHERE id = ?
            ''', (txn['total'], txn['dealer_id']))
    conn.execute('DELETE FROM transactions WHERE id=?', (id,))
    conn.commit()
    conn.close()

def get_dealer_transactions(dealer_id):
    conn = get_db()
    txns = conn.execute('''
        SELECT * FROM transactions
        WHERE dealer_id = ? ORDER BY date DESC
    ''', (dealer_id,)).fetchall()
    conn.close()
    return [dict(t) for t in txns]

def get_transactions_by_date(date):
    conn = get_db()
    txns = conn.execute('''
        SELECT * FROM transactions
        WHERE DATE(date) = DATE(?)
        ORDER BY date DESC
    ''', (date,)).fetchall()
    conn.close()
    return [dict(t) for t in txns]

def get_monthly_summary():
    conn = get_db()
    summary = conn.execute('''
        SELECT
            strftime('%Y-%m', date) as month,
            SUM(CASE WHEN type='Cash' THEN total ELSE 0 END) as cash,
            SUM(CASE WHEN type='Credit' THEN total ELSE 0 END) as credit,
            SUM(CASE WHEN type='Payment' THEN total ELSE 0 END) as payments,
            SUM(CASE WHEN type IN ('Cash','Credit') THEN qty ELSE 0 END) as ice
        FROM transactions
        GROUP BY month
        ORDER BY month DESC
    ''').fetchall()
    conn.close()
    return [dict(s) for s in summary]