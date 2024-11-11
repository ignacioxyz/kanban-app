# Kanban App with Real-Time Collaboration

This is a Kanban app that supports real-time collaboration.

## Getting Started

To run this project, ensure you have Node.js v20.17.0 installed. Then, execute the following commands in the repository directory:

```bash
npm install
npm run dev
```

## Environment Setup
You also need to create a .env file in the project root with the following environment variables:

```bash
# Key used to create and access rooms in the app
KANBAN_SECRET_KEY=your-kanban-secret-key
# Secret key from Liveblocks for real-time collaboration
LIVEBLOCKS_SECRET_KEY=your-liveblocks-api-key
```

> **Note:** You can obtain an API key for Liveblocks at https://liveblocks.io/.