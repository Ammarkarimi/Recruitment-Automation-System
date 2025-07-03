// import React, { useRef, useEffect, useState } from "react";
// import "./InterviewModule.css";
// import { FaMicrophone, FaCamera } from "react-icons/fa";

// function InterviewModule() {
//   const videoRefRight = useRef(null);
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCameraOn, setIsCameraOn] = useState(true);
//   const [showTwoUsers, setShowTwoUsers] = useState(false);
//   const [question, setQuestion] = useState(""); // Store the current question

//   useEffect(() => {
//     if (!showTwoUsers) {
//       startMediaStream(); // Start media stream for the single user initially
//     }
//   }, [showTwoUsers]);

//   const startMediaStream = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       if (videoRefRight.current) {
//         videoRefRight.current.srcObject = stream;
//       }
//     } catch (error) {
//       console.error("Error accessing media devices:", error);
//     }
//   };

//   const toggleMicrophone = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const audioTracks = stream.getAudioTracks();
//       audioTracks.forEach((track) => (track.enabled = !isMicOn));
//       setIsMicOn(!isMicOn);
//     }
//   };

//   const toggleCamera = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const videoTracks = stream.getVideoTracks();
//       videoTracks.forEach((track) => (track.enabled = !isCameraOn));
//       setIsCameraOn(!isCameraOn);
//     }
//   };

//   const startTwoUserView = () => {
//     setShowTwoUsers(true);
//     fetchQuestion(); // Start the interview process by fetching the first question
//   };

//   const fetchQuestion = async () => {
//     // Fetch question from the backend (Python endpoint)
//     const response = await fetch("http://localhost:5000/start_interview");
//     const data = await response.json();
//     setQuestion(data.question); // Store the question in state

//     // Speak the question using SpeechSynthesis API
//     speakQuestion(data.question);
//   };

//   const speakQuestion = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     speechSynthesis.speak(utterance);
//   };

//   return (
//     <div className="interview-fullscreen">
//       {showTwoUsers ? (
//         <div className="two-user-view">
//           {/* Left Side: Bot */}
//           <div className="user-video user-left">
//             <img
//               src="https://www.profilebakery.com/wp-content/uploads/2024/05/Profile-picture-created-with-ai.jpeg" // Replace with your bot image path
//               alt="Bot"
//               className="bot-image"
//             />
//           </div>

//           {/* Right Side: User Video */}
//           <div className="user-video user-right">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>
//         </div>
//       ) : (
//         <div className="video-fullscreen">
//           {/* Single User View */}
//           <div className="icon-left" onClick={toggleMicrophone}>
//             <FaMicrophone size={30} color={isMicOn ? "green" : "red"} />
//           </div>

//           <div className="video-content">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>

//           <div className="icon-right" onClick={toggleCamera}>
//             <FaCamera size={30} color={isCameraOn ? "green" : "red"} />
//           </div>
//         </div>
//       )}

//       {/* Start Button */}
//       {!showTwoUsers && (
//         <div className="button-container">
//           <button className="start-button" onClick={startTwoUserView}>
//             Start Interview
//           </button>
//         </div>
//       )}

//       {/* Display question */}
//       {question && <div className="question-text">{question}</div>}
//     </div>
//   );
// }

// export default InterviewModule;










// import React, { useRef, useState, useEffect } from "react";
// import "./InterviewModule.css";
// import { FaMicrophone, FaCamera } from "react-icons/fa";

// // Check if the browser supports SpeechRecognition API
// const SpeechRecognition =
//   window.SpeechRecognition || window.webkitSpeechRecognition;

// function InterviewModule() {
//   const videoRefRight = useRef(null);
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCameraOn, setIsCameraOn] = useState(true);
//   const [showTwoUsers, setShowTwoUsers] = useState(false);
//   const [question, setQuestion] = useState(""); // Store the current question
//   const [userAnswer, setUserAnswer] = useState(""); // Store the user's answer

//   // Initialize SpeechRecognition
//   const recognition = new SpeechRecognition();
//   recognition.continuous = true;
//   recognition.lang = "en-US";

//   useEffect(() => {
//     if (!showTwoUsers) {
//       startMediaStream(); // Start media stream for the single user initially
//     }
//   }, [showTwoUsers]);

//   const startMediaStream = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       if (videoRefRight.current) {
//         videoRefRight.current.srcObject = stream;
//       }
//     } catch (error) {
//       console.error("Error accessing media devices:", error);
//     }
//   };

//   const toggleMicrophone = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const audioTracks = stream.getAudioTracks();
//       audioTracks.forEach((track) => (track.enabled = !isMicOn));
//       setIsMicOn(!isMicOn);
//     }
//   };

//   const toggleCamera = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const videoTracks = stream.getVideoTracks();
//       videoTracks.forEach((track) => (track.enabled = !isCameraOn));
//       setIsCameraOn(!isCameraOn);
//     }
//   };

//   const startTwoUserView = () => {
//     setShowTwoUsers(true);
//     fetchQuestion(); // Start the interview process by fetching the first question
//   };

//   const fetchQuestion = async () => {
//     // Fetch question from the backend (Python endpoint)
//     const response = await fetch("http://localhost:5000/start_interview");
//     const data = await response.json();
//     setQuestion(data.question); // Store the question in state

//     // Speak the question using SpeechSynthesis API
//     speakQuestion(data.question);
//   };

//   const speakQuestion = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     speechSynthesis.speak(utterance);
//   };

//   const startSpeechRecognition = () => {
//     recognition.start(); // Start the recognition

//     recognition.onresult = (event) => {
//       const currentAnswer = event.results[event.results.length - 1][0].transcript;
//       setUserAnswer(currentAnswer); // Store the recognized answer
//       console.log("Recognized Answer: ", currentAnswer);

//       // Optionally, you can send the answer to the backend for evaluation here
//       evaluateAnswer(currentAnswer);
//     };

//     recognition.onerror = (event) => {
//       console.error("Speech recognition error: ", event.error);
//     };
//   };

//   const evaluateAnswer = async (answer) => {
//     // Send the user's answer to the backend for evaluation (optional)
//     const response = await fetch("http://localhost:5000/evaluate_answer", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ answer: answer }),
//     });

//     const data = await response.json();
//     console.log("Evaluation result:", data); // Handle evaluation result
//   };

//   return (
//     <div className="interview-fullscreen">
//       {showTwoUsers ? (
//         <div className="two-user-view">
//           {/* Left Side: Bot */}
//           <div className="user-video user-left">
//             <img
//               src="https://www.profilebakery.com/wp-content/uploads/2024/05/Profile-picture-created-with-ai.jpeg"
//               alt="Bot"
//               className="bot-image"
//             />
//           </div>

//           {/* Right Side: User Video */}
//           <div className="user-video user-right">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>
//         </div>
//       ) : (
//         <div className="video-fullscreen">
//           {/* Single User View */}
//           <div className="icon-left" onClick={toggleMicrophone}>
//             <FaMicrophone size={30} color={isMicOn ? "green" : "red"} />
//           </div>

//           <div className="video-content">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>

//           <div className="icon-right" onClick={toggleCamera}>
//             <FaCamera size={30} color={isCameraOn ? "green" : "red"} />
//           </div>
//         </div>
//       )}

//       {/* Start Button */}
//       {!showTwoUsers && (
//         <div className="button-container">
//           <button className="start-button" onClick={startTwoUserView}>
//             Start Interview
//           </button>
//         </div>
//       )}

//       {/* Display the generated question */}
//       {question && (
//         <div className="question-display">
//           Question: {question}
//           <button onClick={startSpeechRecognition}>Speak your answer</button>
//         </div>
//       )}

//       {/* Display the user's answer */}
//       {userAnswer && (
//         <div className="answer-display">
//           You said: {userAnswer}
//         </div>
//       )}
//     </div>
//   );
// }

// export default InterviewModule;







// import React, { useRef, useState, useEffect } from "react";
// import "./InterviewModule.css";
// import { FaMicrophone, FaCamera } from "react-icons/fa";

// // Check if the browser supports SpeechRecognition API
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// function InterviewModule() {
//   const videoRefRight = useRef(null);
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCameraOn, setIsCameraOn] = useState(true);
//   const [showTwoUsers, setShowTwoUsers] = useState(false);
//   const [question, setQuestion] = useState(""); // Store the current question
//   const [userAnswer, setUserAnswer] = useState(""); // Store the user's answer

//   // Initialize SpeechRecognition
//   const recognition = new SpeechRecognition();
//   recognition.continuous = true;
//   recognition.lang = "en-US";

//   useEffect(() => {
//     if (!showTwoUsers) {
//       startMediaStream(); // Start media stream for the single user initially
//     }
//   }, [showTwoUsers]);

//   const startMediaStream = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       if (videoRefRight.current) {
//         videoRefRight.current.srcObject = stream;
//       }
//     } catch (error) {
//       console.error("Error accessing media devices:", error);
//     }
//   };

//   const toggleMicrophone = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const audioTracks = stream.getAudioTracks();
//       audioTracks.forEach((track) => (track.enabled = !isMicOn));
//       setIsMicOn(!isMicOn);
//     }
//   };

//   const toggleCamera = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const videoTracks = stream.getVideoTracks();
//       videoTracks.forEach((track) => (track.enabled = !isCameraOn));
//       setIsCameraOn(!isCameraOn);
//     }
//   };

//   const startTwoUserView = () => {
//     setShowTwoUsers(true);
//     fetchQuestion(); // Start the interview process by fetching the first question
//   };

//   const fetchQuestion = async () => {
//     // Fetch question from the backend (Python endpoint)
//     const response = await fetch("http://localhost:5000/start_interview");
//     const data = await response.json();
//     setQuestion(data.question); // Store the question in state

//     // Speak the question using SpeechSynthesis API
//     speakQuestion(data.question);
//   };

//   const speakQuestion = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     speechSynthesis.speak(utterance);
//   };

//   const startSpeechRecognition = () => {
//     recognition.start(); // Start the recognition

//     recognition.onresult = (event) => {
//       const currentAnswer = event.results[event.results.length - 1][0].transcript;
//       setUserAnswer(currentAnswer); // Store the recognized answer
//       console.log("Recognized Answer: ", currentAnswer);

//       // Optionally, you can send the answer to the backend for evaluation here
//       evaluateAnswer(currentAnswer);
//     };

//     recognition.onerror = (event) => {
//       console.error("Speech recognition error: ", event.error);
//     };

//     // After user stops speaking, call the next question
//     recognition.onend = () => {
//       fetchQuestion(); // Fetch next question
//     };
//   };

//   const evaluateAnswer = async (answer) => {
//     // Send the user's answer to the backend for evaluation (optional)
//     const response = await fetch("http://localhost:5000/evaluate_answer", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ answer: answer }),
//     });

//     const data = await response.json();
//     console.log("Evaluation result:", data); // Handle evaluation result
//   };

//   return (
//     <div className="interview-fullscreen">
//       {showTwoUsers ? (
//         <div className="two-user-view">
//           {/* Left Side: Bot */}
//           <div className="user-video user-left">
//             <img
//               src="https://www.profilebakery.com/wp-content/uploads/2024/05/Profile-picture-created-with-ai.jpeg"
//               alt="Bot"
//               className="bot-image"
//             />
//           </div>

//           {/* Right Side: User Video */}
//           <div className="user-video user-right">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>
//         </div>
//       ) : (
//         <div className="video-fullscreen">
//           {/* Single User View */}
//           <div className="icon-left" onClick={toggleMicrophone}>
//             <FaMicrophone size={30} color={isMicOn ? "green" : "red"} />
//           </div>

//           <div className="video-content">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>

//           <div className="icon-right" onClick={toggleCamera}>
//             <FaCamera size={30} color={isCameraOn ? "green" : "red"} />
//           </div>
//         </div>
//       )}

//       {/* Start Button */}
//       {!showTwoUsers && (
//         <div className="button-container">
//           <button className="start-button" onClick={startTwoUserView}>
//             Start Interview
//           </button>
//         </div>
//       )}

//       {/* Display the generated question */}
//       {question && (
//         <div className="question-display">
//           Question: {question}
//           <button onClick={startSpeechRecognition}>Speak your answer</button>
//         </div>
//       )}

//       {/* Display the user's answer */}
//       {userAnswer && (
//         <div className="answer-display">
//           You said: {userAnswer}
//         </div>
//       )}
//     </div>
//   );
// }

// export default InterviewModule;







// import React, { useRef, useState, useEffect } from "react";
// import "./InterviewModule.css";
// import { FaMicrophone, FaCamera } from "react-icons/fa";

// // Check if the browser supports SpeechRecognition API
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// function InterviewModule() {
//   const videoRefRight = useRef(null);
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCameraOn, setIsCameraOn] = useState(true);
//   const [showTwoUsers, setShowTwoUsers] = useState(false);
//   const [question, setQuestion] = useState(""); // Store the current question
//   const [userAnswer, setUserAnswer] = useState(""); // Store the user's answer

//   // Initialize SpeechRecognition
//   const recognition = new SpeechRecognition();
//   recognition.continuous = true;
//   recognition.lang = "en-US";

//   useEffect(() => {
//     if (!showTwoUsers) {
//       startMediaStream(); // Start media stream for the single user initially
//     }
//   }, [showTwoUsers]);

//   const startMediaStream = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       if (videoRefRight.current) {
//         videoRefRight.current.srcObject = stream;
//       }
//     } catch (error) {
//       console.error("Error accessing media devices:", error);
//     }
//   };

//   const toggleMicrophone = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const audioTracks = stream.getAudioTracks();
//       audioTracks.forEach((track) => (track.enabled = !isMicOn));
//       setIsMicOn(!isMicOn);
//     }
//   };

//   const toggleCamera = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const videoTracks = stream.getVideoTracks();
//       videoTracks.forEach((track) => (track.enabled = !isCameraOn));
//       setIsCameraOn(!isCameraOn);
//     }
//   };

//   const startTwoUserView = () => {
//     setShowTwoUsers(true);
//     fetchQuestion(); // Start the interview process by fetching the first question
//   };

//   const fetchQuestion = async () => {
//     // Fetch question from the backend (Python endpoint)
//     const response = await fetch("http://localhost:5000/start_interview");
//     const data = await response.json();
//     setQuestion(data.question); // Store the question in state

//     // Speak the question using SpeechSynthesis API
//     speakQuestion(data.question);
//   };

//   const speakQuestion = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     speechSynthesis.speak(utterance);
//   };

//   const startSpeechRecognition = () => {
//     recognition.start(); // Start the recognition

//     recognition.onresult = (event) => {
//       const currentAnswer = event.results[event.results.length - 1][0].transcript;
//       setUserAnswer(currentAnswer); // Store the recognized answer
//       console.log("Recognized Answer: ", currentAnswer);

//       // Send the answer to evaluate_answer
//       evaluateAnswer(currentAnswer);
//     };

//     recognition.onerror = (event) => {
//       console.error("Speech recognition error: ", event.error);
//     };
//   };

//   const evaluateAnswer = async (answer) => {
//     // Send the user's answer to the backend for evaluation
//     const response = await fetch("http://localhost:5000/evaluate_answer", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ answer: answer }),
//     });

//     const data = await response.json();
//     console.log("Evaluation result:", data); // Handle evaluation result

//     // After evaluation, fetch the next question
//     fetchQuestion();
//   };

//   return (
//     <div className="interview-fullscreen">
//       {showTwoUsers ? (
//         <div className="two-user-view">
//           {/* Left Side: Bot */}
//           <div className="user-video user-left">
//             <img
//               src="https://www.profilebakery.com/wp-content/uploads/2024/05/Profile-picture-created-with-ai.jpeg"
//               alt="Bot"
//               className="bot-image"
//             />
//           </div>

//           {/* Right Side: User Video */}
//           <div className="user-video user-right">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>
//         </div>
//       ) : (
//         <div className="video-fullscreen">
//           {/* Single User View */}
//           <div className="icon-left" onClick={toggleMicrophone}>
//             <FaMicrophone size={30} color={isMicOn ? "green" : "red"} />
//           </div>

//           <div className="video-content">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>

//           <div className="icon-right" onClick={toggleCamera}>
//             <FaCamera size={30} color={isCameraOn ? "green" : "red"} />
//           </div>
//         </div>
//       )}

//       {/* Start Button */}
//       {!showTwoUsers && (
//         <div className="button-container">
//           <button className="start-button" onClick={startTwoUserView}>
//             Start Interview
//           </button>
//         </div>
//       )}

//       {/* Display the generated question */}
//       {question && (
//         <div className="question-display">
//           Question: {question}
//           <button onClick={startSpeechRecognition}>Speak your answer</button>
//         </div>
//       )}

//       {/* Display the user's answer */}
//       {userAnswer && (
//         <div className="answer-display">
//           You said: {userAnswer}
//         </div>
//       )}
//     </div>
//   );
// }

// export default InterviewModule;




// import React, { useRef, useState, useEffect } from "react";
// import "./InterviewModule.css";
// import { FaMicrophone, FaCamera } from "react-icons/fa";

// // Check if the browser supports SpeechRecognition API
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// function InterviewModule() {
//   const videoRefRight = useRef(null);
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCameraOn, setIsCameraOn] = useState(true);
//   const [showTwoUsers, setShowTwoUsers] = useState(false);
//   const [question, setQuestion] = useState(""); // Store the current question
//   const [userAnswer, setUserAnswer] = useState(""); // Store the user's answer
//   const [isQuestionFetching, setIsQuestionFetching] = useState(false); // Flag to track if the question is being fetched

//   // Initialize SpeechRecognition
//   const recognition = new SpeechRecognition();
//   recognition.continuous = true;
//   recognition.lang = "en-US";

//   useEffect(() => {
//     if (!showTwoUsers) {
//       startMediaStream(); // Start media stream for the single user initially
//     }
//   }, [showTwoUsers]);

//   const startMediaStream = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       if (videoRefRight.current) {
//         videoRefRight.current.srcObject = stream;
//       }
//     } catch (error) {
//       console.error("Error accessing media devices:", error);
//     }
//   };

//   const toggleMicrophone = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const audioTracks = stream.getAudioTracks();
//       audioTracks.forEach((track) => (track.enabled = !isMicOn));
//       setIsMicOn(!isMicOn);
//     }
//   };

//   const toggleCamera = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const videoTracks = stream.getVideoTracks();
//       videoTracks.forEach((track) => (track.enabled = !isCameraOn));
//       setIsCameraOn(!isCameraOn);
//     }
//   };

//   const startTwoUserView = () => {
//     setShowTwoUsers(true);
//     fetchQuestion(); // Start the interview process by fetching the first question
//   };

//   const fetchQuestion = async () => {
//     if (isQuestionFetching) return; // Prevent fetching the question multiple times
//     setIsQuestionFetching(true); // Set flag to true to prevent multiple fetches

//     try {
//       // Fetch question from the backend (Python endpoint)
//       const response = await fetch("http://localhost:5000/start_interview");
//       const data = await response.json();
//       setQuestion(data.question); // Store the question in state

//       // Speak the question using SpeechSynthesis API
//       speakQuestion(data.question);
//     } catch (error) {
//       console.error("Error fetching question:", error);
//     } finally {
//       setIsQuestionFetching(false); // Reset the flag after fetching the question
//     }
//   };

//   const speakQuestion = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     speechSynthesis.speak(utterance);
//   };

//   const startSpeechRecognition = () => {
//     recognition.start(); // Start the recognition

//     recognition.onresult = (event) => {
//       const currentAnswer = event.results[event.results.length - 1][0].transcript;
//       setUserAnswer(currentAnswer); // Store the recognized answer
//       console.log("Recognized Answer: ", currentAnswer);

//       // Send the answer to evaluate_answer
//       evaluateAnswer(currentAnswer);
//     };

//     recognition.onerror = (event) => {
//       console.error("Speech recognition error: ", event.error);
//     };
//   };

//   const evaluateAnswer = async (answer) => {
//     try {
//       // Send the user's answer to the backend for evaluation
//       const response = await fetch("http://localhost:5000/evaluate_answer", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ answer: answer }),
//       });

//       const data = await response.json();
//       console.log("Evaluation result:", data); // Handle evaluation result

//       // After evaluation, fetch the next question
//       fetchQuestion(); // Immediately fetch next question after evaluation
//     } catch (error) {
//       console.error("Error evaluating answer:", error);
//     }
//   };

//   return (
//     <div className="interview-fullscreen">
//       {showTwoUsers ? (
//         <div className="two-user-view">
//           {/* Left Side: Bot */}
//           <div className="user-video user-left">
//             <img
//               src="https://www.profilebakery.com/wp-content/uploads/2024/05/Profile-picture-created-with-ai.jpeg"
//               alt="Bot"
//               className="bot-image"
//             />
//           </div>

//           {/* Right Side: User Video */}
//           <div className="user-video user-right">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>
//         </div>
//       ) : (
//         <div className="video-fullscreen">
//           {/* Single User View */}
//           <div className="icon-left" onClick={toggleMicrophone}>
//             <FaMicrophone size={30} color={isMicOn ? "green" : "red"} />
//           </div>

//           <div className="video-content">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>

//           <div className="icon-right" onClick={toggleCamera}>
//             <FaCamera size={30} color={isCameraOn ? "green" : "red"} />
//           </div>
//         </div>
//       )}

//       {/* Start Button */}
//       {!showTwoUsers && (
//         <div className="button-container">
//           <button className="start-button" onClick={startTwoUserView}>
//             Start Interview
//           </button>
//         </div>
//       )}

//       {/* Display the generated question */}
//       {question && (
//         <div className="question-display">
//           Question: {question}
//           <button onClick={startSpeechRecognition}>Speak your answer</button>
//         </div>
//       )}

//       {/* Display the user's answer */}
//       {userAnswer && (
//         <div className="answer-display">
//           You said: {userAnswer}
//         </div>
//       )}
//     </div>
//   );
// }

// export default InterviewModule;








// import React, { useRef, useState, useEffect } from "react";
// import "./InterviewModule.css";
// import { FaMicrophone, FaCamera } from "react-icons/fa";

// // Check if the browser supports SpeechRecognition API
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// function InterviewModule() {
//   const videoRefRight = useRef(null);
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCameraOn, setIsCameraOn] = useState(true);
//   const [showTwoUsers, setShowTwoUsers] = useState(false);
//   const [question, setQuestion] = useState(""); // Store the current question
//   const [userAnswer, setUserAnswer] = useState(""); // Store the user's answer
//   const [isQuestionFetching, setIsQuestionFetching] = useState(false); // Flag to track if the question is being fetched
//   const [questionCount, setQuestionCount] = useState(0); // Track the number of questions asked
//   const [interviewCompleted, setInterviewCompleted] = useState(false); // Flag to track if interview is complete

//   // Initialize SpeechRecognition
//   const recognition = new SpeechRecognition();
//   recognition.continuous = true;
//   recognition.lang = "en-US";

//   useEffect(() => {
//     if (!showTwoUsers) {
//       startMediaStream(); // Start media stream for the single user initially
//       speakWelcomeMessage(); // Speak the welcome message
//     }
//   }, [showTwoUsers]);

//   const startMediaStream = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       if (videoRefRight.current) {
//         videoRefRight.current.srcObject = stream;
//       }
//     } catch (error) {
//       console.error("Error accessing media devices:", error);
//     }
//   };

//   const speakWelcomeMessage = () => {
//     const welcomeText = "Welcome to the interview!";
//     const utterance = new SpeechSynthesisUtterance(welcomeText);
//     speechSynthesis.speak(utterance);
//   };

//   const toggleMicrophone = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const audioTracks = stream.getAudioTracks();
//       audioTracks.forEach((track) => (track.enabled = !isMicOn));
//       setIsMicOn(!isMicOn);
//     }
//   };

//   const toggleCamera = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const videoTracks = stream.getVideoTracks();
//       videoTracks.forEach((track) => (track.enabled = !isCameraOn));
//       setIsCameraOn(!isCameraOn);
//     }
//   };

//   const startTwoUserView = () => {
//     setShowTwoUsers(true);
//     fetchQuestion(); // Start the interview process by fetching the first question
//   };

//   const fetchQuestion = async () => {
//     if (isQuestionFetching || interviewCompleted) return; // Prevent fetching if interview is complete

//     setIsQuestionFetching(true); // Set flag to true to prevent multiple fetches

//     try {
//       // Fetch question from the backend (Python endpoint)
//       const response = await fetch("http://localhost:5000/start_interview");
//       const data = await response.json();
//       setQuestion(data.question); // Store the question in state

//       // Speak the question using SpeechSynthesis API
//       speakQuestion(data.question);
//     } catch (error) {
//       console.error("Error fetching question:", error);
//     } finally {
//       setIsQuestionFetching(false); // Reset the flag after fetching the question
//     }
//   };

//   const speakQuestion = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     speechSynthesis.speak(utterance);
//   };

//   const startSpeechRecognition = () => {
//     recognition.start(); // Start the recognition

//     recognition.onresult = (event) => {
//       const currentAnswer = event.results[event.results.length - 1][0].transcript;
//       setUserAnswer(currentAnswer); // Store the recognized answer
//       console.log("Recognized Answer: ", currentAnswer);

//       // Send the answer to evaluate_answer
//       evaluateAnswer(currentAnswer);
//     };

//     recognition.onerror = (event) => {
//       console.error("Speech recognition error: ", event.error);
//     };
//   };

//   const evaluateAnswer = async (answer) => {
//     try {
//       // Send the user's answer to the backend for evaluation
//       const response = await fetch("http://localhost:5000/evaluate_answer", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ answer: answer }),
//       });

//       const data = await response.json();
//       console.log("Evaluation result:", data); // Handle evaluation result

//       // After evaluation, increment the question count and check if the interview is over
//       setQuestionCount((prevCount) => {
//         if (prevCount + 1 === 2) {
//           setInterviewCompleted(true); // End the interview after 2 questions
//         }
//         return prevCount + 1;
//       });

//       // Fetch the next question if interview isn't completed
//       if (!interviewCompleted) {
//         fetchQuestion(); // Immediately fetch next question after evaluation
//       }
//     } catch (error) {
//       console.error("Error evaluating answer:", error);
//     }
//   };

//   return (
//     <div className="interview-fullscreen">
//       {showTwoUsers ? (
//         <div className="two-user-view">
//           {/* Left Side: Bot */}
//           <div className="user-video user-left">
//             <img
//               src="https://www.profilebakery.com/wp-content/uploads/2024/05/Profile-picture-created-with-ai.jpeg"
//               alt="Bot"
//               className="bot-image"
//             />
//           </div>

//           {/* Right Side: User Video */}
//           <div className="user-video user-right">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>
//         </div>
//       ) : (
//         <div className="video-fullscreen">
//           {/* Single User View */}
//           <div className="icon-left" onClick={toggleMicrophone}>
//             <FaMicrophone size={30} color={isMicOn ? "green" : "red"} />
//           </div>

//           <div className="video-content">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>

//           <div className="icon-right" onClick={toggleCamera}>
//             <FaCamera size={30} color={isCameraOn ? "green" : "red"} />
//           </div>
//         </div>
//       )}

//       {/* Start Button */}
//       {!showTwoUsers && !interviewCompleted && (
//         <div className="button-container">
//           <button className="start-button" onClick={startTwoUserView}>
//             Start Interview
//           </button>
//         </div>
//       )}

//       {/* Welcome Message */}
//       {!showTwoUsers && !interviewCompleted && (
//         <div className="welcome-message">
//           Welcome to the interview! Click "Start Interview" to begin.
//         </div>
//       )}

//       {/* Display the generated question */}
//       {question && !interviewCompleted && (
//         <div className="question-display">
//           Question: {question}
//           <button onClick={startSpeechRecognition}>Speak your answer</button>
//         </div>
//       )}

//       {/* Display the user's answer */}
//       {userAnswer && !interviewCompleted && (
//         <div className="answer-display">
//           You said: {userAnswer}
//         </div>
//       )}

//       {/* Thank you message after interview */}
//       {interviewCompleted && (
//         <div className="thank-you-message">
//           Thank you, your interview is over!
//         </div>
//       )}
//     </div>
//   );
// }

// export default InterviewModule;

















// import React, { useRef, useState, useEffect } from "react";
// import "./InterviewModule.css";
// import { FaMicrophone, FaCamera } from "react-icons/fa";

// // Check if the browser supports SpeechRecognition API
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// function InterviewModule() {
//   const videoRefRight = useRef(null);
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCameraOn, setIsCameraOn] = useState(true);
//   const [showTwoUsers, setShowTwoUsers] = useState(false);
//   const [question, setQuestion] = useState(""); // Store the current question
//   const [userAnswer, setUserAnswer] = useState(""); // Store the user's answer
//   const [isQuestionFetching, setIsQuestionFetching] = useState(false); // Flag to track if the question is being fetched
//   const [questionCount, setQuestionCount] = useState(0); // Track the number of questions asked
//   const [interviewCompleted, setInterviewCompleted] = useState(false); // Flag to track if interview is complete

//   // Initialize SpeechRecognition
//   const recognition = new SpeechRecognition();
//   recognition.continuous = true;
//   recognition.lang = "en-US";

//   useEffect(() => {
//     if (!showTwoUsers) {
//       startMediaStream(); // Start media stream for the single user initially
//       speakWelcomeMessage(); // Speak the welcome message
//     }
//   }, [showTwoUsers]);

//   const startMediaStream = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       if (videoRefRight.current) {
//         videoRefRight.current.srcObject = stream;
//       }
//     } catch (error) {
//       console.error("Error accessing media devices:", error);
//     }
//   };

//   const speakWelcomeMessage = () => {
//     const welcomeText = "Welcome to the interview!";
//     const utterance = new SpeechSynthesisUtterance(welcomeText);
//     speechSynthesis.speak(utterance);
//   };

//   const toggleMicrophone = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const audioTracks = stream.getAudioTracks();
//       audioTracks.forEach((track) => (track.enabled = !isMicOn));
//       setIsMicOn(!isMicOn);
//     }
//   };

//   const toggleCamera = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const videoTracks = stream.getVideoTracks();
//       videoTracks.forEach((track) => (track.enabled = !isCameraOn));
//       setIsCameraOn(!isCameraOn);
//     }
//   };

//   const startTwoUserView = () => {
//     setShowTwoUsers(true);
//     fetchQuestion(); // Start the interview process by fetching the first question
//     speakWelcomeMessage(); // Speak the welcome message when the interview starts
//   };

//   const fetchQuestion = async () => {
//     if (isQuestionFetching || interviewCompleted) return; // Prevent fetching if interview is complete

//     setIsQuestionFetching(true); // Set flag to true to prevent multiple fetches

//     try {
//       // Fetch question from the backend (Python endpoint)
//       const response = await fetch("http://localhost:5000/start_interview");
//       const data = await response.json();
//       setQuestion(data.question); // Store the question in state

//       // Speak the question using SpeechSynthesis API
//       speakQuestion(data.question);
//     } catch (error) {
//       console.error("Error fetching question:", error);
//     } finally {
//       setIsQuestionFetching(false); // Reset the flag after fetching the question
//     }
//   };

//   const speakQuestion = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     speechSynthesis.speak(utterance);
//   };

//   const startSpeechRecognition = () => {
//     recognition.start(); // Start the recognition

//     recognition.onresult = (event) => {
//       const currentAnswer = event.results[event.results.length - 1][0].transcript;
//       setUserAnswer(currentAnswer); // Store the recognized answer
//       console.log("Recognized Answer: ", currentAnswer);

//       // Send the answer to evaluate_answer
//       evaluateAnswer(currentAnswer);
//     };

//     recognition.onerror = (event) => {
//       console.error("Speech recognition error: ", event.error);
//     };
//   };

//   const evaluateAnswer = async (answer) => {
//     try {
//       // Send the user's answer to the backend for evaluation
//       const response = await fetch("http://localhost:5000/evaluate_answer", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ answer: answer }),
//       });

//       const data = await response.json();
//       console.log("Evaluation result:", data); // Handle evaluation result

//       // After evaluation, increment the question count and check if the interview is over
//       setQuestionCount((prevCount) => {
//         if (prevCount + 1 === 2) {
//           setInterviewCompleted(true); // End the interview after 2 questions
//           speakThankYouMessage(); // Speak Thank you when the interview is over
//         }
//         return prevCount + 1;
//       });

//       // Fetch the next question if interview isn't completed
//       if (!interviewCompleted) {
//         fetchQuestion(); // Immediately fetch next question after evaluation
//       }
//     } catch (error) {
//       console.error("Error evaluating answer:", error);
//     }
//   };

//   const speakThankYouMessage = () => {
//     const thankYouText = "Thank you, your interview is over!";
//     const utterance = new SpeechSynthesisUtterance(thankYouText);
//     speechSynthesis.speak(utterance);
//   };

//   return (
//     <div className="interview-fullscreen">
//       {showTwoUsers ? (
//         <div className="two-user-view">
//           {/* Left Side: Bot */}
//           <div className="user-video user-left">
//             <img
//               src="https://www.profilebakery.com/wp-content/uploads/2024/05/Profile-picture-created-with-ai.jpeg"
//               alt="Bot"
//               className="bot-image"
//             />
//           </div>

//           {/* Right Side: User Video */}
//           <div className="user-video user-right">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>
//         </div>
//       ) : (
//         <div className="video-fullscreen">
//           {/* Single User View */}
//           <div className="icon-left" onClick={toggleMicrophone}>
//             <FaMicrophone size={30} color={isMicOn ? "green" : "red"} />
//           </div>

//           <div className="video-content">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>

//           <div className="icon-right" onClick={toggleCamera}>
//             <FaCamera size={30} color={isCameraOn ? "green" : "red"} />
//           </div>
//         </div>
//       )}

//       {/* Start Button */}
//       {!showTwoUsers && !interviewCompleted && (
//         <div className="button-container">
//           <button className="start-button" onClick={startTwoUserView}>
//             Start Interview
//           </button>
//         </div>
//       )}

//       {/* Welcome Message */}
//       {!showTwoUsers && !interviewCompleted && (
//         <div className="welcome-message">
//           Welcome to the interview! Click "Start Interview" to begin.
//         </div>
//       )}

//       {/* Display the generated question */}
//       {question && !interviewCompleted && (
//         <div className="question-display">
//           Question: {question}
//           <button onClick={startSpeechRecognition}>Speak your answer</button>
//         </div>
//       )}

//       {/* Display the user's answer */}
//       {userAnswer && !interviewCompleted && (
//         <div className="answer-display">
//           You said: {userAnswer}
//         </div>
//       )}

//       {/* Thank you message after interview */}
//       {interviewCompleted && (
//         <div className="thank-you-message">
//           Thank you, your interview is over!
//         </div>
//       )}
//     </div>
//   );
// }

// export default InterviewModule;






// import React, { useRef, useState, useEffect } from "react";
// import "./InterviewModule.css";
// import { FaMicrophone, FaCamera } from "react-icons/fa";

// // Check if the browser supports SpeechRecognition API
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// function InterviewModule() {
//   const videoRefRight = useRef(null);
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCameraOn, setIsCameraOn] = useState(true);
//   const [showTwoUsers, setShowTwoUsers] = useState(false);
//   const [question, setQuestion] = useState(""); // Store the current question
//   const [userAnswer, setUserAnswer] = useState(""); // Store the user's answer
//   const [isQuestionFetching, setIsQuestionFetching] = useState(false); // Flag to track if the question is being fetched
//   const [questionCount, setQuestionCount] = useState(0); // Track the number of questions asked
//   const [interviewCompleted, setInterviewCompleted] = useState(false); // Flag to track if interview is complete

//   // Initialize SpeechRecognition
//   const recognition = new SpeechRecognition();
//   recognition.continuous = true;
//   recognition.lang = "en-US";

//   useEffect(() => {
//     if (!showTwoUsers) {
//       startMediaStream(); // Start media stream for the single user initially
//       speakWelcomeMessage(); // Speak the welcome message
//     }
//   }, [showTwoUsers]);

//   const startMediaStream = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       if (videoRefRight.current) {
//         videoRefRight.current.srcObject = stream;
//       }
//     } catch (error) {
//       console.error("Error accessing media devices:", error);
//     }
//   };

//   const speakWelcomeMessage = () => {
//     const welcomeText = "Welcome to the interview!";
//     const utterance = new SpeechSynthesisUtterance(welcomeText);
//     speechSynthesis.speak(utterance);
//   };

//   const toggleMicrophone = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const audioTracks = stream.getAudioTracks();
//       audioTracks.forEach((track) => (track.enabled = !isMicOn));
//       setIsMicOn(!isMicOn);
//     }
//   };

//   const toggleCamera = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const videoTracks = stream.getVideoTracks();
//       videoTracks.forEach((track) => (track.enabled = !isCameraOn));
//       setIsCameraOn(!isCameraOn);
//     }
//   };

//   const startTwoUserView = () => {
//     setShowTwoUsers(true);
//     fetchQuestion(); // Start the interview process by fetching the first question
//     speakWelcomeMessage(); // Speak the welcome message when the interview starts
//   };

//   const fetchQuestion = async () => {
//     if (isQuestionFetching || interviewCompleted) return; // Prevent fetching if interview is complete

//     setIsQuestionFetching(true); // Set flag to true to prevent multiple fetches

//     try {
//       // Fetch question from the backend (Python endpoint)
//       const response = await fetch("http://localhost:5000/start_interview");
//       const data = await response.json();
//       setQuestion(data.question); // Store the question in state

//       // Speak the question using SpeechSynthesis API
//       speakQuestion(data.question);
//     } catch (error) {
//       console.error("Error fetching question:", error);
//     } finally {
//       setIsQuestionFetching(false); // Reset the flag after fetching the question
//     }
//   };

//   const speakQuestion = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     speechSynthesis.speak(utterance);
//   };

//   const startSpeechRecognition = () => {
//     recognition.start(); // Start the recognition

//     recognition.onresult = (event) => {
//       const currentAnswer = event.results[event.results.length - 1][0].transcript;
//       setUserAnswer(currentAnswer); // Store the recognized answer
//       console.log("Recognized Answer: ", currentAnswer);

//       // Send the answer to evaluate_answer
//       evaluateAnswer(currentAnswer);
//     };

//     recognition.onerror = (event) => {
//       console.error("Speech recognition error: ", event.error);
//     };
//   };

//   const evaluateAnswer = async (answer) => {
//     try {
//       // Send the user's answer to the backend for evaluation
//       const response = await fetch("http://localhost:5000/evaluate_answer", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ answer: answer }),
//       });

//       const data = await response.json();
//       console.log("Evaluation result:", data); // Handle evaluation result

//       // After evaluation, increment the question count and check if the interview is over
//       setQuestionCount((prevCount) => {
//         if (prevCount + 1 === 2) {
//           setInterviewCompleted(true); // End the interview after 2 questions
//           speakThankYouMessage(); // Speak Thank you when the interview is over
//         }
//         return prevCount + 1;
//       });

//       // Fetch the next question if interview isn't completed
//       if (!interviewCompleted) {
//         fetchQuestion(); // Immediately fetch next question after evaluation
//       }
//     } catch (error) {
//       console.error("Error evaluating answer:", error);
//     }
//   };

//   const speakThankYouMessage = () => {
//     const thankYouText = "Thank you, your interview is over!";
//     const utterance = new SpeechSynthesisUtterance(thankYouText);
//     speechSynthesis.speak(utterance);
//   };

//   return (
//     <div className="interview-fullscreen">
//       {showTwoUsers ? (
//         <div className="two-user-view">
//           {/* Left Side: Bot */}
//           <div className="user-video user-left">
//             <img
//               src="https://www.profilebakery.com/wp-content/uploads/2024/05/Profile-picture-created-with-ai.jpeg"
//               alt="Bot"
//               className="bot-image"
//             />
//           </div>

//           {/* Right Side: User Video */}
//           <div className="user-video user-right">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>
//         </div>
//       ) : (
//         <div className="video-fullscreen">
//           {/* Single User View */}
//           <div className="icon-left" onClick={toggleMicrophone}>
//             <FaMicrophone size={30} color={isMicOn ? "green" : "red"} />
//           </div>

//           <div className="video-content">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>

//           <div className="icon-right" onClick={toggleCamera}>
//             <FaCamera size={30} color={isCameraOn ? "green" : "red"} />
//           </div>
//         </div>
//       )}

//       {/* Start Button */}
//       {!showTwoUsers && !interviewCompleted && (
//         <div className="button-container">
//           <button className="start-button" onClick={startTwoUserView}>
//             Start Interview
//           </button>
//         </div>
//       )}

//       {/* Welcome Message */}
//       {!showTwoUsers && !interviewCompleted && (
//         <div className="welcome-message">
//           Welcome to the interview! Click "Start Interview" to begin.
//         </div>
//       )}

//       {/* Display the generated question */}
//       {question && !interviewCompleted && (
//         <div className="question-display">
//           Question: {question}
//           <button onClick={startSpeechRecognition}>Speak your answer</button>
//         </div>
//       )}

//       {/* Display the user's answer */}
//       {userAnswer && !interviewCompleted && (
//         <div className="answer-display">
//           You said: {userAnswer}
//         </div>
//       )}

//       {/* Thank you message after interview */}
//       {interviewCompleted && (
//         <div className="thank-you-message">
//           Thank you, your interview is over!
//         </div>
//       )}
//     </div>
//   );
// }

// export default InterviewModule;







// import React, { useRef, useState, useEffect } from "react";
// import "./InterviewModule.css";
// import { FaMicrophone, FaCamera } from "react-icons/fa";

// // Check if the browser supports SpeechRecognition API
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// function InterviewModule() {
//   const videoRefRight = useRef(null);
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCameraOn, setIsCameraOn] = useState(true);
//   const [showTwoUsers, setShowTwoUsers] = useState(false);
//   const [question, setQuestion] = useState(""); // Store the current question
//   const [userAnswer, setUserAnswer] = useState(""); // Store the user's answer
//   const [isQuestionFetching, setIsQuestionFetching] = useState(false); // Flag to track if the question is being fetched
//   const [questionCount, setQuestionCount] = useState(0); // Track the number of questions asked
//   const [interviewCompleted, setInterviewCompleted] = useState(false); // Flag to track if interview is complete

//   // Initialize SpeechRecognition
//   const recognition = new SpeechRecognition();
//   recognition.continuous = true;
//   recognition.lang = "en-US";

//   useEffect(() => {
//     if (!showTwoUsers) {
//       startMediaStream(); // Start media stream for the single user initially
//       speakWelcomeMessage(); // Speak the welcome message
//     }
//   }, [showTwoUsers]);

//   const startMediaStream = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       if (videoRefRight.current) {
//         videoRefRight.current.srcObject = stream;
//       }
//     } catch (error) {
//       console.error("Error accessing media devices:", error);
//     }
//   };

//   const speakWelcomeMessage = () => {
//     const welcomeText = "Welcome to the interview!";
//     const utterance = new SpeechSynthesisUtterance(welcomeText);
//     speechSynthesis.speak(utterance);
//   };

//   const toggleMicrophone = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const audioTracks = stream.getAudioTracks();
//       audioTracks.forEach((track) => (track.enabled = !isMicOn));
//       setIsMicOn(!isMicOn);
//     }
//   };

//   const toggleCamera = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const videoTracks = stream.getVideoTracks();
//       videoTracks.forEach((track) => (track.enabled = !isCameraOn));
//       setIsCameraOn(!isCameraOn);
//     }
//   };

//   const startTwoUserView = () => {
//     setShowTwoUsers(true);
//     fetchQuestion(); // Start the interview process by fetching the first question
//     speakWelcomeMessage(); // Speak the welcome message when the interview starts
//   };

//   const fetchQuestion = async () => {
//     if (isQuestionFetching || interviewCompleted) return; // Prevent fetching if interview is complete

//     setIsQuestionFetching(true); // Set flag to true to prevent multiple fetches

//     try {
//       // Fetch question from the backend (Python endpoint)
//       const response = await fetch("http://localhost:5000/start_interview");
//       const data = await response.json();
//       setQuestion(data.question); // Store the question in state

//       // Speak the question using SpeechSynthesis API
//       speakQuestion(data.question);
//     } catch (error) {
//       console.error("Error fetching question:", error);
//     } finally {
//       setIsQuestionFetching(false); // Reset the flag after fetching the question
//     }
//   };

//   const speakQuestion = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     speechSynthesis.speak(utterance);
//   };

//   const startSpeechRecognition = () => {
//     recognition.start(); // Start the recognition

//     recognition.onresult = (event) => {
//       const currentAnswer = event.results[event.results.length - 1][0].transcript;
//       setUserAnswer(currentAnswer); // Store the recognized answer
//       console.log("Recognized Answer: ", currentAnswer);

//       // Send the answer to evaluate_answer
//       evaluateAnswer(currentAnswer);
//     };

//     recognition.onerror = (event) => {
//       console.error("Speech recognition error: ", event.error);
//     };
//   };

//   const evaluateAnswer = async (answer) => {
//     try {
//       // Send the user's answer to the backend for evaluation
//       const response = await fetch("http://localhost:5000/evaluate_answer", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ answer: answer }),
//       });

//       const data = await response.json();
//       console.log("Evaluation result:", data); // Handle evaluation result

//       // After evaluation, increment the question count and check if the interview is over
//       setQuestionCount((prevCount) => {
//         if (prevCount + 1 === 2) {
//           setInterviewCompleted(true); // End the interview after 2 questions
//           speakThankYouMessage(); // Speak Thank you when the interview is over
//         }
//         return prevCount + 1;
//       });

//       // Fetch the next question if interview isn't completed
//       if (!interviewCompleted) {
//         fetchQuestion(); // Immediately fetch next question after evaluation
//       }
//     } catch (error) {
//       console.error("Error evaluating answer:", error);
//     }
//   };

//   const speakThankYouMessage = () => {
//     const thankYouText = "Thank you, your interview is over!";
//     const utterance = new SpeechSynthesisUtterance(thankYouText);
//     speechSynthesis.speak(utterance);
//   };

//   return (
//     <div className="interview-fullscreen">
//       {showTwoUsers ? (
//         <div className="two-user-view">
//           {/* Left Side: Bot */}
//           <div className="user-video user-left">
//             <img
//               src="https://www.profilebakery.com/wp-content/uploads/2024/05/Profile-picture-created-with-ai.jpeg"
//               alt="Bot"
//               className="bot-image"
//             />
//           </div>

//           {/* Right Side: User Video */}
//           <div className="user-video user-right">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>
//         </div>
//       ) : (
//         <div className="video-fullscreen">
//           {/* Single User View */}
//           <div className="icon-left" onClick={toggleMicrophone}>
//             <FaMicrophone size={30} color={isMicOn ? "green" : "red"} />
//           </div>

//           <div className="video-content">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>

//           <div className="icon-right" onClick={toggleCamera}>
//             <FaCamera size={30} color={isCameraOn ? "green" : "red"} />
//           </div>
//         </div>
//       )}

//       {/* Start Button */}
//       {!showTwoUsers && !interviewCompleted && (
//         <div className="button-container">
//           <button className="start-button" onClick={startTwoUserView}>
//             Start Interview
//           </button>
//         </div>
//       )}

//       {/* Welcome Message */}
//       {!showTwoUsers && !interviewCompleted && (
//         <div className="welcome-message">
//           Welcome to the interview! Click "Start Interview" to begin.
//         </div>
//       )}

//       {/* Display the generated question */}
//       {question && !interviewCompleted && (
//         <div className="question-display">
//           Question: {question}
//           <button onClick={startSpeechRecognition}>Speak your answer</button>
//         </div>
//       )}

//       {/* Display the user's answer */}
//       {userAnswer && !interviewCompleted && (
//         <div className="answer-display">
//           You said: {userAnswer}
//         </div>
//       )}

//       {/* Thank you message after interview */}
//       {interviewCompleted && (
//         <div className="thank-you-message">
//           Thank you, your interview is over!
//         </div>
//       )}
//     </div>
//   );
// }

// export default InterviewModule;









// import React, { useRef, useState, useEffect } from "react";
// import "./InterviewModule.css";
// import { FaMicrophone, FaCamera } from "react-icons/fa";

// // Check if the browser supports SpeechRecognition API
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// function InterviewModule() {
//   const videoRefRight = useRef(null);
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCameraOn, setIsCameraOn] = useState(true);
//   const [showTwoUsers, setShowTwoUsers] = useState(false);
//   const [question, setQuestion] = useState(""); // Store the current question
//   const [userAnswer, setUserAnswer] = useState(""); // Store the user's answer
//   const [isQuestionFetching, setIsQuestionFetching] = useState(false); // Flag to track if the question is being fetched
//   const [questionCount, setQuestionCount] = useState(0); // Track the number of questions asked
//   const [interviewCompleted, setInterviewCompleted] = useState(false); // Flag to track if interview is complete
//   const [hasWelcomeSpoken, setHasWelcomeSpoken] = useState(false); // Flag to track if welcome message has been spoken

//   // Initialize SpeechRecognition
//   const recognition = new SpeechRecognition();
//   recognition.continuous = true;
//   recognition.lang = "en-US";

//   useEffect(() => {
//     if (!showTwoUsers && !hasWelcomeSpoken) {
//       speakWelcomeMessage(); // Speak the welcome message only once
//       setHasWelcomeSpoken(true); // Set the flag to true after speaking the message
//     }

//     if (!showTwoUsers) {
//       startMediaStream(); // Start media stream for the single user initially
//     }
//   }, [showTwoUsers, hasWelcomeSpoken]);

//   const startMediaStream = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       if (videoRefRight.current) {
//         videoRefRight.current.srcObject = stream;
//       }
//     } catch (error) {
//       console.error("Error accessing media devices:", error);
//     }
//   };

//   const speakWelcomeMessage = () => {
//     const welcomeText = "Welcome to the interview!";
//     const utterance = new SpeechSynthesisUtterance(welcomeText);
//     speechSynthesis.speak(utterance);
//   };

//   const toggleMicrophone = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const audioTracks = stream.getAudioTracks();
//       audioTracks.forEach((track) => (track.enabled = !isMicOn));
//       setIsMicOn(!isMicOn);
//     }
//   };

//   const toggleCamera = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const videoTracks = stream.getVideoTracks();
//       videoTracks.forEach((track) => (track.enabled = !isCameraOn));
//       setIsCameraOn(!isCameraOn);
//     }
//   };

//   const startTwoUserView = () => {
//     setShowTwoUsers(true);
//     fetchQuestion(); // Start the interview process by fetching the first question
//   };

//   const fetchQuestion = async () => {
//     if (isQuestionFetching || interviewCompleted) return; // Prevent fetching if interview is complete

//     setIsQuestionFetching(true); // Set flag to true to prevent multiple fetches

//     try {
//       // Fetch question from the backend (Python endpoint)
//       const response = await fetch("http://localhost:5000/start_interview");
//       const data = await response.json();
//       setQuestion(data.question); // Store the question in state

//       // Speak the question using SpeechSynthesis API
//       speakQuestion(data.question);
//     } catch (error) {
//       console.error("Error fetching question:", error);
//     } finally {
//       setIsQuestionFetching(false); // Reset the flag after fetching the question
//     }
//   };

//   const speakQuestion = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     speechSynthesis.speak(utterance);
//   };

//   const startSpeechRecognition = () => {
//     recognition.start(); // Start the recognition

//     recognition.onresult = (event) => {
//       const currentAnswer = event.results[event.results.length - 1][0].transcript;
//       setUserAnswer(currentAnswer); // Store the recognized answer
//       console.log("Recognized Answer: ", currentAnswer);

//       // Send the answer to evaluate_answer
//       evaluateAnswer(currentAnswer);
//     };

//     recognition.onerror = (event) => {
//       console.error("Speech recognition error: ", event.error);
//     };
//   };

//   const evaluateAnswer = async (answer) => {
//     try {
//       // Send the user's answer to the backend for evaluation
//       const response = await fetch("http://localhost:5000/evaluate_answer", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ answer: answer }),
//       });

//       const data = await response.json();
//       console.log("Evaluation result:", data); // Handle evaluation result

//       // After evaluation, increment the question count and check if the interview is over
//       setQuestionCount((prevCount) => {
//         if (prevCount + 1 === 2) {
//           setInterviewCompleted(true); // End the interview after 2 questions
//           speakThankYouMessage(); // Speak Thank you when the interview is over
//         }
//         return prevCount + 1;
//       });

//       // Fetch the next question if interview isn't completed
//       if (!interviewCompleted) {
//         fetchQuestion(); // Immediately fetch next question after evaluation
//       }
//     } catch (error) {
//       console.error("Error evaluating answer:", error);
//     }
//   };

//   const speakThankYouMessage = () => {
//     const thankYouText = "Thank you, your interview is over!";
//     const utterance = new SpeechSynthesisUtterance(thankYouText);
//     speechSynthesis.speak(utterance);
//   };

//   return (
//     <div className="interview-fullscreen">
//       {showTwoUsers ? (
//         <div className="two-user-view">
//           {/* Left Side: Bot */}
//           <div className="user-video user-left">
//             <img
//               src="https://www.profilebakery.com/wp-content/uploads/2024/05/Profile-picture-created-with-ai.jpeg"
//               alt="Bot"
//               className="bot-image"
//             />
//           </div>

//           {/* Right Side: User Video */}
//           <div className="user-video user-right">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>
//         </div>
//       ) : (
//         <div className="video-fullscreen">
//           {/* Single User View */}
//           <div className="icon-left" onClick={toggleMicrophone}>
//             <FaMicrophone size={30} color={isMicOn ? "green" : "red"} />
//           </div>

//           <div className="video-content">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>

//           <div className="icon-right" onClick={toggleCamera}>
//             <FaCamera size={30} color={isCameraOn ? "green" : "red"} />
//           </div>
//         </div>
//       )}

//       {/* Start Button */}
//       {!showTwoUsers && !interviewCompleted && (
//         <div className="button-container">
//           <button className="start-button" onClick={startTwoUserView}>
//             Start Interview
//           </button>
//         </div>
//       )}

//       {/* Welcome Message */}
//       {!showTwoUsers && !interviewCompleted && (
//         <div className="welcome-message">
//           Welcome to the interview! Click "Start Interview" to begin.
//         </div>
//       )}

//       {/* Display the generated question */}
//       {question && !interviewCompleted && (
//         <div className="question-display">
//           Question: {question}
//           <button onClick={startSpeechRecognition}>Speak your answer</button>
//         </div>
//       )}

//       {/* Display the user's answer */}
//       {userAnswer && !interviewCompleted && (
//         <div className="answer-display">
//           You said: {userAnswer}
//         </div>
//       )}

//       {/* Thank you message after interview */}
//       {interviewCompleted && (
//         <div className="thank-you-message">
//           Thank you, your interview is over!
//         </div>
//       )}
//     </div>
//   );
// }

// export default InterviewModule;










// import React, { useRef, useState, useEffect } from "react";
// import "./InterviewModule.css";
// import { FaMicrophone, FaCamera } from "react-icons/fa";

// // Check if the browser supports SpeechRecognition API
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// function InterviewModule() {
//   const videoRefRight = useRef(null);
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCameraOn, setIsCameraOn] = useState(true);
//   const [showTwoUsers, setShowTwoUsers] = useState(false);
//   const [question, setQuestion] = useState(""); // Store the current question
//   const [userAnswer, setUserAnswer] = useState(""); // Store the user's answer
//   const [isQuestionFetching, setIsQuestionFetching] = useState(false); // Flag to track if the question is being fetched
//   const [questionCount, setQuestionCount] = useState(0); // Track the number of questions asked
//   const [interviewCompleted, setInterviewCompleted] = useState(false); // Flag to track if interview is complete
//   const [welcomeMessageSpoken, setWelcomeMessageSpoken] = useState(false); // Flag to track if welcome message has been spoken

//   // Initialize SpeechRecognition
//   const recognition = new SpeechRecognition();
//   recognition.continuous = true;
//   recognition.lang = "en-US";

//   useEffect(() => {
//     if (!showTwoUsers && !welcomeMessageSpoken) {
//       speakWelcomeMessage(); // Speak the welcome message only if it's not spoken already
//     }
//   }, [showTwoUsers, welcomeMessageSpoken]);

//   const startMediaStream = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       if (videoRefRight.current) {
//         videoRefRight.current.srcObject = stream;
//       }
//     } catch (error) {
//       console.error("Error accessing media devices:", error);
//     }
//   };

//   const speakWelcomeMessage = () => {
//     const welcomeText = "Welcome to the interview!";
//     const utterance = new SpeechSynthesisUtterance(welcomeText);
//     speechSynthesis.speak(utterance);
//     setWelcomeMessageSpoken(true); // Set the flag to true after speaking the message
//   };

//   const toggleMicrophone = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const audioTracks = stream.getAudioTracks();
//       audioTracks.forEach((track) => (track.enabled = !isMicOn));
//       setIsMicOn(!isMicOn);
//     }
//   };

//   const toggleCamera = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const videoTracks = stream.getVideoTracks();
//       videoTracks.forEach((track) => (track.enabled = !isCameraOn));
//       setIsCameraOn(!isCameraOn);
//     }
//   };

//   const startTwoUserView = () => {
//     setShowTwoUsers(true);
//     fetchQuestion(); // Start the interview process by fetching the first question
//   };

//   const fetchQuestion = async () => {
//     if (isQuestionFetching || interviewCompleted) return; // Prevent fetching if interview is complete

//     setIsQuestionFetching(true); // Set flag to true to prevent multiple fetches

//     try {
//       // Fetch question from the backend (Python endpoint)
//       const response = await fetch("http://localhost:5000/start_interview");
//       const data = await response.json();
//       setQuestion(data.question); // Store the question in state

//       // Speak the question using SpeechSynthesis API
//       speakQuestion(data.question);
//     } catch (error) {
//       console.error("Error fetching question:", error);
//     } finally {
//       setIsQuestionFetching(false); // Reset the flag after fetching the question
//     }
//   };

//   const speakQuestion = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     speechSynthesis.speak(utterance);
//   };

//   const startSpeechRecognition = () => {
//     recognition.start(); // Start the recognition

//     recognition.onresult = (event) => {
//       const currentAnswer = event.results[event.results.length - 1][0].transcript;
//       setUserAnswer(currentAnswer); // Store the recognized answer
//       console.log("Recognized Answer: ", currentAnswer);

//       // Send the answer to evaluate_answer
//       evaluateAnswer(currentAnswer);
//     };

//     recognition.onerror = (event) => {
//       console.error("Speech recognition error: ", event.error);
//     };
//   };

//   const evaluateAnswer = async (answer) => {
//     try {
//       // Send the user's answer to the backend for evaluation
//       const response = await fetch("http://localhost:5000/evaluate_answer", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ answer: answer }),
//       });

//       const data = await response.json();
//       console.log("Evaluation result:", data); // Handle evaluation result

//       // After evaluation, increment the question count and check if the interview is over
//       setQuestionCount((prevCount) => {
//         if (prevCount + 1 === 2) {
//           setInterviewCompleted(true); // End the interview after 2 questions
//         }
//         return prevCount + 1;
//       });

//       // Fetch the next question if interview isn't completed
//       if (!interviewCompleted) {
//         fetchQuestion(); // Immediately fetch next question after evaluation
//       }
//     } catch (error) {
//       console.error("Error evaluating answer:", error);
//     }
//   };

//   return (
//     <div className="interview-fullscreen">
//       {showTwoUsers ? (
//         <div className="two-user-view">
//           {/* Left Side: Bot */}
//           <div className="user-video user-left">
//             <img
//               src="https://www.profilebakery.com/wp-content/uploads/2024/05/Profile-picture-created-with-ai.jpeg"
//               alt="Bot"
//               className="bot-image"
//             />
//           </div>

//           {/* Right Side: User Video */}
//           <div className="user-video user-right">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>
//         </div>
//       ) : (
//         <div className="video-fullscreen">
//           {/* Single User View */}
//           <div className="icon-left" onClick={toggleMicrophone}>
//             <FaMicrophone size={30} color={isMicOn ? "green" : "red"} />
//           </div>

//           <div className="video-content">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>

//           <div className="icon-right" onClick={toggleCamera}>
//             <FaCamera size={30} color={isCameraOn ? "green" : "red"} />
//           </div>
//         </div>
//       )}

//       {/* Start Button */}
//       {!showTwoUsers && !interviewCompleted && (
//         <div className="button-container">
//           <button className="start-button" onClick={startTwoUserView}>
//             Start Interview
//           </button>
//         </div>
//       )}

//       {/* Welcome Message */}
//       {!showTwoUsers && !interviewCompleted && (
//         <div className="welcome-message">
//           Welcome to the interview! Click "Start Interview" to begin.
//         </div>
//       )}

//       {/* Display the generated question */}
//       {question && !interviewCompleted && (
//         <div className="question-display">
//           Question: {question}
//           <button onClick={startSpeechRecognition}>Speak your answer</button>
//         </div>
//       )}

//       {/* Display the user's answer */}
//       {userAnswer && !interviewCompleted && (
//         <div className="answer-display">
//           You said: {userAnswer}
//         </div>
//       )}

//       {/* Thank you message after interview */}
//       {interviewCompleted && (
//         <div className="thank-you-message">
//           Thank you, your interview is over!
//         </div>
//       )}
//     </div>
//   );
// }

// export default InterviewModule;










// import React, { useRef, useState, useEffect } from "react";
// import "./InterviewModule.css";
// import { FaMicrophone, FaCamera } from "react-icons/fa";

// // Check if the browser supports SpeechRecognition API
// const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

// function InterviewModule() {
//   const videoRefRight = useRef(null);
//   const [isMicOn, setIsMicOn] = useState(true);
//   const [isCameraOn, setIsCameraOn] = useState(true);
//   const [showTwoUsers, setShowTwoUsers] = useState(false);
//   const [question, setQuestion] = useState(""); // Store the current question
//   const [userAnswer, setUserAnswer] = useState(""); // Store the user's answer
//   const [isQuestionFetching, setIsQuestionFetching] = useState(false); // Flag to track if the question is being fetched
//   const [questionCount, setQuestionCount] = useState(0); // Track the number of questions asked
//   const [interviewCompleted, setInterviewCompleted] = useState(false); // Flag to track if interview is complete

//   // Initialize SpeechRecognition
//   const recognition = new SpeechRecognition();
//   recognition.continuous = true;
//   recognition.lang = "en-US";

//   useEffect(() => {
//     if (!showTwoUsers) {
//       startMediaStream(); // Start media stream for the single user initially
//     }
//   }, [showTwoUsers]);

//   const startMediaStream = async () => {
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//         audio: true,
//       });

//       if (videoRefRight.current) {
//         videoRefRight.current.srcObject = stream;
//       }
//     } catch (error) {
//       console.error("Error accessing media devices:", error);
//     }
//   };

//   const toggleMicrophone = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const audioTracks = stream.getAudioTracks();
//       audioTracks.forEach((track) => (track.enabled = !isMicOn));
//       setIsMicOn(!isMicOn);
//     }
//   };

//   const toggleCamera = () => {
//     const stream = videoRefRight.current?.srcObject;
//     if (stream) {
//       const videoTracks = stream.getVideoTracks();
//       videoTracks.forEach((track) => (track.enabled = !isCameraOn));
//       setIsCameraOn(!isCameraOn);
//     }
//   };

//   const startTwoUserView = () => {
//     setShowTwoUsers(true);
//     fetchQuestion(); // Start the interview process by fetching the first question
//   };

//   const fetchQuestion = async () => {
//     if (isQuestionFetching || interviewCompleted) return; // Prevent fetching if interview is complete

//     setIsQuestionFetching(true); // Set flag to true to prevent multiple fetches

//     try {
//       // Fetch question from the backend (Python endpoint)
//       const response = await fetch("http://localhost:5000/start_interview");
//       const data = await response.json();
//       setQuestion(data.question); // Store the question in state

//       // Speak the question using SpeechSynthesis API
//       speakQuestion(data.question);
//     } catch (error) {
//       console.error("Error fetching question:", error);
//     } finally {
//       setIsQuestionFetching(false); // Reset the flag after fetching the question
//     }
//   };

//   const speakQuestion = (text) => {
//     const utterance = new SpeechSynthesisUtterance(text);
//     speechSynthesis.speak(utterance);
//   };

//   const startSpeechRecognition = () => {
//     recognition.start(); // Start the recognition

//     recognition.onresult = (event) => {
//       const currentAnswer = event.results[event.results.length - 1][0].transcript;
//       setUserAnswer(currentAnswer); // Store the recognized answer
//       console.log("Recognized Answer: ", currentAnswer);

//       // Send the answer to evaluate_answer
//       evaluateAnswer(currentAnswer);
//     };

//     recognition.onerror = (event) => {
//       console.error("Speech recognition error: ", event.error);
//     };
//   };

//   const evaluateAnswer = async (answer) => {
//     try {
//       // Send the user's answer to the backend for evaluation
//       const response = await fetch("http://localhost:5000/evaluate_answer", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ answer: answer }),
//       });

//       const data = await response.json();
//       console.log("Evaluation result:", data); // Handle evaluation result

//       // After evaluation, increment the question count and check if the interview is over
//       setQuestionCount((prevCount) => {
//         if (prevCount + 1 === 2) {
//           setInterviewCompleted(true); // End the interview after 2 questions
//         }
//         return prevCount + 1;
//       });

//       // Fetch the next question if interview isn't completed
//       if (!interviewCompleted) {
//         fetchQuestion(); // Immediately fetch next question after evaluation
//       }
//     } catch (error) {
//       console.error("Error evaluating answer:", error);
//     }
//   };

//   return (
//     <div className="interview-fullscreen">
//       {showTwoUsers ? (
//         <div className="two-user-view">
//           {/* Left Side: Bot */}
//           <div className="user-video user-left">
//             <img
//               src="https://www.profilebakery.com/wp-content/uploads/2024/05/Profile-picture-created-with-ai.jpeg"
//               alt="Bot"
//               className="bot-image"
//             />
//           </div>

//           {/* Right Side: User Video */}
//           <div className="user-video user-right">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>
//         </div>
//       ) : (
//         <div className="video-fullscreen">
//           {/* Single User View */}
//           <div className="icon-left" onClick={toggleMicrophone}>
//             <FaMicrophone size={30} color={isMicOn ? "green" : "red"} />
//           </div>

//           <div className="video-content">
//             <video
//               ref={videoRefRight}
//               autoPlay
//               playsInline
//               muted
//               className="video-element"
//             ></video>
//           </div>

//           <div className="icon-right" onClick={toggleCamera}>
//             <FaCamera size={30} color={isCameraOn ? "green" : "red"} />
//           </div>
//         </div>
//       )}

//       {/* Start Button */}
//       {!showTwoUsers && !interviewCompleted && (
//         <div className="button-container">
//           <button className="start-button" onClick={startTwoUserView}>
//             Start Interview
//           </button>
//         </div>
//       )}

//       {/* Welcome Message */}
//       {!showTwoUsers && !interviewCompleted && (
//         <div className="welcome-message">
//           Welcome to the interview! Click "Start Interview" to begin.
//         </div>
//       )}

//       {/* Display the generated question */}
//       {question && !interviewCompleted && (
//         <div className="question-display">
//           Question: {question}
//           <button onClick={startSpeechRecognition}>Speak your answer</button>
//         </div>
//       )}

//       {/* Display the user's answer */}
//       {userAnswer && !interviewCompleted && (
//         <div className="answer-display">
//           You said: {userAnswer}
//         </div>
//       )}

//       {/* Thank you message after interview */}
//       {interviewCompleted && (
//         <div className="thank-you-message">
//           Thank you, your interview is over!
//         </div>
//       )}
//     </div>
//   );
// }

// export default InterviewModule;





import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./InterviewModule.css";
import { FaMicrophone, FaCamera } from "react-icons/fa";

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;

function InterviewModule() {
  const videoRefRight = useRef(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [showTwoUsers, setShowTwoUsers] = useState(false);
  const [question, setQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [isQuestionFetching, setIsQuestionFetching] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [silenceTimeout, setSilenceTimeout] = useState(null);
  const navigate = useNavigate();

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.lang = "en-US";

  useEffect(() => {
    if (!showTwoUsers) {
      startMediaStream();
    }
  }, [showTwoUsers]);

  const startMediaStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      if (videoRefRight.current) {
        videoRefRight.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing media devices:", error);
    }
  };

  const toggleMicrophone = () => {
    const stream = videoRefRight.current?.srcObject;
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach((track) => (track.enabled = !isMicOn));
      setIsMicOn(!isMicOn);
    }
  };

  const toggleCamera = () => {
    const stream = videoRefRight.current?.srcObject;
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach((track) => (track.enabled = !isCameraOn));
      setIsCameraOn(!isCameraOn);
    }
  };

  const startTwoUserView = () => {
    setShowTwoUsers(true);
    fetchQuestion();
  };

  const fetchQuestion = async () => {
    if (isQuestionFetching || interviewCompleted) return;
  
    // Clear silence timeout
    if (silenceTimeout) {
      clearTimeout(silenceTimeout);
      setSilenceTimeout(null);
    }
  
    if (questionCount === 1) {
      setInterviewCompleted(true);
      recognition.stop(); // Stop the microphone
      navigate("/interview-over"); // Route to another page if count is 1
      return;
    }
  
    setIsQuestionFetching(true);
  
    try {
      const response = await fetch("http://localhost:5000/start_interview");
      const data = await response.json();
      setQuestion(data.question);
      speakQuestion(data.question);
  
      setQuestionCount((prevCount) => prevCount + 1);
    } catch (error) {
      console.error("Error fetching question:", error);
    } finally {
      setIsQuestionFetching(false);
    }
  };

  const speakQuestion = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };
  const startSpeechRecognition = () => {
    if (recognition.started) {
      // If recognition is already started, don't start it again
      return;
    }
  
    recognition.start();
    recognition.started = true;  // Flag to track if recognition has started
  
    recognition.onresult = (event) => {
      const currentAnswer = event.results[event.results.length - 1][0].transcript;
      setUserAnswer(currentAnswer);
      console.log("Recognized Answer: ", currentAnswer);
  
      // Clear any previous silence timeout
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
        setSilenceTimeout(null);
      }
  
      // Evaluate the answer immediately
      evaluateAnswer(currentAnswer);
  
      // Reset silence timeout every time speech is detected
      const timeout = setTimeout(() => {
        console.log("User inactive for 5 seconds. Ending interview.");
        setInterviewCompleted(true);
        recognition.stop(); // Stop the microphone
        recognition.started = false; // Reset the flag
        navigate("/interview-over");
      }, 5000); // 5 seconds of silence after the user stops speaking
      setSilenceTimeout(timeout);
    };
  
    recognition.onerror = (event) => {
      console.error("Speech recognition error: ", event.error);
    };
  
    recognition.onend = () => {
      console.log("Speech recognition ended.");
      recognition.started = false;  // Reset the flag when recognition ends
    };
  };
  
  const evaluateAnswer = async (answer) => {
    try {
      // Stop the recognition after the answer is evaluated
      recognition.stop();
      recognition.started = false; // Reset the flag
  
      const response = await fetch("http://localhost:5000/evaluate_answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answer: answer }),
      });
  
      const data = await response.json();
      console.log("Evaluation result:", data);
  
      setQuestionCount((prevCount) => prevCount + 1);
      fetchQuestion();
    } catch (error) {
      console.error("Error evaluating answer:", error);
    }
  };
  
  // Ensure stop recognition if interview is completed
  useEffect(() => {
    if (interviewCompleted) {
      recognition.stop(); // Stop recognition when the interview is done
      recognition.started = false;
    }
  }, [interviewCompleted]);
  
    

  return (
    <div className="interview-fullscreen">
      {showTwoUsers ? (
        <div className="two-user-view">
          <div className="user-video user-left">
            <img
              src="https://www.profilebakery.com/wp-content/uploads/2024/05/Profile-picture-created-with-ai.jpeg"
              alt="Bot"
              className="bot-image"
            />
          </div>
          <div className="user-video user-right">
            <video
              ref={videoRefRight}
              autoPlay
              playsInline
              muted
              className="video-element"
            ></video>
          </div>
        </div>
      ) : (
        <div className="video-fullscreen">
          <div className="icon-left" onClick={toggleMicrophone}>
            <FaMicrophone size={30} color={isMicOn ? "green" : "red"} />
          </div>
          <div className="video-content">
            <video
              ref={videoRefRight}
              autoPlay
              playsInline
              muted
              className="video-element"
            ></video>
          </div>
          <div className="icon-right" onClick={toggleCamera}>
            <FaCamera size={30} color={isCameraOn ? "green" : "red"} />
          </div>
        </div>
      )}
      {!showTwoUsers && !interviewCompleted && (
        <div className="button-container">
          <button className="start-button" onClick={startTwoUserView}>
            Start Interview
          </button>
        </div>
      )}
      {!showTwoUsers && !interviewCompleted && (
        <div className="welcome-message">
          Welcome to the interview! Click "Start Interview" to begin.
        </div>
      )}
      {question && !interviewCompleted && (
        <div className="flex justify-between items-center w-full p-4">
          <p className="text-lg text-gray-800">Question: {question}</p>
          <button 
            className="flex items-center bg-blue-500 text-white py-2 px-6 rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
            onClick={startSpeechRecognition} 
            aria-label="Speak your answer"
          >
            <i className="fa fa-microphone mr-2"></i> Speak Your Answer
          </button>
        </div>
      )}
      {userAnswer && !interviewCompleted && (
        <div className="answer-display">
          You said: {userAnswer}
        </div>
      )}
      {interviewCompleted && (
        <div className="thank-you-message">
          Thank you, your interview is over!
        </div>
      )}
    </div>
  );
}

export default InterviewModule;
