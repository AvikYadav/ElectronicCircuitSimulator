# Synapse — Circuit Simulator

Synapse is a web-based circuit simulation workspace built on top of the open-source CircuitJS engine. It provides a clean interface for loading, building, saving, and revisiting electronic circuits, with per-user persistent storage handled through the EasyAuth platform.

---

## What It Does

Users open the workspace and are immediately presented with the CircuitJS simulator embedded in an iframe. From there they can load one of several built-in preset circuits, build their own from scratch inside the simulator, export the circuit text from CircuitJS, and save it to their account with a name and description. Saved circuits are accessible from the sidebar, the load modal, and a dedicated gallery page. The gallery lists every saved circuit with its name, description, and last-modified date, and supports deletion in place. Opening any circuit from the gallery or sidebar loads it directly back into the simulator with scopes preserved.

Authentication is handled entirely by EasyAuth — there is no local user table, no password storage, and no session management written in the application itself.

---

## Tech Stack

### Backend

**Python / Flask** serves all routes and API endpoints. Flask was chosen for its minimal surface area — the entire backend is a single `app.py` file with no ORM, no migration system, and no session middleware. Route protection is applied via decorators rather than middleware.

**EasyAuth SDK** (`easy-auth-sdk`) replaces what would otherwise be a full authentication layer. It provides three things the application relies on: hosted login pages at `easy-auth.dev`, encrypted httponly cookie management, and a per-user JSON key-value store. The `@login_required` decorator protects routes that only need token verification. The `@fetch_user_data` decorator is used on routes that also need to read stored user data, injecting `username`, `user_data`, and `token` directly into the view function. There is no database — circuits are stored as a nested dict inside the EasyAuth user data store under the key `"circuits"`, keyed by integer ID.

The SDK communicates with `easy-auth.dev` on every request to verify tokens server-side. Tokens are Fernet-encrypted (AES-128-CBC + HMAC-SHA256) and expire after one hour.

### Frontend

**Vanilla JavaScript** handles all client-side behaviour — preset loading, save and load modals, toast notifications, the recent circuits sidebar list, and URL parameter handling for direct circuit links. There are no frontend frameworks or build steps.

**CircuitJS** is embedded as an iframe pointing to `falstad.com/circuit/circuitjs.html`. Circuit state is passed in and out via the `?ctz=` URL parameter, which accepts LZ-string compressed circuit text in CircuitJS's native format. Scope definitions (oscilloscope panels) are injected into every circuit's text before compression so they persist across circuit loads rather than only appearing in the default state.

**LZ-String** (`lz-string` via CDN) handles the compression and encoding of circuit text before it is passed to the CircuitJS iframe URL.

**Chart.js** renders the voltage and current waveform graphs shown below the simulator. Waveforms are computed analytically in JavaScript for each preset circuit type rather than being read from the simulator.

**Jinja2** (via Flask) renders the gallery page server-side. The index page is static HTML — the simulator and sidebar data load client-side via `fetch` calls to the API endpoints.

### Styling

A single `style.css` file with CSS custom properties for theming. No preprocessor, no utility framework. The design uses DM Sans and DM Mono loaded from Google Fonts.

---

## Data Flow

```
User visits /
  └── @login_required checks cookie token against easy-auth.dev
        ├── Valid   → render index.html
        └── Invalid → redirect to easy-auth.dev/auth/aryan/cpproject

User saves a circuit
  └── POST /api/save
        └── @fetch_user_data verifies token + loads user store
              └── Reads existing circuits dict from user_data
                    └── Appends new circuit entry
                          └── send_or_update_user_data() writes full store back

User opens gallery
  └── GET /gallery
        └── @fetch_user_data verifies token + loads user store
              └── Sorts circuits by updated_at descending
                    └── Renders gallery.html server-side with circuit list
```

---

## Project Structure

```
.
├── app.py              # Flask application — all routes and helpers
├── templates/
│   ├── index.html      # Simulator workspace
│   └── gallery.html    # Saved circuits gallery
└── static/
    ├── app.js          # All client-side logic
    └── style.css       # Styling and layout
```

---

## Environment

Configure credentials via environment variables or by calling `easyauth.configure()` directly at startup.

| Variable                  | Description                        |
|---------------------------|------------------------------------|
| `EASYAUTH_USERNAME`       | EasyAuth account username          |
| `EASYAUTH_SERVICE_NAME`   | Service name registered on easy-auth.dev |
| `EASYAUTH_API_KEY`        | API key from the EasyAuth dashboard |

To run locally:

```bash
pip install flask easy-auth-sdk[easyflask]
python app.py
```

The application starts on port 5000 by default.