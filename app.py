# ========================================
# SINDH ICE FACTORY - Flask Server
# ========================================

from flask import Flask, render_template, request, jsonify
from database import *

app = Flask(__name__)

# Database initialize karo
init_db()

# ========================================
# PAGE ROUTES
# ========================================

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dealers')
def dealers():
    return render_template('dealers.html')

@app.route('/dealer-detail')
def dealer_detail():
    return render_template('dealer-detail.html')

@app.route('/reports')
def reports():
    return render_template('reports.html')

# ========================================
# DEALER APIs
# ========================================

# Sare dealers lo
@app.route('/api/dealers', methods=['GET'])
def api_get_dealers():
    dealers = get_all_dealers()
    return jsonify(dealers)

# Ek dealer lo
@app.route('/api/dealers/<int:id>', methods=['GET'])
def api_get_dealer(id):
    dealer = get_dealer(id)
    if not dealer:
        return jsonify({'error': 'Dealer nahi mila'}), 404
    return jsonify(dealer)

# Naya dealer add karo
@app.route('/api/dealers', methods=['POST'])
def api_add_dealer():
    data = request.json
    name = data.get('name', '').strip()

    if not name:
        return jsonify({'error': 'Naam zaroori hai'}), 400

    # Duplicate check
    all_dealers = get_all_dealers()
    duplicate = any(
        d['name'].lower() == name.lower()
        for d in all_dealers
    )
    if duplicate:
        return jsonify(
            {'error': 'Yeh dealer pehle se exist karta hai'}
        ), 400

    add_dealer(
        name=name,
        phone=data.get('phone', ''),
        cnic=data.get('cnic', ''),
        location=data.get('location', 'Remote'),
        address=data.get('address', '')
    )
    return jsonify({'success': True, 'message': 'Dealer add ho gaya!'})

# Dealer delete karo
@app.route('/api/dealers/<int:id>', methods=['DELETE'])
def api_delete_dealer(id):
    delete_dealer(id)
    return jsonify({'success': True, 'message': 'Dealer delete ho gaya!'})

# ========================================
# TRANSACTION APIs
# ========================================

# Transaction add karo
@app.route('/api/transactions', methods=['POST'])
def api_add_transaction():
    data = request.json

    add_transaction(
        dealer_id=data.get('dealerId'),
        dealer_name=data.get('dealerName', 'Cash'),
        type=data.get('type', 'Cash'),
        qty=data.get('qty', 0),
        price=data.get('price', 0),
        total=data.get('total', 0),
        reference=data.get('reference', ''),
        date=data.get('date', '')
    )
    return jsonify({
        'success': True,
        'message': 'Transaction save ho gayi!'
    })

# Sari transactions lo
@app.route('/api/transactions', methods=['GET'])
def api_get_transactions():
    txns = get_all_transactions()
    return jsonify(txns)

# Dealer ki transactions lo
@app.route('/api/transactions/dealer/<int:dealer_id>',
           methods=['GET'])
def api_get_dealer_transactions(dealer_id):
    txns = get_dealer_transactions(dealer_id)
    return jsonify(txns)

# Date se transactions lo
@app.route('/api/transactions/date/<date>', methods=['GET'])
def api_get_date_transactions(date):
    txns = get_transactions_by_date(date)
    return jsonify(txns)

# ========================================
# RUN SERVER
# ========================================

if __name__ == '__main__':
    app.run(debug=True, port=5000)