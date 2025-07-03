// import React, { useState } from 'react';
// import { Box, Button, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
// import AppBarComponent from '../../Components/AppBar';
// import Sidebar from '../../Components/SideBar';

// const ResumeCollectorModule = () => {
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [resumeFiles, setResumeFiles] = useState([]);
//   const [similarityData, setSimilarityData] = useState([]);
//   const [topResumesCount, setTopResumesCount] = useState(0); // State for top resumes count

//   const handleDrawerToggle = () => {
//     setMobileOpen(!mobileOpen);
//   };

//   const handleFileChange = (event) => {
//     setResumeFiles(event.target.files);
//   };

//   const handleSubmit = async () => {
//     if (resumeFiles.length > 0) {
//       const formData = new FormData();
//       for (let i = 0; i < resumeFiles.length; i++) {
//         formData.append('resumes', resumeFiles[i]);
//       }

//       try {
//         const uploadResponse = await fetch('http://127.0.0.1:5000/upload_resumes', {
//           method: 'POST',
//           body: formData,
//         });

//         if (!uploadResponse.ok) {
//           throw new Error('Failed to upload resumes');
//         }

//         const similarityResponse = await fetch('http://127.0.0.1:5000/check_similarity', {
//           method: 'GET',
//         });

//         if (!similarityResponse.ok) {
//           throw new Error('Failed to check similarity');
//         }

//         const similarityData = await similarityResponse.json();
//         setSimilarityData(similarityData);
//       } catch (error) {
//         console.error('Error:', error);
//         alert(error.message);
//       }
//     } else {
//       alert('Please upload at least one resume file.');
//     }
//   };

//   return (
//     <>
//       <Box sx={{ display: 'flex' }}>
//         <AppBarComponent handleDrawerToggle={handleDrawerToggle} />
//         <Sidebar open={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
//         <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
//           <Typography variant="h4" sx={{ mb: 3 }}>
//             Submit Your Resumes
//           </Typography>
//           <TextField
//             fullWidth
//             type="file"
//             inputProps={{ multiple: true }}
//             onChange={handleFileChange}
//             sx={{ mb: 2 }}
//           />
//           <Button
//             variant="contained"
//             color="primary"
//             onClick={handleSubmit}
//             sx={{ mb: 3 }}
//           >
//             Submit Resumes
//           </Button>

//           {/* Conditionally render the input for top resumes and the table */}
//           {similarityData.length > 0 && (
//             <>
//               <TextField
//                 fullWidth
//                 label="Number of Top Resumes to Highlight"
//                 type="number"
//                 value={topResumesCount}
//                 onChange={(e) => setTopResumesCount(parseInt(e.target.value) || 0)}
//                 sx={{ mb: 3 }}
//               />  

//               <TableContainer component={Paper}>
//                 <Table>
//                   <TableHead>
//                     <TableRow>
//                       <TableCell>Resume</TableCell>
//                       <TableCell>Similarity Score</TableCell>
//                       <TableCell>Email</TableCell>
//                       <TableCell>View Resume</TableCell>
//                     </TableRow>
//                   </TableHead>
//                   <TableBody>
//                     {similarityData
//                       .sort((a, b) => b.similarity_score - a.similarity_score)
//                       .map((data, index) => (
//                         <TableRow
//                           key={index}
//                           sx={{
//                             backgroundColor: index < topResumesCount ? '#d4edda' : '#f8d7da',
//                             color: 'white',
//                           }}
//                         >
//                           <TableCell>{data.resume}</TableCell>
//                           <TableCell>{data.similarity_score.toFixed(2)}</TableCell>
//                           <TableCell>{data.email}</TableCell>
//                           <TableCell>
//                             <Button
//                               variant="contained"
//                               color="primary"
//                               onClick={() => window.open(`http://127.0.0.1:5000/view_resume?file=${data.resume}`, '_blank')}
//                             >
//                               View
//                             </Button>
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                   </TableBody>
//                 </Table>
//               </TableContainer>
//             </>
//           )}
//         </Box>
//       </Box>
//     </>
//   );
// };

// export default ResumeCollectorModule;





// import React, { useState } from 'react';
// import { Box, Button, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
// import AppBarComponent from '../../Components/AppBar';
// import Sidebar from '../../Components/SideBar';

// const ResumeCollectorModule = () => {
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [resumeFiles, setResumeFiles] = useState([]);
//   const [similarityData, setSimilarityData] = useState([]);
//   const [topResumesCount, setTopResumesCount] = useState(0); // State for top resumes count

//   const handleDrawerToggle = () => {
//     setMobileOpen(!mobileOpen);
//   };

//   const handleFileChange = (event) => {
//     setResumeFiles(event.target.files);
//   };

//   const handleSubmit = async () => {
//     if (resumeFiles.length > 0) {
//       const formData = new FormData();
//       for (let i = 0; i < resumeFiles.length; i++) {
//         formData.append('resumes', resumeFiles[i]);
//       }

//       try {
//         const uploadResponse = await fetch('http://127.0.0.1:5000/upload_resumes', {
//           method: 'POST',
//           body: formData,
//         });

//         if (!uploadResponse.ok) {
//           throw new Error('Failed to upload resumes');
//         }

//         const similarityResponse = await fetch('http://127.0.0.1:5000/check_similarity', {
//           method: 'GET',
//         });

//         if (!similarityResponse.ok) {
//           throw new Error('Failed to check similarity');
//         }

//         const similarityData = await similarityResponse.json();
//         setSimilarityData(similarityData);
//       } catch (error) {
//         console.error('Error:', error);
//         alert(error.message);
//       }
//     } else {
//       alert('Please upload at least one resume file.');
//     }
//   };

//   const handleSend = (email) => {
//     // Implement your "Send" logic here, for example, sending an email.
//     alert(`Sending email to ${email}`);
//     // You can replace this with an actual API call to send the email.
//   };

//   return (
//     <>
//       <Box sx={{ display: 'flex' }}>
//         <AppBarComponent handleDrawerToggle={handleDrawerToggle} />
//         <Sidebar open={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
//         <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
//           <Typography variant="h4" sx={{ mb: 3 }}>
//             Submit Your Resumes
//           </Typography>
//           <TextField
//             fullWidth
//             type="file"
//             inputProps={{ multiple: true }}
//             onChange={handleFileChange}
//             sx={{ mb: 2 }}
//           />
//           <Button
//             variant="contained"
//             color="primary"
//             onClick={handleSubmit}
//             sx={{ mb: 3 }}
//           >
//             Submit Resumes
//           </Button>

//           {/* Conditionally render the input for top resumes and the table */}
//           {similarityData.length > 0 && (
//             <>
//               <TextField
//                 fullWidth
//                 label="Number of Top Resumes to Highlight"
//                 type="number"
//                 value={topResumesCount}
//                 onChange={(e) => setTopResumesCount(parseInt(e.target.value) || 0)}
//                 sx={{ mb: 3 }}
//               />  

//               <TableContainer component={Paper}>
//                 <Table>
//                   <TableHead>
//                     <TableRow>
//                       <TableCell>Resume</TableCell>
//                       <TableCell>Similarity Score</TableCell>
//                       <TableCell>Email</TableCell>
//                       <TableCell>View Resume</TableCell>
//                       <TableCell>Send Email</TableCell> {/* New Send column */}
//                     </TableRow>
//                   </TableHead>
//                   <TableBody>
//                     {similarityData
//                       .sort((a, b) => b.similarity_score - a.similarity_score)
//                       .map((data, index) => (
//                         <TableRow
//                           key={index}
//                           sx={{
//                             backgroundColor: index < topResumesCount ? '#d4edda' : '#f8d7da',
//                             color: 'white',
//                           }}
//                         >
//                           <TableCell>{data.resume}</TableCell>
//                           <TableCell>{data.similarity_score.toFixed(2)}</TableCell>
//                           <TableCell>{data.email}</TableCell>
//                           <TableCell>
//                             <Button
//                               variant="contained"
//                               color="primary"
//                               onClick={() => window.open(`http://127.0.0.1:5000/view_resume?file=${data.resume}`, '_blank')}
//                             >
//                               View
//                             </Button>
//                           </TableCell>
//                           <TableCell>
//                             <Button
//                               variant="contained"
//                               color="secondary"
//                               onClick={() => handleSend(data.email)} // Trigger the send action
//                             >
//                               Send
//                             </Button>
//                           </TableCell>
//                         </TableRow>
//                       ))}
//                   </TableBody>
//                 </Table>
//               </TableContainer>
//             </>
//           )}
//         </Box>
//       </Box>
//     </>
//   );
// };

// export default ResumeCollectorModule;




import React, { useState } from 'react';
import { Box, Button, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import AppBarComponent from '../../Components/AppBar';
import Sidebar from '../../Components/SideBar';

const ResumeCollectorModule = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [resumeFiles, setResumeFiles] = useState([]);
  const [similarityData, setSimilarityData] = useState([]);
  const [topResumesCount, setTopResumesCount] = useState(0);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleFileChange = (event) => {
    setResumeFiles(event.target.files);
  };

  const handleSubmit = async () => {
    if (resumeFiles.length > 0) {
      const formData = new FormData();
      for (let i = 0; i < resumeFiles.length; i++) {
        formData.append('resumes', resumeFiles[i]);
      }

      try {
        const uploadResponse = await fetch('http://127.0.0.1:5000/upload_resumes', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload resumes');
        }

        const similarityResponse = await fetch('http://127.0.0.1:5000/check_similarity', {
          method: 'GET',
        });

        if (!similarityResponse.ok) {
          throw new Error('Failed to check similarity');
        }

        const similarityData = await similarityResponse.json();
        setSimilarityData(similarityData);
      } catch (error) {
        console.error('Error:', error);
        alert(error.message);
      }
    } else {
      alert('Please upload at least one resume file.');
    }
  };

  const handleSend = async (email) => {
    try {
      // Ensure email is passed and valid
      if (!email) {
        console.error("Email address is required");
        return;
      }
  
      // First, store the email
      const storeResponse = await fetch('http://127.0.0.1:5000/store_email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
  
      if (!storeResponse.ok) {
        throw new Error('Failed to store email');
      }
  
      alert(`Email sent to ${email} and stored successfully.`);
  
      // Prepare the data for the second API call
      const data = {
        recipientEmail: email,
      };
  
      // Send the email
      const sendResponse = await fetch('http://127.0.0.1:5000/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
  
      const sendData = await sendResponse.json(); // Parse the response
  
      if (sendResponse.ok && sendData.message) {
        console.log("Email sent successfully:", sendData.message);
      } else {
        console.error("Error sending email:", sendData.error || 'Unknown error');
      }
    } catch (error) {
      console.error("Error:", error);
      alert('Failed to send email.');
    }
  };
  
  

  const handleSendAll = () => {
    const topResumes = similarityData
      .sort((a, b) => b.similarity_score - a.similarity_score)
      .slice(0, topResumesCount);

    if (topResumes.length > 0) {
      const emails = topResumes.map((data) => data.email);
      alert(`Sending emails to: ${emails.join(', ')}`);
      // Replace this with API logic to send emails
    } else {
      alert('No resumes to send emails to!');
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <AppBarComponent handleDrawerToggle={handleDrawerToggle} />
        <Sidebar open={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Submit Your Resumes
          </Typography>
          <TextField
            fullWidth
            type="file"
            inputProps={{ multiple: true }}
            onChange={handleFileChange}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            sx={{
              mb: 3,
              backgroundColor: '#667eec',
              '&:hover': {
                backgroundColor: '#556adf', // Optional: A slightly darker shade for hover effect
              },
            }}
          >
            Submit Resumes
          </Button>

          {similarityData.length > 0 && (
            <>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  mb: 3,
                }}
              >
              <TextField
                fullWidth
                label="Number of Top Resumes to Highlight"
                type="number"
                value={topResumesCount}
                onChange={(e) => {
                  const count = parseInt(e.target.value, 10);

                  // Update the value in the field immediately
                  setTopResumesCount(count);
                  
                  // Show alert only if the count exceeds available resumes
                  if (count > similarityData.length) {
                    alert(
                      `You entered ${count}, but there are only ${similarityData.length} resumes available.`
                    );
                  }
                }}
              />
                <Button
                  variant="contained"
                  onClick={handleSendAll}
                  sx={{ ml: 2,p:1.7, whiteSpace: 'nowrap',
                    backgroundColor: '#4A90E2', // Set button color to #4A90E2
                '&:hover': {
                  backgroundColor: '#357ABD', // Slightly darker shade for hover effect
                }   
                }}
                >
                  Send All
                </Button>
              </Box>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Resume</TableCell>
                      <TableCell>Similarity Score</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>View Resume</TableCell>
                      <TableCell>Send Email</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {similarityData
                      .sort((a, b) => b.similarity_score - a.similarity_score)
                      .map((data, index) => (
                        <TableRow
                          key={index}
                          sx={{
                            backgroundColor:
                              index < topResumesCount
                                ? '#d4edda'
                                : '#f8d7da',
                          }}
                        >
                          <TableCell>{data.resume}</TableCell>
                          <TableCell>
                            {data.similarity_score.toFixed(2)}
                          </TableCell>
                          <TableCell>{data.email}</TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              sx={{
                                backgroundColor: '#667eec',
                                '&:hover': {
                                  backgroundColor: '#556adf', // Optional: Slightly darker color on hover
                                },
                              }}
                              onClick={() =>
                                window.open(
                                  `http://127.0.0.1:5000/view_resume?file=${data.resume}`,
                                  '_blank'
                                )
                              
                              }
                            >
                              View
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              sx={{
                                backgroundColor: '#4A90E2', // Set button color to #4A90E2
                                '&:hover': {
                                  backgroundColor: '#357ABD', // Slightly darker color for hover effect
                                },
                              }}
                              onClick={() => handleSend(data.email)}
                            >
                              Send
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </Box>
      </Box>
    </>
  );
};

export default ResumeCollectorModule;
