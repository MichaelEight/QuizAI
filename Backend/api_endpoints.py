from flask import Blueprint, request, jsonify
from api_requests_BO import generate_questions, check_open_answer

api_blueprint = Blueprint('api', __name__)

@api_blueprint.route('/hello', methods=["GET"])
def api_hello():
    return jsonify({"message": "Hello world!"})

@api_blueprint.route('/generate_questions', methods=["POST"])
def api_generate_questions():
    data = request.get_json()

    text = data.get('text')
    closed_amount = data.get('closed_amount')
    open_amount = data.get('open_amount')
    allow_multiple = data.get('allow_multiple')
    force_multiple = data.get('force_multiple')

    if not all([text, closed_amount, open_amount]):
        return jsonify({ "status": "error", "message": "Missing required fields!"}), 400
    
    result = generate_questions(text, closed_amount, open_amount, allow_multiple, force_multiple)
    
    return jsonify(result)

@api_blueprint.route('/check_open_answer', methods=["POST"])
def api_check_open_answer():
    data = request.get_json()

    text = data.get('text')
    question = data.get('question')
    answer = data.get('answer')

    if not all([text, question, answer]):
        return jsonify({ "status": "error", "message": "Missing required fields!"}), 400
    
    # result = check_open_answer(text, question, answer)
    # return jsonify(result)

    return jsonify({"status": "error", "message": "Not implemented yet!"})     

def register_endpoints(app):
    app.register_blueprint(api_blueprint)
