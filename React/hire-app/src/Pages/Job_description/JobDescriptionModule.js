// import React, { useState } from 'react';
// import { Box, TextField, Button, Typography } from '@mui/material';
// import AppBarComponent from '../../Components/AppBar';
// import Sidebar from '../../Components/SideBar';
// import { useNavigate } from 'react-router-dom';

// const JobDescriptionModule = () => {
//   const navigate = useNavigate();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [description, setDescription] = useState('');
//   const [error, setError] = useState('');
//   const [submitted, setSubmitted] = useState(false);

//   const handleDrawerToggle = () => {
//     setMobileOpen(!mobileOpen);
//   };

//   const handleChange = (e) => {
//     setDescription(e.target.value);
//     if (e.target.value.length >= 120) {
//       setError('');
//     }
//   };

// const handleSubmit = async () => {
//   if (description.length < 120) {
//     setError('Description must be at least 120 characters.');
//   } else {
//     setError('');
//     setSubmitted(true);

//     const data = { job_description: description };

//     try {
//       const response = await fetch('http://localhost:5000/job_description', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data),
//       });

//       if (response.ok) {
//         const result = await response.json();
//         console.log('Similarity Scores:', result);

//         // Navigate to the ResumeCollectorModule after successful submission
//         navigate('/resume-collector'); // Make sure this matches the route in MainRoutes.js
//       } else {
//         console.error('Error submitting job description:', response.statusText);
//       }
//     } catch (error) {
//       console.error('Network error:', error);
//     }
//   }
// };


//   return (
//     <>
//       <Box sx={{ display: 'flex' }}>
//         <AppBarComponent handleDrawerToggle={handleDrawerToggle} />
//         <Sidebar open={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
//         <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
//           <Typography variant="h4" sx={{ mb: 3 }}>
//             Insert Job Description
//           </Typography>
          
//           {submitted ? (
//             <Typography variant="h6" color="green">
//               Job description submitted successfully!
//             </Typography>
//           ) : (
//             <>
//               <TextField
//                 fullWidth
//                 label="Job Description"
//                 multiline
//                 rows={6}
//                 variant="outlined"
//                 value={description}
//                 onChange={handleChange}
//                 error={!!error}
//                 helperText={error || 'Please enter a detailed job description (minimum 120 characters).'}
//               />
//               <Button
//                 variant="contained"
//                 color="primary"
//                 sx={{ mt: 2 }}
//                 onClick={handleSubmit}
//               >
//                 Submit
//               </Button>
//             </>
//           )}
//         </Box>
//       </Box>
//     </>
//   );
// };

// export default JobDescriptionModule;



// import React, { useState } from 'react';
// import { Box, TextField, Button, Typography, MenuItem } from '@mui/material';
// import AppBarComponent from '../../Components/AppBar';
// import Sidebar from '../../Components/SideBar';
// import { useNavigate } from 'react-router-dom';

// const JobDescriptionModule = () => {
//   const navigate = useNavigate();
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const [description, setDescription] = useState('');
//   const [error, setError] = useState('');
//   const [submitted, setSubmitted] = useState(false);
  
//   // This is an example of what other fields you could take
//   const [jobTitle, setJobTitle] = useState('');
//   const [jobCategory, setJobCategory] = useState('');
  
//   const handleDrawerToggle = () => {
//     setMobileOpen(!mobileOpen);
//   };

//   const handleChange = (e) => {
//     setDescription(e.target.value);
//     if (e.target.value.length >= 120) {
//       setError('');
//     }
//   };

//   const handleSubmit = async () => {
//     if (description.length < 120) {
//       setError('Description must be at least 120 characters.');
//     } else {
//       setError('');
//       setSubmitted(true);

//       const data = { 
//         job_description: description,
//         job_title: jobTitle,
//         job_category: jobCategory 
//       };

//       try {
//         const response = await fetch('http://localhost:5000/job_description', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           body: JSON.stringify(data),
//         });

//         if (response.ok) {
//           const result = await response.json();
//           console.log('Similarity Scores:', result);

//           // Navigate to the ResumeCollectorModule after successful submission
//           navigate('/resume-collector'); // Make sure this matches the route in MainRoutes.js
//         } else {
//           console.error('Error submitting job description:', response.statusText);
//         }
//       } catch (error) {
//         console.error('Network error:', error);
//       }
//     }
//   };

//   return (
//     <>
//       <Box sx={{ display: 'flex' }}>
//         <AppBarComponent handleDrawerToggle={handleDrawerToggle} />
//         <Sidebar open={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
//         <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
//           <Typography variant="h4" sx={{ mb: 3 }}>
//             Insert Job Description
//           </Typography>
          
//           {submitted ? (
//             <Typography variant="h6" color="green">
//               Job description submitted successfully!
//             </Typography>
//           ) : (
//             <>
//               <TextField
//                 fullWidth
//                 label="Job Title"
//                 variant="outlined"
//                 value={jobTitle}
//                 onChange={(e) => setJobTitle(e.target.value)}
//                 sx={{ mb: 2 }}
//               />
              
//               <TextField
//                 fullWidth
//                 label="Job Category"
//                 select
//                 value={jobCategory}
//                 onChange={(e) => setJobCategory(e.target.value)}
//                 variant="outlined"
//                 sx={{ mb: 2 }}
//               >
//                 <MenuItem value="Engineering">Engineering</MenuItem>
//                 <MenuItem value="Marketing">Marketing</MenuItem>
//                 <MenuItem value="Sales">Sales</MenuItem>
//                 <MenuItem value="HR">HR</MenuItem>
//                 <MenuItem value="Finance">Finance</MenuItem>
//               </TextField>

//               <TextField
//                 fullWidth
//                 label="Job Description"
//                 multiline
//                 rows={6}
//                 variant="outlined"
//                 value={description}
//                 onChange={handleChange}
//                 error={!!error}
//                 helperText={error || 'Please enter a detailed job description (minimum 120 characters).'}
//                 sx={{ mb: 2 }}
//               />
//               <Button
//                 variant="contained"
//                 color="primary"
//                 sx={{ mt: 2 }}
//                 onClick={handleSubmit}
//               >
//                 Submit
//               </Button>
//             </>
//           )}
//         </Box>
//       </Box>
//     </>
//   );
// };



import React, { useState } from 'react';
import { Box, TextField, Button, Typography, MenuItem } from '@mui/material';
import AppBarComponent from '../../Components/AppBar';
import Sidebar from '../../Components/SideBar';
import { useNavigate } from 'react-router-dom';

const JobDescriptionModule = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  
  // State for additional inputs
  const [jobTitle, setJobTitle] = useState('');
  const [jobCategory, setJobCategory] = useState('');
  const [jobLocation, setJobLocation] = useState('');
  const [jobType, setJobType] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleChange = (e) => {
    setDescription(e.target.value);
    if (e.target.value.length >= 120) {
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (description.length < 120) {
      setError('Description must be at least 120 characters.');
    } else {
      setError('');
      setSubmitted(true);

      const data = { 
        job_description: description,
        job_title: jobTitle,
        job_category: jobCategory,
        job_location: jobLocation,
        job_type: jobType,
        salary_range: salaryRange 
      };

      try {
        const response = await fetch('http://localhost:5000/job_description', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Similarity Scores:', result);

          // Navigate to the ResumeCollectorModule after successful submission
          navigate('/resume-collector'); // Make sure this matches the route in MainRoutes.js
        } else {
          console.error('Error submitting job description:', response.statusText);
        }
      } catch (error) {
        console.error('Network error:', error);
      }
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <AppBarComponent handleDrawerToggle={handleDrawerToggle} />
        <Sidebar open={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Insert Job Description
          </Typography>
          
          {submitted ? (
            <Typography variant="h6" color="green">
              Job description submitted successfully!
            </Typography>
          ) : (
            <>
              <TextField
                fullWidth
                label="Job Title"
                variant="outlined"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Job Category"
                select
                value={jobCategory}
                onChange={(e) => setJobCategory(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              >
                <MenuItem value="Engineering">Engineering</MenuItem>
                <MenuItem value="Marketing">Marketing</MenuItem>
                <MenuItem value="Sales">Sales</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
                <MenuItem value="Finance">Finance</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Job Location"
                variant="outlined"
                value={jobLocation}
                onChange={(e) => setJobLocation(e.target.value)}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Job Type"
                select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                variant="outlined"
                sx={{ mb: 2 }}
              >
                <MenuItem value="Full-time">Full-time</MenuItem>
                <MenuItem value="Part-time">Part-time</MenuItem>
                <MenuItem value="Contract">Contract</MenuItem>
                <MenuItem value="Internship">Internship</MenuItem>
              </TextField>

              <TextField
                fullWidth
                label="Salary Range"
                variant="outlined"
                value={salaryRange}
                onChange={(e) => setSalaryRange(e.target.value)}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Job Description"
                multiline
                rows={6}
                variant="outlined"
                value={description}
                onChange={handleChange}
                error={!!error}
                helperText={error || 'Please enter a detailed job description (minimum 120 characters).'}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                sx={{
                  mt: 2,
                  backgroundColor: '#667eec',
                  '&:hover': {
                    backgroundColor: '#556adf', // Adjust the hover color if needed
                  },
                }}
                onClick={handleSubmit}
              >
                Submit
              </Button>
            </>
          )}
        </Box>
      </Box>
    </>
  );
};

export default JobDescriptionModule;
