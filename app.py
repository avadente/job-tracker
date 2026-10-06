import csv
import io
import os
from datetime import date, datetime

import pymysql
from dotenv import load_dotenv
from flask import Flask, Response, g, jsonify, render_template, request

load_dotenv()

app = Flask(__name__)

STATUSES = ["wishlist", "applied", "screening", "interview", "offer", "rejected", "ghosted", "withdrawn"]
WORK_MODES = ["onsite", "hybrid", "remote"]
FIELDS = [
    "company", "role", "url", "location", "work_mode", "status", "date_applied", "deadline",
    "salary_range", "contact", "resume_version", "next_action", "next_action_date", "notes",
]
DATE_FIELDS = {"date_applied", "deadline", "next_action_date"}


def get_db():
    if "db" not in g:
        g.db = pymysql.connect(
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=int(os.getenv("DB_PORT", "3306")),
            user=os.getenv("DB_USER", "jobtracker"),
            password=os.getenv("DB_PASSWORD", ""),
            database=os.getenv("DB_NAME", "job_tracker"),
            cursorclass=pymysql.cursors.DictCursor,
            autocommit=True,
        )
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def serialize(row):
    return {k: v.isoformat() if isinstance(v, (date, datetime)) else v for k, v in row.items()}


def clean_payload(data):
    """Keep known fields, turn empty strings into NULL, and validate enums/dates."""
    out = {}
    for field in FIELDS:
        if field not in data:
            continue
        value = data[field]
        if isinstance(value, str):
            value = value.strip() or None
        if field == "status" and value not in STATUSES:
            raise ValueError(f"Invalid status: {value}")
        if field == "work_mode" and value is not None and value not in WORK_MODES:
            raise ValueError(f"Invalid work mode: {value}")
        if field in DATE_FIELDS and value is not None:
            date.fromisoformat(value)
        out[field] = value
    return out


@app.errorhandler(ValueError)
def bad_request(err):
    return jsonify(error=str(err)), 400


@app.errorhandler(pymysql.err.OperationalError)
def db_unavailable(err):
    return jsonify(error=f"Database error: {err.args[-1]}"), 503


@app.route("/")
def index():
    return render_template("index.html", statuses=STATUSES, work_modes=WORK_MODES)


@app.get("/api/applications")
def list_applications():
    with get_db().cursor() as cur:
        cur.execute("SELECT * FROM applications ORDER BY updated_at DESC")
        return jsonify([serialize(r) for r in cur.fetchall()])


@app.post("/api/applications")
def create_application():
    data = clean_payload(request.get_json(force=True))
    if not data.get("company") or not data.get("role"):
        raise ValueError("Company and role are required")
    cols = ", ".join(data)
    placeholders = ", ".join(["%s"] * len(data))
    with get_db().cursor() as cur:
        cur.execute(f"INSERT INTO applications ({cols}) VALUES ({placeholders})", list(data.values()))
        cur.execute("SELECT * FROM applications WHERE id = %s", (cur.lastrowid,))
        return jsonify(serialize(cur.fetchone())), 201


@app.patch("/api/applications/<int:app_id>")
def update_application(app_id):
    data = clean_payload(request.get_json(force=True))
    if not data:
        raise ValueError("No fields to update")
    if "company" in data and not data["company"] or "role" in data and not data["role"]:
        raise ValueError("Company and role cannot be empty")
    assignments = ", ".join(f"{k} = %s" for k in data)
    with get_db().cursor() as cur:
        cur.execute(f"UPDATE applications SET {assignments} WHERE id = %s", [*data.values(), app_id])
        cur.execute("SELECT * FROM applications WHERE id = %s", (app_id,))
        row = cur.fetchone()
    if row is None:
        return jsonify(error="Not found"), 404
    return jsonify(serialize(row))


@app.delete("/api/applications/<int:app_id>")
def delete_application(app_id):
    with get_db().cursor() as cur:
        deleted = cur.execute("DELETE FROM applications WHERE id = %s", (app_id,))
    if not deleted:
        return jsonify(error="Not found"), 404
    return "", 204


@app.get("/export.csv")
def export_csv():
    with get_db().cursor() as cur:
        cur.execute(f"SELECT id, {', '.join(FIELDS)}, created_at, updated_at FROM applications ORDER BY id")
        rows = cur.fetchall()
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=["id", *FIELDS, "created_at", "updated_at"])
    writer.writeheader()
    writer.writerows(rows)
    filename = f"applications-{date.today().isoformat()}.csv"
    return Response(buf.getvalue(), mimetype="text/csv",
                    headers={"Content-Disposition": f"attachment; filename={filename}"})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.getenv("FLASK_PORT", "5000")), debug=True)
