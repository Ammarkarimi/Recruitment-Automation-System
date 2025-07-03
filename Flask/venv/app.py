from flask import Flask, request, jsonify

# Initialize the Flask app
app = Flask(__name__)

# Define the route for the home page
@app.route('/')
def hello():
    return "Hello, Flask!"


@app.route('/submit_job_description', methods=['POST'])
def submit_job_description():
    # Get the JSON data from the POST request
    data = request.get_json()

    # Check if 'job_description' is in the POST request
    if 'job_description' not in data:
        return jsonify({"error": "Job description not provided"}), 400

    # Get the job description from the request
    job_description = data['job_description']

    # Process the job description (For now, just return it)
    return jsonify({"message": "Job description received", "job_description": job_description}), 200


# Run the app
if __name__ == '__main__':
    app.run(debug=True)
