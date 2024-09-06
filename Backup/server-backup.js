const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// In-memory storage for prompts (replace with a database in a production environment)
let prompts = [];

// Route to get all prompts
app.get('/prompts', (req, res) => {
  res.json(prompts);
});

// Route to add a new prompt
app.post('/prompts', (req, res) => {
  const newPrompt = req.body.prompt;
  if (newPrompt && !prompts.includes(newPrompt)) {
    prompts.push(newPrompt);
    res.status(201).json({ message: 'Prompt added successfully' });
  } else {
    res.status(400).json({ message: 'Invalid prompt or prompt already exists' });
  }
});

// Route to delete a prompt
app.delete('/prompts/:index', (req, res) => {
  const index = parseInt(req.params.index);
  if (index >= 0 && index < prompts.length) {
    prompts.splice(index, 1);
    res.json({ message: 'Prompt deleted successfully' });
  } else {
    res.status(404).json({ message: 'Prompt not found' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});