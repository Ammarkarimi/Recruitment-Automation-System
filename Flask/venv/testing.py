# from flask import Flask, request, jsonify
# from flask import send_file
# import os
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity
# from langchain_community.document_loaders import PyPDFLoader
# from flask_cors import CORS  # Import CORS
# import google.generativeai as genai

# import streamlit as st
# import speech_recognition as sr
# import pyttsx3
# import streamlit as st
# from langchain.prompts import PromptTemplate
# from langchain_community.llms import CTransformers
# import torch  # Ensure torch is imported
# import json
# import time


# def generate_qa():
#     genai.configure(api_key="AIzaSyALGEs16JYUEYoeAjxHHKmgSODzVGEO8is")

    

#     # Initialize the Generative Model
#     model = genai.GenerativeModel("gemini-1.5-flash")
    
#     # Prompt to generate question and answer pairs
#     response = model.generate_content(
#         "Generate 1 question of Machine Learning with its answers. "
#         "Provide the output in JSON format with keys 'question' and 'answer'."
#     )

#     print(response.text)
#     # Return the generated response as JSON
#     return jsonify({"questions_and_answers": response.text})

#     # except Exception as e:
#     #     return jsonify({"error": str(e)}), 500


# # Initialize the recognizer 
# r = sr.Recognizer()

# # Function to convert text to speech
# def SpeakText(command):
#     # Initialize the engine
#     engine = pyttsx3.init()
#     engine.say(command) 
#     engine.runAndWait()

# # Function to listen for speech and convert to text
# def listen_and_convert():
#     try:
#         # Use the microphone as source for input
#         with sr.Microphone() as source:
#             r.adjust_for_ambient_noise(source, duration=0.2)

            
#             # Listen with a 5 second timeout
#             audio = r.listen(source, timeout=5)
            
#             # Use Google to recognize audio
#             MyText = r.recognize_google(audio)
#             MyText = MyText.lower()

#             st.write(f"You said: {MyText}")
#             return MyText

#     except sr.WaitTimeoutError:
#         st.write("Timeout: No speech detected within 5 seconds.")
#     except sr.UnknownValueError:
#         st.write("Sorry, I did not understand that.")
#     except sr.RequestError as e:
#         st.write(f"Could not request results; {e}")

# SpeakText("Welcome to the Interview. This will be purely Technical Interview and you have to only give answers for the questions which are asked. If you have any further question you tell that at the end of the interview")
# count = 0
# while count!=1:
#     question = generate_qa()
#     # SpeakText(question)
#     print("Question: \n",question)

#     count+=1

#     SpeakText("Moving to the next question")


# generate_qa()







# import google.generativeai as genai
# import speech_recognition as sr
# import pyttsx3
# import time
# import json

# # Configure the Generative AI model
# def generate_qa():
#     genai.configure(api_key="AIzaSyALGEs16JYUEYoeAjxHHKmgSODzVGEO8is")

#     # Initialize the Generative Model
#     model = genai.GenerativeModel("gemini-1.5-flash")

#     # Prompt to generate question and answer pairs
#     response = model.generate_content(
#         "Generate 1 question of Machine Learning with its answers. "
#         "Provide the output in JSON format with keys 'question' and 'answer'."
#     )

#     # Parse and return the response
#     return response.text  # Assuming response.text contains the JSON string

# # Function to convert text to speech
# def SpeakText(command):
#     engine = pyttsx3.init()
#     engine.say(command) 
#     engine.runAndWait()

# # Function to listen for speech and convert to text
# def listen_and_convert():
#     recognizer = sr.Recognizer()
#     try:
#         with sr.Microphone() as source:
#             recognizer.adjust_for_ambient_noise(source, duration=0.2)
#             print("Listening for your answer...")
#             audio = recognizer.listen(source, timeout=5)
#             MyText = recognizer.recognize_google(audio)
#             print(f"You said: {MyText}")
#             return MyText
#     except sr.WaitTimeoutError:
#         print("Timeout: No speech detected within 5 seconds.")
#     except sr.UnknownValueError:
#         print("Sorry, I did not understand that.")
#     except sr.RequestError as e:
#         print(f"Could not request results; {e}")
#     return None

# # Main Interview Flow
# SpeakText("Welcome")

# while True:
#     question_and_answer = generate_qa()
    
#     # question_data = eval(question_and_answer)  # Convert JSON-like string to Python dictionary
#     # question_data = json.dump(question_and_answer)
#     question_data = json.load(question_and_answer)
#     print(question_data)
#     question = question_data.get("question", "No question generated.")
#     answer = question_data.get("answer", "No answer provided.")

#     print(f"Question: {question}")
#     SpeakText(question)
    
#     user_response = listen_and_convert()  # Listen to the user's answer

#     if user_response:
#         print(f"User's answer: {user_response}")
#         SpeakText("Thank you for your response. Moving to the next question...")
#     else:
#         SpeakText("I did not catch that. Let's move to the next question.")

#     time.sleep(2)  # Pause before the next question






# import google.generativeai as genai
# import speech_recognition as sr
# import pyttsx3
# import json
# # Configure the API key
# genai.configure(api_key="AIzaSyALGEs16JYUEYoeAjxHHKmgSODzVGEO8is")

# # Function to generate question and answer
# def generate_qa():
#     try:
#         # Initialize the Generative Model
#         model = genai.GenerativeModel("gemini-1.5-flash")
        
#         # Prompt to generate question and answer pairs
#         response = model.generate_content(
#             "Generate 1 question of Machine Learning with its answers. "
#             "Provide the output in JSON format with keys 'question' and 'answer'."
#         )
#         # Parse the response and return as a dictionary
#         return response.text
#     except Exception as e:
#         return {"error": str(e)}

# # Function to convert text to speech
# def SpeakText(command):
#     engine = pyttsx3.init()
#     engine.say(command)
#     engine.runAndWait()

# # Function to listen for speech and convert to text
# def listen_and_convert():
#     recognizer = sr.Recognizer()
#     try:
#         with sr.Microphone() as source:
#             recognizer.adjust_for_ambient_noise(source, duration=0.2)
#             SpeakText("Please provide your answer:")
#             audio = recognizer.listen(source, timeout=5)
#             MyText = recognizer.recognize_google(audio)
#             return MyText.lower()
#     except sr.WaitTimeoutError:
#         return "Timeout: No speech detected."
#     except sr.UnknownValueError:
#         return "Sorry, I did not understand that."
#     except sr.RequestError as e:
#         return f"Could not process the request: {e}"

# # Main logic
# def run_interview():
#     SpeakText("Welcome")
#     for i in range(3):  # Limit to 3 questions for demonstration
#         qa1 = generate_qa()
#         print(qa1[8:-4])
#         qa2 = qa1[8:-4]
#         qa = json.loads(qa2)
#         # qa = dict(qa2)
#         if "error" in qa:
#             SpeakText("An error occurred while generating the question.")
#             print(qa["error"])
#             break
#         SpeakText(f"Question {i+1}: {qa}")
#         print(f"Question {i+1}: {qa}")
#         answer = listen_and_convert()
#         SpeakText(f"You answered: {answer}")
#         print(f"Your Answer: {answer}")

# if __name__ == "__main__":
#     run_interview()






import google.generativeai as genai
import speech_recognition as sr
import pyttsx3
import json
import time
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/ask-question/')
def ask_question():
    return {"question": "What is your name?"}

# Configure the API key
genai.configure(api_key="AIzaSyALGEs16JYUEYoeAjxHHKmgSODzVGEO8is")

# Function to generate question and answer
def generate_qa():
    try:
        # Initialize the Generative Model
        model = genai.GenerativeModel("gemini-1.5-flash")
        
        # Prompt to generate question and answer pairs
        response = model.generate_content(
            "Generate 1 question of Machine Learning with its answers. "
            "Provide the output in JSON format with keys 'question' and 'answer'."
        )
        # Parse the response and return as a dictionary
        return response.text
    except Exception as e:
        return {"error": str(e)}

# Function to convert text to speech
def SpeakText(command):
    engine = pyttsx3.init()
    engine.say(command)
    engine.runAndWait()


def listen_and_convert():
    recognizer = sr.Recognizer()

    with sr.Microphone() as source:
        print("Listening for your answer...")
        SpeakText("Please provide your answer:")
        
        # Adjust for ambient noise
        recognizer.adjust_for_ambient_noise(source, duration=0.5)

        # Start listening
        start_time = time.time()  # Record the time when listening starts
        while True:
            try:
                # Listen for audio with a timeout of 8 seconds (if no speech detected)
                audio = recognizer.listen(source, timeout=8)  # Timeout after 8 seconds of silence

                # Recognize the speech from the audio
                recognized_text = recognizer.recognize_google(audio)
                print(f"You said: {recognized_text}")
                return recognized_text.lower()

            except sr.WaitTimeoutError:
                # Check if 8 seconds of silence has passed since the last speech was detected
                if time.time() - start_time > 8:
                    print("User stopped speaking for more than 8 seconds, moving to next question.")
                    SpeakText("I didn't hear anything for 8 seconds. Moving to the next question.")
                    return "No response detected."

                # If still waiting for speech, print status
                print("Waiting for more input...")
                continue  # Continue listening

            except sr.UnknownValueError:
                # If speech recognition could not understand the audio
                print("Sorry, I did not understand that.")
                SpeakText("I couldn't understand your answer.")
                continue  # Continue listening for the next input

            except sr.RequestError as e:
                # If there's an issue with the API request
                print(f"Could not process the request: {e}")
                SpeakText("There was an error processing your answer.")
                return f"Error: {e}"


# Main logic
def run_interview():
    SpeakText("Welcome")
    for i in range(1):  # Limit to 3 questions for demonstration
        qa1 = generate_qa()
        
        # Extract and clean the JSON response
        qa_cleaned = qa1[8:-4]
        try:
            qa = json.loads(qa_cleaned)
        except json.JSONDecodeError as e:
            SpeakText("An error occurred while parsing the question.")
            print(f"Error: {e}")
            break
        
        # Handle errors in the QA generation process
        if "error" in qa:
            SpeakText("An error occurred while generating the question.")
            print(qa["error"])
            break
        
        question = qa.get("question", "No question found.")
        
        # Ask the question
        SpeakText(f"Question {i+1}: {question}")
        print(f"Question {i+1}: {question}")
        
        # Listen for the user's answer
        user_answer = listen_and_convert()
        print(f"User's answer: {user_answer}")

if __name__ == "__main__":
    run_interview()




