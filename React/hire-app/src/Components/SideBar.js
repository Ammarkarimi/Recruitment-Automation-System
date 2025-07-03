// import React from 'react';
// import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
// import { useNavigate } from 'react-router-dom';
// import DescriptionIcon from '@mui/icons-material/Description';
// import ArticleIcon from '@mui/icons-material/Article';
// import EmailIcon from '@mui/icons-material/Email';
// import AssessmentIcon from '@mui/icons-material/Assessment';

// const drawerWidth = 240;

// const Sidebar = ({ open, handleDrawerToggle }) => {
//   const navigate = useNavigate();

//   const handleNavigation = (path) => {
//     navigate(path);
//     handleDrawerToggle(); // Close the drawer after navigation
//   };

//   return (
//     <Drawer
//       variant="temporary"
//       open={open}
//       onClose={handleDrawerToggle}
//       sx={{
//         width: drawerWidth,
//         '& .MuiDrawer-paper': {
//           width: drawerWidth,
//         },
//       }}
//     >
//       <List sx={{ mt: 10 }}>
//         <ListItem button onClick={() => handleNavigation("/job_description")}>
//           <ListItemIcon>
//             <DescriptionIcon />
//           </ListItemIcon>
//           <ListItemText primary="Job Description" />
//         </ListItem>
//         <ListItem button onClick={() => handleNavigation('/resume')}>
//           <ListItemIcon>
//             <ArticleIcon />
//           </ListItemIcon>
//           <ListItemText primary="Resume" />
//         </ListItem>
//         <ListItem button onClick={() => handleNavigation('/email')}>
//           <ListItemIcon>
//             <EmailIcon />
//           </ListItemIcon>
//           <ListItemText primary="Email" />
//         </ListItem>
//         <ListItem button onClick={() => handleNavigation('/results')}>
//           <ListItemIcon>
//             <AssessmentIcon />
//           </ListItemIcon>
//           <ListItemText primary="Results" />
//         </ListItem>
//       </List>
//     </Drawer>
//   );
// };

// export default Sidebar;




import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DescriptionIcon from '@mui/icons-material/Description';
import ArticleIcon from '@mui/icons-material/Article';
import EmailIcon from '@mui/icons-material/Email';
import AssessmentIcon from '@mui/icons-material/Assessment';

const drawerWidth = 240;

const Sidebar = ({ open, handleDrawerToggle }) => {
  const navigate = useNavigate();

  const handleNavigation = (path) => {
    navigate(path);
    handleDrawerToggle(); // Close the drawer after navigation
  };

  return (
    <Drawer
      variant="temporary"
      open={open}
      onClose={handleDrawerToggle}
      sx={{
        width: drawerWidth,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
        },
      }}
    >
      <List sx={{ mt: 10 }}>
      <ListItem button onClick={() => handleNavigation('/resume')}>
          <ListItemIcon>
            <ArticleIcon />
          </ListItemIcon>
          <ListItemText primary="Home" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation("/job_description")}>
          <ListItemIcon>
            <DescriptionIcon />
          </ListItemIcon>
          <ListItemText primary="Job Description" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/resume-collector')}>
          <ListItemIcon>
            <AssessmentIcon />
          </ListItemIcon>
          <ListItemText primary="Results" />
        </ListItem>
        <ListItem button onClick={() => handleNavigation('/contact')}>
          <ListItemIcon>
            <EmailIcon />
          </ListItemIcon>
          <ListItemText primary="contact" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar;
