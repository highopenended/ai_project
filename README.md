# AI Project

A React-based web application with Firebase backend for AI-powered shop generation and item management.

## 🚀 Features

- User Authentication
- Item List Management
- AI-Powered Shop Generator
- Protected Routes
- Real-time Database with Firebase
- Modern UI with Tailwind CSS

## 🛠️ Tech Stack

- **Frontend**: React 18, React Router DOM
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Authentication, Firestore)
- **Build Tool**: Vite
- **AI Integration**: OpenAI
- **Additional Tools**: DOMPurify, Marked

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Firebase account
- OpenAI API key

## 🔧 Installation

1. Clone the repository:
   ```bash
   git clone [your-repository-url]
   cd ai_project
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with your Firebase and OpenAI credentials.

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run import-data` - Import data to Firestore
- `npm run delete-data` - Delete data from Firestore
- `npm run sync-items` - Synchronize item table

## 🏗️ Project Structure

```
ai_project/
├── src/
│   ├── components/     # React components
│   ├── context/       # Context providers
│   ├── constants/     # Constants and configurations
│   ├── lib/          # Utility functions
│   ├── scripts/      # Data management scripts
│   ├── styles/       # CSS styles
│   └── assets/       # Static assets
├── functions/        # Firebase Cloud Functions
├── public/          # Public assets
└── dist/           # Production build
```

## 🔒 Firebase Configuration

The project uses Firebase for:
- Authentication
- Firestore Database
- Cloud Functions
- Hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- [Your Name]

## 🙏 Acknowledgments

- OpenAI for AI capabilities
- Firebase for backend services
- React team for the awesome framework
