from flask import Flask, request, jsonify, make_response
from main import AgentThinkingKG
import json

app = Flask(__name__)

# Initialize the knowledge graph system
kg_system = AgentThinkingKG()

def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    return response

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = make_response()
        response = add_cors_headers(response)
        return response

@app.after_request
def after_request(response):
    response = add_cors_headers(response)
    print(f"Request received: {request.method} {request.path}")
    print(f"Request headers: {dict(request.headers)}")
    print(f"Response headers: {dict(response.headers)}")
    return response

@app.route('/process_message', methods=['POST'])
def process_message():
    print("Received request at /process_message")
    data = request.json
    message = data.get('message')
    
    if not message:
        return jsonify({'error': 'No message provided'}), 400
    
    try:
        print(f"Processing message: {message}")
        # Process the message with the knowledge graph system
        session_id, raw_llm_response, thinking_text = kg_system.process_thinking(message)
        print("Finished kg_system.process_thinking")

        # Clean the raw LLM response to remove markdown fencing before parsing
        cleaned_llm_response = raw_llm_response.strip()
        if cleaned_llm_response.startswith('```json'):
            cleaned_llm_response = cleaned_llm_response[7:-3].strip()
        elif cleaned_llm_response.startswith('```'):
            cleaned_llm_response = cleaned_llm_response[3:-3].strip()

        # Parse the cleaned LLM response (which is the thinking trace JSON)
        print(f"Cleaned LLM response: {cleaned_llm_response}")
        llm_thinking_data = json.loads(cleaned_llm_response)
        print("Finished json.loads")

        # Extract the actual LLM response (assuming it's the content of the last thought)
        llm_response_content = "No response generated" # Default message
        if 'thoughts' in llm_thinking_data and llm_thinking_data['thoughts']:
            # Assuming the last thought's content is the main response
            llm_response_content = llm_thinking_data['thoughts'][-1].get('content', "No response content found")
        print(f"Extracted LLM response content: {llm_response_content}")
        
        print(f"Sending response: {llm_response_content}, Thinking Trace: {raw_llm_response[:150]}...")
        return jsonify({
            'response': llm_response_content, # Send extracted content as the main response
            'session_id': session_id,
            'thinking_trace': raw_llm_response # Send the original raw response with markdown for the trace
        })
    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/get_analysis', methods=['GET'])
def get_analysis():
    try:
        # Get analysis data
        patterns = kg_system.analyze_patterns()
        return jsonify(patterns)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/get_graph_data', methods=['GET'])
def get_graph_data():
    try:
        # Get all graph data
        graph_data = kg_system.get_full_graph_data()
        
        return jsonify(graph_data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=6969) 