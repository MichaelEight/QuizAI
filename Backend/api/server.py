from flask import Flask
from flask_cors import CORS
from Backend.api.api_endpoints import register_endpoints

app = Flask(__name__)
# CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})
CORS(app)

register_endpoints(app)
