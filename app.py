 from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from database import *
from functools import wraps

app = Flask(__name__)
app.secret_key = 'sindh_ice_factory_secret_2024'

init_db()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

@app.after_request
def add_security_headers(response):
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data:;"
    )
    return response

# ── Auth ──
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        data = request.json
        user = verify_user(data.get('username'), data.get('password'))
        if user:
            session['user'] = user['username']
            return jsonify({'success': True})
        return jsonify({'error': 'Galat username ya password!'}), 401
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))

# ── Pages ──
@app.route('/')
@login_required
def index():
    return render_template('index.html')

@app.route('/dealers')
@login_required
def dealers():
    return render_template('dealers.html')

@app.route('/dealer-detail')
@login_required
def dealer_detail():
    return render_template('dealer-detail.html')

@app.route('/reports')
@login_required
def reports():
    return render_template('reports.html')

    @app.route('/monthly')
@login_required
def monthly():
    return render_template('monthly.html')

@app.route('/expenditures')
@login_required
def expenditures():
    return render_template('expenditures.html')

@app.route('/reset', methods=['GET', 'POST'])
@login_required
def reset_data():
    if request.method == 'POST':
        data = request.json
        if data.get('password') != 'RESET@SIF2024':
            return jsonify({'error': 'Galat password!'}), 401
        conn = get_db()
        conn.execute('DELETE FROM transactions')
        conn.execute('DELETE FROM expenditures')
        conn.execute('UPDATE dealers SET balance = 0')
        conn.commit()
        conn.close()
        return jsonify({'success': True, 'message': 'Sab data delete ho gaya!'})
    return render_template('reset.html')

# ── Dealer APIs ──
@app.route('/api/dealers', methods=['GET'])
@login_required
def api_get_dealers():
    return jsonify(get_all_dealers())

@app.route('/api/dealers/<int:id>', methods=['GET'])
@login_required
def api_get_dealer(id):
    dealer = get_dealer(id)
    if not dealer:
        return jsonify({'error': 'Dealer nahi mila'}), 404
    return jsonify(dealer)

@app.route('/api/dealers', methods=['POST'])
@login_required
def api_add_dealer():
    data = request.json
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Naam zaroori hai'}), 400
    all_dealers = get_all_dealers()
    if any(d['name'].lower() == name.lower() for d in all_dealers):
        return jsonify({'error': 'Dealer pehle se exist karta hai'}), 400
    add_dealer(name=name, phone=data.get('phone', ''), cnic=data.get('cnic', ''), location=data.get('location', 'Remote'), address=data.get('address', ''))
    return jsonify({'success': True, 'message': 'Dealer add ho gaya!'})

@app.route('/api/dealers/<int:id>', methods=['PUT'])
@login_required
def api_update_dealer(id):
    data = request.json
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Naam zaroori hai'}), 400
    update_dealer(id=id, name=name, phone=data.get('phone', ''), cnic=data.get('cnic', ''), location=data.get('location', 'Remote'), address=data.get('address', ''))
    return jsonify({'success': True, 'message': 'Dealer update ho gaya!'})

@app.route('/api/dealers/<int:id>', methods=['DELETE'])
@login_required
def api_delete_dealer(id):
    delete_dealer(id)
    return jsonify({'success': True, 'message': 'Dealer delete ho gaya!'})

# ── Transaction APIs ──
@app.route('/api/transactions', methods=['POST'])
@login_required
def api_add_transaction():
    data = request.json
    serial = add_transaction(
        dealer_id=data.get('dealerId'),
        dealer_name=data.get('dealerName', 'Cash'),
        type=data.get('type', 'Cash'),
        qty=data.get('qty', 0),
        price=data.get('price', 0),
        total=data.get('total', 0),
        reference=data.get('reference', ''),
        date=data.get('date', '')
    )
    return jsonify({'success': True, 'serial': serial})

@app.route('/api/transactions', methods=['GET'])
@login_required
def api_get_transactions():
    return jsonify(get_all_transactions())

@app.route('/api/transactions/<int:id>', methods=['GET'])
@login_required
def api_get_transaction(id):
    txn = get_transaction(id)
    if not txn:
        return jsonify({'error': 'Transaction nahi mili'}), 404
    return jsonify(txn)

@app.route('/api/transactions/search/<serial>', methods=['GET'])
@login_required
def api_search_transaction(serial):
    txn = get_transaction_by_serial(serial)
    if not txn:
        return jsonify({'error': 'Receipt nahi mili'}), 404
    return jsonify(txn)

@app.route('/api/transactions/<int:id>', methods=['PUT'])
@login_required
def api_update_transaction(id):
    data = request.json
    qty = float(data.get('qty', 0))
    price = float(data.get('price', 0))
    total = qty * price
    update_transaction(id=id, qty=qty, price=price, total=total, reference=data.get('reference', ''))
    return jsonify({'success': True, 'message': 'Transaction update ho gayi!'})

@app.route('/api/transactions/<int:id>', methods=['DELETE'])
@login_required
def api_delete_transaction(id):
    delete_transaction(id)
    return jsonify({'success': True, 'message': 'Transaction delete ho gayi!'})

@app.route('/api/transactions/dealer/<int:dealer_id>', methods=['GET'])
@login_required
def api_get_dealer_transactions(dealer_id):
    return jsonify(get_dealer_transactions(dealer_id))

@app.route('/api/transactions/date/<date>', methods=['GET'])
@login_required
def api_get_date_transactions(date):
    return jsonify(get_transactions_by_date(date))

@app.route('/api/monthly-summary', methods=['GET'])
@login_required
def api_monthly_summary():
    return jsonify(get_monthly_summary())

# ── Expenditure APIs ──
@app.route('/api/expenditures', methods=['GET'])
@login_required
def api_get_expenditures():
    return jsonify(get_all_expenditures())

@app.route('/api/expenditures', methods=['POST'])
@login_required
def api_add_expenditure():
    data = request.json
    amount = data.get('amount', 0)
    reason = data.get('reason', '')
    date = data.get('date', '')
    if not amount or float(amount) <= 0:
        return jsonify({'error': 'Amount dalein!'}), 400
    add_expenditure(amount=amount, reason=reason, date=date)
    return jsonify({'success': True, 'message': 'Expenditure add ho gayi!'})

@app.route('/api/expenditures/date/<date>', methods=['GET'])
@login_required
def api_get_date_expenditures(date):
    return jsonify(get_expenditures_by_date(date))

@app.route('/api/expenditures/<int:id>', methods=['DELETE'])
@login_required
def api_delete_expenditure(id):
    delete_expenditure(id)
    return jsonify({'success': True, 'message': 'Expenditure delete ho gayi!'})

@app.route('/api/monthly-expenditures', methods=['GET'])
@login_required
def api_monthly_expenditures():
    return jsonify(get_monthly_expenditures())

if __name__ == '__main__':
    app.run(debug=True, port=5000)