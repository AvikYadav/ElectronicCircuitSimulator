from flask import Flask, render_template, request, jsonify
from datetime import datetime
import easyauth
from easyauth.easyflask import login_required, fetch_user_data
from easyauth._config import get_connector


#configure easy_auth
easyauth._config.configure("aryan", "cpproject", "T45azTrZTIzGfXEgsM7WrrbxqBy2HLQPHaU_uaV61_U=")

app = Flask(__name__)
LOGIN_URL = "https://easy-auth.dev/auth/aryan/cpproject"


# ── helpers ──────────────────────────────────────────────────────────────────

def unwrap(user_data) -> dict:
    user_d = user_data["user_data"]
    if isinstance(user_d, list):
        return {}
    return user_d


def get_circuits(user_data) -> dict:
    return unwrap(user_data).get("circuits", {})


def get_full_user_data(token: str) -> dict:
    raw = get_connector().get_user_data(token)
    return raw['data'] if isinstance(raw['data'],dict) else {}



def save_circuits(token: str, circuits: dict):
    existing = get_full_user_data(token)
    existing["circuits"] = circuits
    get_connector().send_or_update_user_data(token, existing)


def next_id(circuits: dict) -> int:
    if not circuits:
        return 1
    return max(int(k) for k in circuits.keys()) + 1


# ── routes ───────────────────────────────────────────────────────────────────

@app.route('/')
@login_required
def index(token):
    return render_template('index.html')


@app.route('/gallery')
@fetch_user_data
def gallery(username, user_data, token):
    circuits = sorted(get_circuits(user_data).values(),key=lambda c: c["updated_at"],reverse=True,)
    return render_template('gallery.html', circuits=circuits)


@app.route('/api/circuits')
@fetch_user_data
def api_circuits(username, user_data, token):
    circuits = sorted(get_circuits(user_data).values(),key=lambda c: c["updated_at"],reverse=True,)[:8]
    return jsonify([
        {k: v for k, v in c.items() if k != "data"}
        for c in circuits
    ])


@app.route('/api/save', methods=['POST'])
@fetch_user_data
def api_save(username, user_data, token):
    body = request.get_json(silent=True) or {}
    data = body.get('data', '').strip()
    if not data:
        return jsonify({'error': 'Circuit data is required'}), 400

    circuits = get_circuits(user_data)
    now = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')
    cid = next_id(circuits)

    circuits[str(cid)] = {
        "id":          cid,
        "name":        body.get('name', 'Untitled').strip() or 'Untitled',
        "description": body.get('description', '').strip(),
        "data":        data,
        "created_at":  now,
        "updated_at":  now,
    }

    save_circuits(token, circuits)
    return jsonify({'id': cid, 'message': 'Circuit saved'})


@app.route('/api/load/<int:cid>')
@fetch_user_data
def api_load(cid, username, user_data, token):
    circuit = get_circuits(user_data).get(str(cid))
    if not circuit:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(circuit)


@app.route('/api/delete/<int:cid>', methods=['DELETE'])
@fetch_user_data
def api_delete(cid, username, user_data, token):
    circuits = get_circuits(user_data)
    if str(cid) not in circuits:
        return jsonify({'error': 'Not found'}), 404
    del circuits[str(cid)]
    save_circuits(token, circuits)
    return jsonify({'message': 'Deleted'})


if __name__ == '__main__':
    app.run(debug=True, port=5000)