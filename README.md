# 🌐 Let’s Connect  

**Let’s Connect** is a small web app experiment in *digital serendipity*.  
Type a word, and if someone else types the same one within a few minutes..you’re instantly connected in a private, anonymous chat.

👉 **Live Demo:** [lets-connect-ebon.vercel.app](https://lets-connect-ebon.vercel.app/)  

---

## 🚀 Project Goals

This project explores:
- Real-time communication using **Firebase**
- Simple matchmaking logic (word-based pairing)
- Clean UI with **React**, **Vite**, and **Tailwind CSS**
- Modern **TypeScript** best practices and Firestore security rules

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-------------|
| **Frontend** | React + Vite + TypeScript |
| **Styling** | Tailwind CSS |
| **Routing** | React Router |
| **Backend** | Firebase (Auth + Firestore + Cloud Functions) |
| **Realtime** | Firestore Subscriptions |
| **Build Tools** | Vite, npm |
| **Hosting** | Frontend → Vercel<br>Backend → Firebase Functions |
| **Help** | Open AI, Chat GPT, Google, Stack Overflow

---

## 🧩 Run Locally

```bash
# Clone the repo
git clone https://github.com/YOUR-USERNAME/lets-connect.git
cd lets-connect

# Install dependencies
npm install

# Start the dev server
npm run dev
Then open http://localhost:5173 in your browser.

⚙️ Firebase Setup
This project uses Firestore + Anonymous Auth for real-time chat.

Create a Firebase project at console.firebase.google.com

Enable:

Firestore Database

Authentication → Anonymous Sign-In

Add your credentials in a .env file:

bash
Copy code
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-storage-bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
☁️ Backend (Cloud Functions)
The backend includes a cleanup function that:

Deletes stale waiting users after 3 minutes

Removes inactive chat rooms after 10 minutes

To deploy:

bash
Copy code
cd functions
npm install
npm run build
firebase deploy --only functions
🚀 Deployment (Frontend on Vercel)
This project is hosted live on Vercel.
To deploy your own version:

Push your repo to GitHub

Go to vercel.com → Import Project

Select Vite as the framework

Add the same environment variables (from your .env)

Click Deploy 🎉

❤️ Inspiration
Built to explore what happens when two people think of the same thing at the same time.
Experimentation with presence, simplicity, and connection.