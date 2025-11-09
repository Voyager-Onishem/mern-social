import { Box, Typography, useTheme, useMediaQuery, Accordion, AccordionSummary, AccordionDetails, Divider } from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Navbar from "scenes/navbar";
import WidgetWrapper from "components/WidgetWrapper";

const HelpPage = () => {
  const theme = useTheme();
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const { palette } = useTheme();

  const faqSections = [
    {
      category: "Getting Started",
      questions: [
        {
          q: "How do I create an account?",
          a: "Click on 'Register' on the login page, fill in your details (first name, last name, email, password, location, occupation), upload a profile picture, and click 'Register'."
        },
        {
          q: "How do I add friends?",
          a: "Visit a user's profile and click the 'Add Friend' button. They'll receive a friend request notification. Once accepted, you'll see each other's posts in your feeds."
        },
        {
          q: "What appears in my home feed?",
          a: "Your home feed shows posts from you and your friends, sorted by most recent first. You can refresh by pulling down on mobile or refreshing the page."
        }
      ]
    },
    {
      category: "Creating Posts",
      questions: [
        {
          q: "What can I include in a post?",
          a: "You can create posts with text, images, videos, audio files, GIFs (via Giphy), and location information. You can also add multiple media files to a single post."
        },
        {
          q: "What file types are supported?",
          a: "Images: JPG, PNG, GIF, WebP. Videos: MP4, WebM, OGG. Audio: MP3, WAV, OGG, WebM, MP4 audio. Maximum file size is 25MB per file."
        },
        {
          q: "How do I add a GIF to my post?",
          a: "Click the GIF icon when creating a post. Search for GIFs using the Giphy picker, select one, and it will be added to your post."
        },
        {
          q: "How do I add my location to a post?",
          a: "Click the location icon when creating a post. You can either allow browser location access for automatic detection or manually type in a location."
        },
        {
          q: "Can I edit or delete my posts?",
          a: "Yes! Click the three-dot menu on your own posts to edit or delete them. Note that editing preserves likes and comments."
        }
      ]
    },
    {
      category: "Interacting with Posts",
      questions: [
        {
          q: "How do I like a post?",
          a: "Click the heart icon on any post. Click again to unlike. You'll see an animated effect when liking."
        },
        {
          q: "How do I comment on a post?",
          a: "Click the comment icon to expand the comments section, type your comment, and press Enter or click 'Post'. You can also add GIFs to comments."
        },
        {
          q: "Can I share posts?",
          a: "Yes! Click the share icon on any post to copy the link or share via supported platforms. Note: Shared links work best when the app is publicly accessible."
        },
        {
          q: "How do I view media in posts?",
          a: "Click on any image in a post to open it in a lightbox viewer. For multiple images, use arrow keys or swipe to navigate. Videos play inline with controls."
        }
      ]
    },
    {
      category: "Notifications",
      questions: [
        {
          q: "What notifications will I receive?",
          a: "You'll get notifications for: new likes on your posts, new comments on your posts, friend requests, and accepted friend requests."
        },
        {
          q: "How do I view my notifications?",
          a: "Click the bell icon in the navbar. Unread notifications appear with a colored background. Click any notification to view the related content."
        },
        {
          q: "How do I mark notifications as read?",
          a: "Click on a notification to mark it as read, or click 'Mark All Read' to mark all notifications as read at once."
        }
      ]
    },
    {
      category: "Profile & Account",
      questions: [
        {
          q: "How do I update my profile?",
          a: "Click on your name in the top-right menu and select your profile. Click the edit icon (pencil) to update your information, profile picture, or social links."
        },
        {
          q: "What social links can I add?",
          a: "You can add links to your Twitter, LinkedIn, and personal website on your profile."
        },
        {
          q: "How do I view my profile views and impressions?",
          a: "Your profile widget shows total profile views and post impressions. These update in real-time as people view your content."
        },
        {
          q: "How do I log out?",
          a: "Click on your name in the top-right corner of the navbar, then select 'Log Out' from the dropdown menu."
        }
      ]
    },
    {
      category: "Search",
      questions: [
        {
          q: "How do I search for users or posts?",
          a: "Click the search icon in the navbar and type your query. Results include matching users and posts, displayed as you type."
        },
        {
          q: "Can I filter search results?",
          a: "Currently, search returns both users and posts. Click on a user to visit their profile or on a post to view it in your feed."
        }
      ]
    },
    {
      category: "Troubleshooting",
      questions: [
        {
          q: "Why aren't my images/videos loading?",
          a: "Check your internet connection. Images are stored in cloud storage (Cloudinary). If issues persist, try refreshing the page or clearing your browser cache."
        },
        {
          q: "I'm having login issues. What should I do?",
          a: "Ensure you're using the correct email and password. Passwords are case-sensitive. If you've forgotten your password, contact support for assistance."
        },
        {
          q: "Why can't I upload files?",
          a: "Check that your file is under 25MB and is a supported format (JPG, PNG, MP4, WebM, MP3, etc.). Also ensure you have a stable internet connection."
        },
        {
          q: "The app seems slow or unresponsive. What can I do?",
          a: "Try refreshing the page, clearing your browser cache, or using a different browser. We recommend using the latest version of Chrome, Firefox, Safari, or Edge."
        },
        {
          q: "Why aren't I receiving notifications?",
          a: "Ensure you're logged in and your connection is stable. Notifications use real-time updates via WebSocket. Check that your browser isn't blocking connections."
        }
      ]
    },
    {
      category: "Privacy & Safety",
      questions: [
        {
          q: "Who can see my posts?",
          a: "Your posts are visible to you and your friends. Only users who are your friends can see your posts in their feed."
        },
        {
          q: "Is my data secure?",
          a: "Yes. We use industry-standard encryption for data transmission. Passwords are hashed and never stored in plain text. Media files are stored securely in cloud storage."
        },
        {
          q: "Can I block or report users?",
          a: "User blocking and reporting features are planned for future updates. Currently, you can remove friends by unfriending them on their profile."
        }
      ]
    },
    {
      category: "Technical Information",
      questions: [
        {
          q: "What browsers are supported?",
          a: "The app works best on the latest versions of Chrome, Firefox, Safari, and Edge. Mobile browsers are also supported."
        },
        {
          q: "Is there a mobile app?",
          a: "Currently, this is a web application accessible via mobile browsers. A native mobile app may be developed in the future."
        },
        {
          q: "What are the file size and format limits?",
          a: "Maximum file size: 25MB. Supported formats - Images: JPG, PNG, GIF, WebP. Videos: MP4, WebM, OGG. Audio: MP3, WAV, OGG, WebM."
        }
      ]
    }
  ];

  return (
    <Box>
      <Navbar />
      <Box
        width="100%"
        padding="2rem 6%"
        display={isNonMobileScreens ? "flex" : "block"}
        gap="2rem"
        justifyContent="center"
      >
        <Box
          flexBasis={isNonMobileScreens ? "75%" : undefined}
          maxWidth={isNonMobileScreens ? "900px" : undefined}
        >
          <WidgetWrapper>
            <Typography variant="h2" fontWeight="500" mb="1.5rem" color={palette.neutral.dark}>
              Help & FAQ
            </Typography>
            <Typography variant="body1" mb="2rem" color={palette.neutral.medium}>
              Find answers to common questions about using our social media platform.
            </Typography>

            {faqSections.map((section, sectionIdx) => (
              <Box key={sectionIdx} mb="2rem">
                <Typography 
                  variant="h4" 
                  fontWeight="500" 
                  mb="1rem" 
                  color={palette.primary.main}
                >
                  {section.category}
                </Typography>
                
                {section.questions.map((item, idx) => (
                  <Accordion 
                    key={idx}
                    sx={{
                      backgroundColor: palette.background.alt,
                      mb: "0.5rem",
                      '&:before': {
                        display: 'none',
                      },
                      boxShadow: 'none',
                      border: `1px solid ${palette.neutral.light}`,
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        '&:hover': {
                          backgroundColor: palette.neutral.light,
                        }
                      }}
                    >
                      <Typography fontWeight="500" color={palette.neutral.dark}>
                        {item.q}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography color={palette.neutral.medium}>
                        {item.a}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}

                {sectionIdx < faqSections.length - 1 && (
                  <Divider sx={{ mt: "2rem" }} />
                )}
              </Box>
            ))}

            <Box mt="3rem" p="1.5rem" bgcolor={palette.primary.light} borderRadius="0.75rem">
              <Typography variant="h5" fontWeight="500" mb="1rem" color={palette.neutral.dark}>
                Still Need Help?
              </Typography>
              <Typography color={palette.neutral.medium}>
                If you couldn't find the answer you're looking for, please contact our support team. 
                We're here to help!
              </Typography>
              <Typography mt="1rem" color={palette.neutral.medium}>
                <strong>Note:</strong> This is a demonstration application. For production use, 
                add contact information or a support ticket system here.
              </Typography>
            </Box>
          </WidgetWrapper>
        </Box>
      </Box>
    </Box>
  );
};

export default HelpPage;
