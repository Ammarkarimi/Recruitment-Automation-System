from flask import Flask, request, jsonify
from flask import send_file
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from langchain_community.document_loaders import PyPDFLoader
from flask_cors import CORS  # Import CORS
import google.generativeai as genai
import csv
from flask_mail import Mail, Message
import os

app = Flask(__name__)
CORS(app)
job_description = ""
import re
count = 0
history= {}
question = ""
answer= ""
user_answer=""

data = [
    ["Question", "Actual_Answer", "User_Answer","Score","Selected/Not Selected"]
]
file_name = "interview_analysis.csv"

# Writing to the CSV file
with open(file_name, mode="w", newline="") as file:
    writer = csv.writer(file)
    writer.writerows(data)
print(f"CSV file '{file_name}' created successfully!")

def extract_email_from_resume(text):
    pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"
    match = re.search(pattern, text)
    return match.group() if match else None

def similarity_checker_tfidf(job_description, resumes_folder):
    similarity_scores = []

    for resume_file in os.listdir(resumes_folder):
        if resume_file.endswith(".pdf"):
            resume_path = os.path.join(resumes_folder, resume_file)
            loader = PyPDFLoader(resume_path)
            resume_text = "".join(page.page_content for page in loader.load())
            corpus = [job_description, resume_text]
            vectorizer = TfidfVectorizer()
            tfidf_matrix = vectorizer.fit_transform(corpus)
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])
            email = extract_email_from_resume(resume_text)
            similarity_scores.append((resume_file, similarity[0][0], email))
    
    return similarity_scores


def calculate_similarity(actual_answer, user_answer):
    """
    Calculate the similarity between the actual answer and the user's answer using TF-IDF and Cosine Similarity.
    
    Args:
    actual_answer (str): The actual correct answer.
    user_answer (str): The answer provided by the user.
    
    Returns:
    float: Similarity score between 0 and 1.
    """
    if not actual_answer or not user_answer:
        return 0.0  # Return 0 if any of the answers is empty
    
    # Create a TF-IDF Vectorizer
    vectorizer = TfidfVectorizer()
    
    # Transform the answers into TF-IDF vectors
    tfidf_matrix = vectorizer.fit_transform([actual_answer, user_answer])
    
    # Compute Cosine Similarity between the vectors
    similarity_score = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0]
    
    return similarity_score


@app.route('/job_description',methods=['POST'])
def job_description():
    data = request.json
    global job_description
    job_description = data.get('job_description', '')
    print("Gotten "+job_description)
    return jsonify(job_description)
    
@app.route('/check_similarity', methods=['GET'])
def check_similarity():
    similarity_scores = similarity_checker_tfidf(job_description, UPLOAD_FOLDER)
    response_data = [{"resume": file, "similarity_score": score, "email": email} for file, score, email in similarity_scores]
    return jsonify(response_data)





@app.route('/view_resume', methods=['GET'])
def view_resume():
    file_name = request.args.get('file')
    file_path = os.path.join(UPLOAD_FOLDER, file_name)
    return send_file(file_path)



# Define the path where resumes will be saved
UPLOAD_FOLDER = "C:\\Data\\Python\\Ammar\\Flask\\venv\\Resumes"
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/upload_resumes', methods=['POST'])
def upload_resumes():
    if 'resumes' not in request.files:
        return jsonify({"error": "No files uploaded."}), 400

    files = request.files.getlist('resumes')
    file_paths = []
    for file in files:
        if file and file.filename:
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
            file.save(file_path)  # Save the file to the specified path
            file_paths.append(file_path)

    return jsonify({"message": "Files uploaded successfully", "file_paths": file_paths}), 200


# # Configure the API key for Google Generative AI

# # Define a route to generate the MCQs
@app.route('/generate_mcqs', methods=['GET'])
def generate_mcqs():
    genai.configure(api_key="")
    try:
        # Initialize the Generative Model
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        response = model.generate_content("Generate 10 MCQs of Machine Learning with correct option. Give me output in JSON Format with keys question and options in A,B,C,D and answer")

        print(response.text)
        # Return the generated response as JSON
        return jsonify({"mcqs": response.text})
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500



# # Define your route within the Flask app
# @app.route("/generate_qa", methods=["GET"])
# def generate_qa():
#     try:
#         genai.configure(api_key="")

#         # Initialize the Generative Model
#         model = genai.GenerativeModel("gemini-1.5-flash")
        
#         # Prompt to generate question and answer pairs
#         response = model.generate_content(
#             "Generate 1 question of Machine Learning with its answers. "
#             "Provide the output in JSON format with keys 'question' and 'answer'."
#         )

#         # Return the generated response as JSON
#         return jsonify({"questions_and_answers": response.text})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


import json


# Configure the API key for Google Generative AI
genai.configure(api_key="")

# Function to generate question and answer
def generate_qa():
    try:
        # Initialize the Generative Model
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Prompt to generate question and answer pairs
        response = model.generate_content(
            "Generate 1 question of Artificial Intelligence on topic of Neural network or on Natural language processing with its answers. "
            "Provide the output in JSON format with keys 'question' and 'answer'.",
            
        )
        print(response.text)
        return response.text
    except Exception as e:
        return {"error": str(e)}



@app.route('/start_interview', methods=['GET'])
def start_interview():
    print("Called")
    # Simulate running the interview process
    qa1 = generate_qa()
    
    # Clean and parse the response
    qa_cleaned = qa1[8:-4]
    try:
        qa = json.loads(qa_cleaned)
    except json.JSONDecodeError as e:
        return jsonify({"error": "Failed to parse the question."}), 500
    
    if "error" in qa:
        return jsonify({"error": qa["error"]}), 500
    global question,answer
    question = qa.get("question", "No question found.")
    answer = qa.get("answer","No answer found.")
    print("Answer returned: ",answer)
    print("Question returned: ",question)
    return jsonify({"question": question})



@app.route('/evaluate_answer', methods=['POST'])
def evaluate_answer():
    data = request.get_json()  
    global question,answer,user_answer
    selected = ""
    user_answer = data.get('answer', '')  
    print("Received Answer:", user_answer) 
    checkScore = calculate_similarity(answer,user_answer)
    if checkScore>0.3:
        selected = "Selected"
    else:
        selected = "Not Selected"
    data=[question,answer,user_answer,checkScore,selected]
    with open(file_name, mode="a", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(data)
    return jsonify({'status': 'success', 'message': 'Answer received and printed'})


# from flask import Flask, request, jsonify
# from flask_cors import CORS  # Import CORS
# from google.auth.transport.requests import Request
# from google.oauth2.credentials import Credentials
# from email.mime.multipart import MIMEMultipart
# from email.mime.text import MIMEText
# import smtplib

# # Initialize Flask app
# app = Flask(__name__)
# CORS(app)  # Enable CORS for all routes

# # Replace these with your Google API credentials

# # Function to get access token
# def get_access_token():
#     creds = Credentials(
#         None,
#         refresh_token=REFRESH_TOKEN,
#         token_uri=TOKEN_URI,
#         client_id=CLIENT_ID,
#         client_secret=CLIENT_SECRET,
#         scopes=["https://www.googleapis.com/auth/gmail.send"],
#     )
#     creds.refresh(Request())
#     return creds.token

# # Function to send email
# def send_email(recipient_email):
#     try:
#         access_token = get_access_token()

#         # Email content
#         subject = "Welcome To DealsDone"
#         body = """
#         <html>
#             <body>
#                 <h1>Welcome!</h1>
#                 <p>Thank you for joining DealsDone!</p>
#                 <p>Best regards,</p>
#                 <p>DealsDone Team</p>
#             </body>
#         </html>
#         """

#         # Create email
#         message = MIMEMultipart()
#         message["From"] = f"DealsDone <{SENDER_EMAIL}>"
#         message["To"] = recipient_email
#         message["Subject"] = subject
#         message.attach(MIMEText(body, "html"))

#         # Send email using Gmail's SMTP server
#         with smtplib.SMTP("smtp.gmail.com", 587) as server:
#             server.starttls()
#             server.ehlo()
#             server.login(SENDER_EMAIL, access_token)
#             server.sendmail(SENDER_EMAIL, recipient_email, message.as_string())

#         return {"status": "success", "message": "Email sent successfully"}
#     except Exception as e:
#         return {"status": "error", "message": str(e)}

# # Flask route to handle email sending
# @app.route("/send-email", methods=["POST"])
# def send_email_route():
#     data = request.json
#     recipient_email = data.get("recipientEmail")
#     if not recipient_email:
#         return jsonify({"error": "Recipient email is required"}), 400

#     response = send_email(recipient_email)
#     if response["status"] == "success":
#         return jsonify({"message": response["message"]}), 200
#     else:
#         return jsonify({"error": response["message"]}), 500



stored_emails = []

@app.route('/store_email', methods=['POST'])
def store_email():
    data = request.get_json()
    email = data.get('email')
    if email and email not in stored_emails:
        stored_emails.append(email)
        return jsonify({'message': 'Email stored successfully'}), 200
    return jsonify({'message': 'Email already exists or invalid'}), 400

@app.route('/verify_email', methods=['POST'])
def verify_email():
    data = request.get_json()
    email = data.get('email')
    if email in stored_emails:
        return jsonify({'valid': True, 'message': 'Email verified successfully'}), 200
    return jsonify({'valid': False, 'message': 'Email not found'}), 404







mail = Mail(app)

# Send email function
def send_email(recipient_email):
    with app.app_context():
        msg = Message("Congratulations🌟 || Proceed towards the test", sender='testing6864@gmail.com', recipients=[recipient_email])
        msg.html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Invitation - Recruitment Automation System</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: black; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(to right, #6366F1, #6366F1); padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Test Invitation</h1>
  </div>
  <div style="background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <p>Hello ,</p>
    <p>You have been shortlisted for the next phase of our recruitment process. Please complete the test using the link below:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="http://localhost:3000/test" style="background: #6366F1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Take the Test</a>
    </div>
    <p>The test is an essential part of the recruitment process, and your timely completion will help us move forward.</p>
    <p>If you have any questions or face any issues, please reach out to our support team.</p>
    <p>Thank you for your interest in joining our team. We wish you the best of luck!</p>
    <p>Best regards,<br>The Recruitment Automation Team</p>
  </div>
  <div style="text-align: center; margin-top: 20px; color: #888; font-size: 0.8em;">
    <p>This is an automated message, please do not reply to this email.</p>
  </div>
</body>
</html>
"""
        try:
            mail.send(msg)
            return {"status": "success", "message": "Email sent successfully!"}
        except Exception as e:
            return {"status": "error", "message": f"Failed to send email: {e}"}





# Route to handle sending emails
@app.route("/send-email", methods=["POST"])
def send_email_route():
    data = request.json
    recipient_email = data.get("recipientEmail")
    
    if not recipient_email:
        return jsonify({"error": "Recipient email is required"}), 400
    
    response = send_email(recipient_email)
    
    if response["status"] == "success":
        return jsonify({"message": response["message"]}), 200
    else:
        return jsonify({"error": response["message"]}), 500




# Run Flask app
if __name__ == "__main__":
    app.run(debug=True)
