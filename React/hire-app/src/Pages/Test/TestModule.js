// import React, { useEffect, useState } from 'react';
// import './TestModule.css';
// import { useNavigate } from "react-router-dom";

// function TestModule() {
//   const [mcqs, setMcqs] = useState([]);
//   const [selectedAnswers, setSelectedAnswers] = useState({});
//   const [score, setScore] = useState(null);
//   const [started, setStarted] = useState(false); // Tracks if the test has started

//   useEffect(() => {
//     fetch('http://127.0.0.1:5000/generate_mcqs')
//       .then((response) => response.json())
//       .then((data) => {
//         const mcqsString = data.mcqs.replace(/```json\n|\n```/g, '');
//         const parsedMcqs = JSON.parse(mcqsString);
//         setMcqs(parsedMcqs || []);
//       })
//       .catch((error) => console.error('Error fetching MCQs:', error));
//   }, []);

//   const handleSelectAnswer = (questionIndex, selectedOption) => {
//     setSelectedAnswers((prevAnswers) => ({
//       ...prevAnswers,
//       [questionIndex]: selectedOption,
//     }));
//   };

//   const handleSubmit = () => {
//     let totalScore = 0;
//     mcqs.forEach((mcq, index) => {
//       if (selectedAnswers[index] === mcq.answer) {
//         totalScore += 1;
//       }
//     });
//     setScore(totalScore);
//   };

//   const handleStart = () => {
//     setStarted(true); // Mark the test as started
//   };
//   const navigate = useNavigate();
//   const handleInterviewClick = () => {
//     navigate("/interview");
//   };


  
//   return (
//     <div className="test-module">
//       <header className="navbar">
//         <h1>Hire App</h1>
//       </header>
//       <div className="test-container">
//         {!started ? (
//           <div className="instructions">
//           <h2>Instructions</h2>
//           <p>Welcome to the test! Please read the instructions carefully before you begin:</p>
//           <ul>
//             <li>1. Answer all the questions to the best of your ability.</li>
//             <li>2. Take your time to understand each question before answering. You may not be able to modify your answer once submitted.</li>
//             <li>3. After completing the questions, click the <strong>Submit</strong> button to finalize your responses and see your score.</li>
//             <li>4. If you are selected based on your performance, you will be shown an <strong>Interview</strong> button.</li>
//             <li>5. Click the <strong>Interview</strong> button to proceed to the next phase, where you will answer more questions and participate in an interview.</li>
//             <li>6. Your answers will be compared against model answers, and similarity scores will be calculated for open-ended questions.</li>
//             <li>7. After submission, you will receive feedback and a summary of your performance.</li>
//           </ul>
//           <button className="start-btn" onClick={handleStart}>
//             Start Test
//           </button>
//         </div>
        
//         ) : (
//           <div className="questions">
//             {mcqs.length > 0 ? (
//               <>
//                 {mcqs.map((mcq, index) => (
//                   <div key={index} className="question">
//                     <h3>{mcq.question}</h3>
//                     <ul className="options">
//                       {Object.entries(mcq.options).map(([key, value]) => (
//                         <li key={key}>
//                           <label>
//                             <input
//                               type="radio"
//                               name={`question-${index}`}
//                               value={key}
//                               onChange={() => handleSelectAnswer(index, key)}
//                               checked={selectedAnswers[index] === key}
//                             />
//                             {key}: {value}
//                           </label>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 ))}
//                 <button className="submit-btn" onClick={handleSubmit}>
//                   Submit
//                 </button>
//               </>
//             ) : (
//               <p>Loading questions...</p>
//             )}
//             {score !== null && (
//               <div className="score">
//                 <h2>Your Score: {score}/{mcqs.length}</h2>
//                 {score > 3 && (
//                   <button
//                     className="interview-btn"
//                     onClick={handleInterviewClick}
//                   >
//                     Proceed to Interview
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default TestModule;



import React, { useEffect, useState } from 'react';
import './TestModule.css';
import { useNavigate } from "react-router-dom";

const EmailVerification = ({ onVerify }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('http://127.0.0.1:5000/verify_email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (data.valid) {
        onVerify(true);
      } else {
        setError('Email not found. Please check and try again.');
      }
    } catch (error) {
      setError('An error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-center mb-4">Email Verification</h2>
      <p className="text-lg text-center mb-4">
        Please enter your email to start the test:
      </p>
      <div className="mb-6">
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          required
        />
      </div>
      <div className="flex justify-center">
        <button
          onClick={handleVerify}
          className={`w-full px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={loading}
        >
          {loading ? 'Verifying...' : 'Verify Email'}
        </button>
      </div>
      {error && <p className="mt-4 text-red-500 text-center">{error}</p>}
    </div>
  );
};

const Instructions = ({ onStart }) => (
  <div className="instructions">
    <h2>Instructions</h2>
    <p>Welcome to the test! Please read the instructions carefully before you begin:</p>
    <ul>
      <li>1. Answer all the questions to the best of your ability.</li>
      <li>2. Take your time to understand each question before answering.</li>
      <li>3. Click <strong>Submit</strong> to finalize your responses and see your score.</li>
      <li>4. Click <strong>Interview</strong> if selected based on your performance.</li>
    </ul>
    <button className="start-btn" onClick={onStart}>
      Start Test
    </button>
  </div>
);

const TestUI = ({ mcqs, selectedAnswers, onSelectAnswer, onSubmit, score, onProceedToInterview }) => (
  <div className="questions">
    {mcqs.length > 0 ? (
      <>
        {mcqs.map((mcq, index) => (
          <div key={index} className="question">
            <h3>{mcq.question}</h3>
            <ul className="options">
              {Object.entries(mcq.options).map(([key, value]) => (
                <li key={key}>
                  <label>
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={key}
                      onChange={() => onSelectAnswer(index, key)}
                      checked={selectedAnswers[index] === key}
                    />
                    {key}: {value}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <button className="submit-btn" onClick={onSubmit}>
          Submit
        </button>
      </>
    ) : (
      <p>Loading questions...</p>
    )}
    {score !== null && (
      <div className="score">
        <h2>Your Score: {score}/{mcqs.length}</h2>
        {score > 3 && (
          <button className="interview-btn" onClick={onProceedToInterview}>
            Proceed to Interview
          </button>
        )}
      </div>
    )}
  </div>
);

function TestModule() {
  const [mcqs, setMcqs] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [started, setStarted] = useState(false);
  const [verified, setVerified] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (verified) {
      fetch('http://127.0.0.1:5000/generate_mcqs')
        .then((response) => response.json())
        .then((data) => {
          const mcqsString = data.mcqs.replace(/```json\n|\n```/g, '');
          const parsedMcqs = JSON.parse(mcqsString);
          setMcqs(parsedMcqs || []);
        })
        .catch((error) => console.error('Error fetching MCQs:', error));
    }
  }, [verified]);

  const handleSelectAnswer = (questionIndex, selectedOption) => {
    setSelectedAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionIndex]: selectedOption,
    }));
  };

  const handleSubmit = () => {
    let totalScore = 0;
    mcqs.forEach((mcq, index) => {
      if (selectedAnswers[index] === mcq.answer) {
        totalScore += 1;
      }
    });
    setScore(totalScore);
  };

  const handleInterviewClick = () => {
    navigate("/interview");
  };

  const handleVerificationSuccess = () => {
    setVerified(true);
  };

  const handleStart = () => {
    setStarted(true);
  };

  return (
    <div className="test-module">
      <header className="navbar">
        <h1>Hire App</h1>
      </header>
      <div className="test-container">
        {!verified ? (
          <EmailVerification onVerify={handleVerificationSuccess} />
        ) : !started ? (
          <Instructions onStart={handleStart} />
        ) : (
          <TestUI
            mcqs={mcqs}
            selectedAnswers={selectedAnswers}
            onSelectAnswer={handleSelectAnswer}
            onSubmit={handleSubmit}
            score={score}
            onProceedToInterview={handleInterviewClick}
          />
        )}
      </div>
    </div>
  );
}

export default TestModule;
