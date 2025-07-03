import React, { useState } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  IconButton,
  Button,
  Stack,
  Toolbar,
  AppBar,
} from '@mui/material';
import PreviewIcon from '@mui/icons-material/Preview'; // Icon for resume view
import SendIcon from '@mui/icons-material/Send'; // Icon for sending test link
import AppBarComponent from '../../Components/AppBar';
import Sidebar from '../../Components/SideBar';
import axios from 'axios';

const EmailModule = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // Sample data for the emails
  const emailData = [
    { id: 1, email: 'user1@example.com', sentOn: '2024-10-01', resumeScore: 85, resumeLink: '/path-to-resume1.pdf' },
    { id: 2, email: 'user2@example.com', sentOn: '2024-10-02', resumeScore: 78, resumeLink: '/path-to-resume2.pdf' },
    { id: 3, email: 'user3@example.com', sentOn: '2024-10-05', resumeScore: 92, resumeLink: '/path-to-resume3.pdf' },
    { id: 4, email: 'user4@example.com', sentOn: '2024-10-08', resumeScore: 88, resumeLink: '/path-to-resume4.pdf' },
    { id: 5, email: 'user5@example.com', sentOn: '2024-10-09', resumeScore: 64, resumeLink: '/path-to-resume5.pdf' }, // Below threshold
  ];

  // Function to view the resume
  const handleViewResume = (resumeLink) => {
    window.open(resumeLink, '_blank'); // Open the resume in a new tab
  };

  // Function to send individual test link
  const handleSendTestLink = async (email) => {
    // try {
    //   const response = await axios.post('http://127.0.0.1:5000/send-email', {
    //     recipientEmail: email, // Send the email in the request body
    //   });
    //   console.log(response.data);
    //   alert(`Test link sent to ${email}`);
    // } catch (error) {
    //   console.error('Error sending test link:', error);
    //   alert(`Failed to send test link to ${email}`);
    // }
  };
  

  // Function to send test link to all users with a score above 65
  const handleSendAllTestLinks = () => {
    const eligibleUsers = emailData.filter((row) => row.resumeScore > 65);
    eligibleUsers.forEach((user) => {
      console.log(`Sending test link to: ${user.email}`);
      // Add API logic to send the link here
    });
  };

  return (
    <>
      <Box sx={{ display: 'flex' }}>
        <AppBarComponent handleDrawerToggle={handleDrawerToggle} />
        <Sidebar open={mobileOpen} handleDrawerToggle={handleDrawerToggle} />
        <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
          <Typography variant="h4" sx={{ mb: 3 }}>
            Email Sent on Resume Score
          </Typography>

          {/* Send to All Button */}
          <Stack direction="row" justifyContent="flex-end" sx={{ mb: 3 }}>
            <Button
              variant="contained"
              color="success"
              startIcon={<SendIcon />}
              onClick={handleSendAllTestLinks}
            >
              Send Test Link to All Above 65
            </Button>
          </Stack>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell align="right">Sent On</TableCell>
                  <TableCell align="right">Resume Score</TableCell>
                  <TableCell align="center">View Resume</TableCell>
                  <TableCell align="center">Send Test Link</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {emailData.map((row) => (
                  <TableRow
                    key={row.id}
                    sx={{
                      backgroundColor: row.resumeScore > 65 ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)', // Light green for > 65, light red for < 65
                    }}
                  >
                    <TableCell component="th" scope="row">
                      {row.email}
                    </TableCell>
                    <TableCell align="right">{row.sentOn}</TableCell>
                    <TableCell align="right">{row.resumeScore}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleViewResume(row.resumeLink)}
                        color="primary"
                        aria-label="view resume"
                      >
                        <PreviewIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">
                      {row.resumeScore > 65 ? (
                        <IconButton
                          onClick={() => handleSendTestLink(row.email)}
                          color="success"
                          aria-label="send test link"
                        >
                          <SendIcon />
                        </IconButton>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Not Eligible
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </>
  );
};

export default EmailModule;
