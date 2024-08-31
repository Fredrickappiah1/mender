const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// In-memory storage for sessions
const sessions = {};

const model = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  systemInstruction: `
  Provide short responses(not more that two sentences)
  Provide responses with clear structure:
  - Utilize bullet points for lists. 
  - Be concise and to the point.
  Symptom Assessment: Ask questions to assess symptoms of conditions like depression, anxiety, or stress based on standardized criteria.
  After asking about five diagnostic questions, give user recommendations based on patient's condition.
  Continue conversation after making recommendations based on diagnostic questions.
  Example: "What else would you like to talk about? I'm here for you."
  Symptom Management: Offer concrete techniques to address specific symptoms of depression and anxiety.
  Example: "To reduce anxiety, try progressive muscle relaxation."
  Cognitive Behavioral Techniques (CBT): Incorporate CBT-based approaches to challenge negative thoughts and behaviors.
  Example: "Let's identify the evidence supporting your negative thought."
  Goal Setting: Assist users in setting achievable goals to improve mood and motivation.
  Example: "Break down your goal into smaller, manageable steps."
  Self-Care Emphasis: Encourage self-care activities that directly impact mental health.
  Example: "Regular exercise can boost mood. Let's find a workout routine you'll enjoy."
  Add a bit of humor to your responses.
  Also provide responses based on conversational history.
  Additionally, provide users with this email "adadibrosu@gmail.com" for further assistance from a local Psychologist`,
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: 'text/plain',
};

// POST endpoint to handle chat requests
app.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // If session doesn't exist, initialize a new session history
    if (!sessions[sessionId]) {
      sessions[sessionId] = [];
    }

    // Start a chat session with the model using the stored history
    const chatSession = model.startChat({
      generationConfig,
      history: sessions[sessionId],
    });

    // Send the user's message to the model
    const result = await chatSession.sendMessage(message);

    // Update the session history with the user's message and the model's response
    sessions[sessionId].push(
      { role: 'user', parts: [{ text: message }] },
      { role: 'model', parts: [{ text: result.response.text() }] }
    );

    // Send the model's response back to the client
    res.json({ response: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


// const express = require('express');
// const passport = require('passport');
// const session = require('express-session');
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const path = require('path');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Set up session management
// app.use(session({
//   secret: process.env.SESSION_SECRET || 'your_secret_key',
//   resave: false,
//   saveUninitialized: false,
// }));

// app.use(passport.initialize());
// app.use(passport.session());

// // Serve the homepage
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Auth Routes
// app.get('/auth/google',
//   passport.authenticate('google', { scope: ['profile', 'email'] })
// );

// app.get('/auth/google/callback',
//   passport.authenticate('google', { failureRedirect: '/' }),
//   (req, res) => {
//     // Successful authentication, redirect to chat.
//     res.redirect('/chatbot');
//   }
// );

// // Middleware to check if user is authenticated
// function isAuthenticated(req, res, next) {
//   if (req.isAuthenticated()) {
//     return next();
//   }
//   res.redirect('/');
// }

// // Protect the chat route
// app.get('/chat', isAuthenticated, (req, res) => {
//   res.sendFile(path.join(__dirname, 'public', 'chatbot.html'));
// });

// // Serve the login page (could also be a redirect to Google OAuth)
// app.get('/login', (req, res) => {
//   res.redirect('/auth/google');
// });

// // Logout route
// app.get('/logout', (req, res) => {
//   req.logout((err) => {
//     if (err) return next(err);
//     res.redirect('/');
//   });
// });

// // Start the server
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });
