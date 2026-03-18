# ========================================
# SINDH ICE FACTORY - Database Setup
# ========================================

import sqlite3
import os

DB_PATH = 'sindh_ice.db'

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

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

def delete_dealer(id):
    conn = get_db()
    conn.execute('DELETE FROM dealers WHERE id = ?', (id,))
    conn.execute(
        'DELETE FROM transactions WHERE dealer_id = ?', (id,)
    )
    conn.commit()
    conn.close()

def update_dealer_balance(dealer_id, type, amount):
    conn = get_db()
    if type == 'Credit':
        conn.execute('''
            UPDATE dealers
            SET balance = balance + ?
            WHERE id = ?
        ''', (amount, dealer_id))
    elif type == 'Payment':
        conn.execute('''
            UPDATE dealers
            SET balance = balance - ?
            WHERE id = ?
        ''', (amount, dealer_id))
    conn.commit()
    conn.close()

# ── Transaction Functions ──

def add_transaction(dealer_id, dealer_name,
                    type, qty, price, total,
                    reference, date):
    conn = get_db()
    conn.execute('''
        INSERT INTO transactions
        (dealer_id, dealer_name, type, qty,
         price, total, reference, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (dealer_id, dealer_name, type, qty,
          price, total, reference, date))
    conn.commit()
    conn.close()

    # Balance update
    if dealer_id and type in ['Credit', 'Payment']:
        update_dealer_balance(dealer_id, type, total)

def get_all_transactions():
    conn = get_db()
    txns = conn.execute('''
        SELECT * FROM transactions
        ORDER BY date DESC
    ''').fetchall()
    conn.close()
    return [dict(t) for t in txns]

def get_dealer_transactions(dealer_id):
    conn = get_db()
    txns = conn.execute('''
        SELECT * FROM transactions
        WHERE dealer_id = ?
        ORDER BY date DESC
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