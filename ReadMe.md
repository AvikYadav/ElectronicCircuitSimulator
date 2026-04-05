# Synapse — Circuit Simulator

Web-based circuit simulation workspace built on CircuitJS, with per-user cloud storage via EasyAuth.

---

## What It Does

- Embeds the CircuitJS simulator in a clean workspace UI
- Provides preset circuits (LED driver, RC filter, LC oscillator, etc.) loadable in one click
- Lets users export circuit text from CircuitJS and save it to their account with a name and description
- Persists oscilloscope scope panels across every circuit load by injecting scope definitions into the circuit text before compression
- Shows saved circuits in a sidebar, a load modal, and a full gallery page with delete support
- Handles authentication entirely through EasyAuth — no local user table, no password storage, no session logic

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Server | Python / Flask | Routes and API endpoints |
| Auth + Storage | EasyAuth SDK (`easy-auth-sdk`) | Token verification, hosted login, per-user JSON store |
| Simulator | CircuitJS (iframe) | Circuit engine and oscilloscope panels |
| Compression | LZ-String (CDN) | Encodes circuit text for the `?ctz=` iframe URL parameter |
| Graphs | Chart.js (CDN) | Voltage and current waveform panels |
| Templates | Jinja2 | Server-side gallery page rendering |
| Styling | Vanilla CSS | Single file, CSS custom properties, no preprocessor |

---

## How the Pieces Connect

**Authentication** — Every protected route uses `@login_required` or `@fetch_user_data` from the EasyAuth Flask SDK. On each request the decorator calls `easy-auth.dev` to verify the encrypted Fernet token stored in an httponly cookie. No token verification logic lives in the app.

**Storage** — There is no database. Circuits are stored as a nested dict in each user's EasyAuth JSON store under the key `"circuits"`, keyed by integer ID. Every save reads the full existing store first, updates the `"circuits"` key, then writes the whole object back to avoid overwriting other keys.

**Simulator loading** — Circuit state is passed to CircuitJS via the `?ctz=` URL parameter as LZ-String compressed circuit text. Before compressing, scope definition lines (`o ...`) are stripped from the incoming text and a fixed set of scope lines is appended, so oscilloscope panels survive every circuit switch.

**Waveform graphs** — Voltage and current graphs are computed analytically in JavaScript for each preset type (RC step response, half-wave rectifier, LC tank, etc.). They are not read from the CircuitJS simulator.

---

## Authentication Flow

```
User visits protected route
        │
        ▼
@login_required / @fetch_user_data
checks encrypted cookie token against easy-auth.dev
        │
        ├── valid ──► inject token (+ user_data) into view function ──► render page
        │
        └── invalid ──► redirect to easy-auth.dev/login/aryan/cpproject
                                │
                                ▼
                        user logs in on hosted page
                                │
                                ▼
                        redirected back with ?token=<encrypted>
                                │
                                ▼
                        decorator sets secure httponly cookie ──► page loads
```

---

## Save / Load Flow

```
POST /api/save
        │
        ▼
@fetch_user_data verifies token + loads full user store
        │
        ▼
read existing circuits dict from user_data["circuits"]
        │
        ▼
append new circuit entry (auto-incremented int ID)
        │
        ▼
send_or_update_user_data() writes full store back to easy-auth.dev


GET /gallery
        │
        ▼
@fetch_user_data verifies token + loads full user store
        │
        ▼
sort circuits by updated_at descending
        │
        ▼
Jinja2 renders gallery.html server-side with circuit list
```

---

## EasyAuth User Data Structure

```json
{
  "circuits": {
    "1": {
      "id": 1,
      "name": "RC Low-Pass Filter",
      "description": "1kΩ + 1µF",
      "data": "$ 1 0.000005 ...",
      "created_at": "2026-04-05 10:00:00",
      "updated_at": "2026-04-05 10:00:00"
    },
    "2": { ... }
  }
}
```

---

## Project Structure

```
.
├── app.py              # Flask app — all routes and helpers
├── templates/
│   ├── index.html      # Simulator workspace
│   └── gallery.html    # Saved circuits gallery
└── static/
    ├── app.js          # All client-side logic
    └── style.css       # Layout and styling
```

---

## Environment Variables

| Variable | `configure()` equivalent | Description |
|---|---|---|
| `EASYAUTH_USERNAME` | `username` | EasyAuth account username |
| `EASYAUTH_SERVICE_NAME` | `service_name` | Service registered on easy-auth.dev |
| `EASYAUTH_API_KEY` | `api_key` | API key from the EasyAuth dashboard |

---

## Running Locally

```bash
pip install flask easy-auth-sdk[easyflask]
python app.py
```

Starts on `http://localhost:5000`. On first visit you will be redirected to the EasyAuth hosted login page and returned with a session cookie.