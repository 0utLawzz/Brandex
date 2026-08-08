# Brandex Installation & Deployment Guide

**Beginner-Friendly Guide**  
Last Updated: August 5, 2026

This guide will help you install Brandex locally, set up environment variables, deploy to Vercel, and configure Neon database - even if you have no coding experience.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Installation](#local-installation)
3. [Environment Variables Setup](#environment-variables-setup)
4. [Running the Project Locally](#running-the-project-locally)
5. [Command Execution Guide](#command-execution-guide)
6. [Neon Database Setup](#neon-database-setup)
7. [Database Seeding](#database-seeding)
8. [Vercel Deployment](#vercel-deployment)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

---

## 🔧 Prerequisites

Before you begin, make sure you have these installed on your computer:

### Required Software

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Install the LTS version (Long Term Support)
   - After installation, verify: `node --version`

2. **pnpm** (Package Manager)
   - Open terminal/command prompt and run:
   ```bash
   npm install -g pnpm
   ```
   - Verify installation: `pnpm --version`

3. **Git** (Version Control)
   - Download from: https://git-scm.com/downloads
   - Verify installation: `git --version`

4. **Code Editor** (Recommended: VS Code)
   - Download from: https://code.visualstudio.com/
   - Optional but highly recommended

### Online Accounts Required

1. **GitHub Account** - For code hosting
2. **Neon Account** - For PostgreSQL database (free tier available)
3. **Vercel Account** - For deployment (free tier available)
4. **Google Cloud Account** - For Google Sheets API (free tier available)

---

## 💻 Local Installation

### Step 1: Clone the Repository

1. Open your terminal/command prompt
2. Navigate to where you want to store the project:
   ```bash
   cd Desktop
   ```
3. Clone the repository:
   ```bash
   git clone https://github.com/0utLawzz/Brandex.git
   ```
4. Navigate into the project:
   ```bash
   cd Brandex
   ```

### Step 2: Install Dependencies

**IMPORTANT: Always run this from the ROOT directory (G:\Py\Brandex)**

```bash
pnpm install
```

This will install all required packages for the entire project. This may take a few minutes.

### Step 3: Verify Installation

```bash
pnpm run typecheck:libs
```

If this command runs without errors, your installation is successful!

---

## 🔐 Environment Variables Setup

Environment variables are configuration settings that keep your sensitive information (like API keys and database passwords) secure. In production (online), these are stored as secrets. Locally, we use a `.env` file.

### Where to Create .env File

**For Local Development:**
Create `.env` files in these locations:

1. **Root .env file** (G:\Py\Brandex\.env)
2. **API Server .env file** (G:\Py\Brandex\artifacts\api-server\.env)

### Required Environment Variables

Create these files with the following variables:

#### Root .env file (G:\Py\Brandex\.env)
```env
# Google Sheets Configuration
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here
GOOGLE_SHEETS_APPS_SCRIPT_URL=your_apps_script_web_app_url_here

# Database Configuration
DATABASE_URL=your_neon_database_url_here
DATABASE_URL_UNPOOLED=your_neon_database_url_here

# Session Security
SESSION_SECRET=your_random_secret_string_here
```

#### API Server .env file (G:\Py\Brandex\artifacts\api-server\.env)
```env
# Database Configuration
DATABASE_URL=your_neon_database_url_here
DATABASE_URL_UNPOOLED=your_neon_database_url_here

# Session Security
SESSION_SECRET=your_random_secret_string_here

# Google Sheets Configuration
GOOGLE_SHEETS_API_KEY=your_google_sheets_api_key_here
GOOGLE_SHEETS_APPS_SCRIPT_URL=your_apps_script_web_app_url_here
```

### How to Get These Values

#### 1. Google Sheets API Key
1. Go to: https://console.cloud.google.com/
2. Create a new project or select existing one
3. Enable "Google Sheets API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy the API key and paste it in your .env files

#### 2. Google Apps Script URL
1. Open your Google Sheet
2. Go to "Extensions" → "Apps Script"
3. Copy the code from `google-apps-script/Code.gs` in this project
4. Paste it into the Apps Script editor
5. Deploy: "Deploy" → "New deployment" → "Web app"
6. Set "Execute as" to "Me" and "Who has access" to "Anyone with the link"
7. Copy the generated URL (ends with /exec)
8. Paste it in your .env files

#### 3. Neon Database URL
1. Go to: https://neon.tech/
2. Sign up and create a new project
3. Create a new PostgreSQL database
4. Copy the connection string (looks like: `postgresql://user:password@ep-xxx.aws.neon.tech/dbname`)
5. Add `?sslmode=require` at the end: `postgresql://user:password@ep-xxx.aws.neon.tech/dbname?sslmode=require`
6. Paste it in your .env files

#### 4. Session Secret
Generate a random secret string:
```bash
# You can use this command in terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output and paste it as SESSION_SECRET

---

## 🚀 Running the Project Locally

### Understanding the Project Structure

```
Brandex/                    # ROOT directory - run most commands here
├── artifacts/
│   ├── tm-tracker-mobile/  # Mobile app (Expo/React Native)
│   ├── tm-tracker/         # Desktop web app (React/Vite)
│   └── api-server/         # Backend API (Express/Node.js)
├── lib/                    # Shared libraries
└── .env                    # Environment variables (create this)
```

### Starting the Applications

**IMPORTANT: Run these commands from the ROOT directory (G:\Py\Brandex)**

#### Option 1: Start Everything (Recommended for Development)

```bash
# Start API Server
pnpm --filter @workspace/api-server run dev

# In a NEW terminal window, start mobile app
pnpm --filter @workspace/tm-tracker-mobile run dev

# In another NEW terminal window, start desktop app
pnpm --filter @workspace/tm-tracker run dev
```

#### Option 2: Start Individual Components

**API Server Only:**
```bash
pnpm --filter @workspace/api-server run dev
```
API will be available at: http://localhost:3000/api

**Mobile App Only:**
```bash
pnpm --filter @workspace/tm-tracker-mobile run dev
```
Mobile app will be available at: http://localhost:19006

**Desktop App Only:**
```bash
pnpm --filter @workspace/tm-tracker run dev
```
Desktop app will be available at: http://localhost:5173

### What You Should See

1. **API Server**: Terminal shows "Server running on port 3000"
2. **Mobile App**: Browser opens to http://localhost:19006 with the mobile interface
3. **Desktop App**: Browser opens to http://localhost:5173 with the desktop interface

---

## 📝 Command Execution Guide

### ⚠️ IMPORTANT: Where to Run Commands

**ROOT Directory Commands** (Run from G:\Py\Brandex):
```bash
pnpm install                    # Install all dependencies
pnpm run typecheck:libs         # Type check all libraries
pnpm run build                  # Build all packages
pnpm run typecheck              # Full typecheck across all packages
```

**Artifact-Specific Commands** (Run from ROOT with --filter):
```bash
# API Server commands
pnpm --filter @workspace/api-server run dev      # Start API server
pnpm --filter @workspace/api-server run build    # Build API server
pnpm --filter @workspace/api-server run typecheck # Type check API server

# Mobile App commands
pnpm --filter @workspace/tm-tracker-mobile run dev      # Start mobile app
pnpm --filter @workspace/tm-tracker-mobile run build    # Build mobile app
pnpm --filter @workspace/tm-tracker-mobile run typecheck # Type check mobile app

# Desktop App commands
pnpm --filter @workspace/tm-tracker run dev      # Start desktop app
pnpm --filter @workspace/tm-tracker run build    # Build desktop app
pnpm --filter @workspace/tm-tracker run typecheck # Type check desktop app
```

**Database Commands**:
```bash
pnpm --filter @workspace/db run push    # Push schema changes to database
```

### Why This Structure?

The project uses **pnpm workspaces** - this means:
- Root directory manages all dependencies
- Each artifact (mobile, desktop, API) is a separate package
- Shared libraries are in the `lib/` directory
- Commands use `--filter` to target specific packages

---

## 🗄️ Neon Database Setup

### Step 1: Create Neon Account

1. Go to: https://neon.tech/
2. Click "Sign Up" (you can use GitHub for quick signup)
3. Verify your email address

### Step 2: Create a Database

1. After logging in, click "Create a project"
2. Choose a name (e.g., "brandex-db")
3. Select a region closest to you
4. Click "Create Project"
5. Wait for the database to be created (1-2 minutes)

### Step 3: Get Connection String

1. In your Neon dashboard, click on your project
2. Go to "Connection Details"
3. Copy the "Connection string" (looks like):
   ```
   postgresql://username:password@ep-xxx.aws.neon.tech/brandex-db
   ```
4. Add SSL requirement: 
   ```
   postgresql://username:password@ep-xxx.aws.neon.tech/brandex-db?sslmode=require
   ```

### Step 4: Update Environment Variables

Paste this connection string in both .env files:
- `G:\Py\Brandex\.env`
- `G:\Py\Brandex\artifacts\api-server\.env`

### Step 5: Test Database Connection

```bash
# From ROOT directory
pnpm --filter @workspace/api-server run dev
```

If the API starts without database connection errors, your setup is successful!

---

## 🌱 Database Seeding

Seeding means adding initial data to your database. Brandex has two options:

### Option 1: Import from Google Sheets (Recommended)

1. Set up your Google Sheets API key and Apps Script URL (see Environment Variables section)
2. Start the API server:
   ```bash
   pnpm --filter @workspace/api-server run dev
   ```
3. Use the "Sync G-Sheets" button in the web interface
4. This will import all data from your Google Sheet into the database

### Option 2: Manual Database Entry

1. Start the application (web or mobile)
2. Use the "Add TM" button to manually add trademark records
3. Each record will be saved to the database

### Option 3: Direct SQL (Advanced)

If you have SQL knowledge, you can connect directly to Neon and run SQL commands:

1. Go to Neon dashboard
2. Click "SQL Editor" in your project
3. Run INSERT statements to add data

---

## 🚀 Vercel Deployment

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Login to Vercel

```bash
vercel login
```

This will open a browser window where you can authenticate with your Vercel account.

### Step 3: Deploy the Project

**IMPORTANT: Run this from the ROOT directory (G:\Py\Brandex)**

```bash
vercel
```

Follow the prompts:
1. **Set up and deploy?** → Yes
2. **Which scope?** → Select your account
3. **Link to existing project?** → No (first time)
4. **Project name** → brandex (or your preferred name)
5. **Directory** → . (current directory)
6. **Override settings?** → No

### Step 4: Configure Environment Variables in Vercel

1. Go to https://vercel.com/dashboard
2. Find your "brandex" project
3. Go to "Settings" → "Environment Variables"
4. Add these variables:

   **DATABASE_URL**
   ```
   postgresql://username:password@ep-xxx.aws.neon.tech/brandex-db?sslmode=require
   ```

   **GOOGLE_SHEETS_API_KEY**
   ```
   your_google_sheets_api_key_here
   ```

   **GOOGLE_SHEETS_APPS_SCRIPT_URL**
   ```
   your_apps_script_web_app_url_here
   ```

   **SESSION_SECRET**
   ```
   your_random_secret_string_here
   ```

5. Click "Save" for each variable
6. Redeploy your project:
   ```bash
   vercel --prod
   ```

### Step 5: Verify Deployment

1. Vercel will provide a URL (e.g., https://brandex.vercel.app)
2. Open this URL in your browser
3. You should see the Brandex application running

### Understanding Vercel Deployment

**What Vercel Does:**
- Automatically builds your project
- Hosts the frontend (React apps)
- Creates serverless functions for the API
- Provides SSL certificates
- Handles scaling automatically

**Project Structure on Vercel:**
- Frontend served from `/` (root)
- API served from `/api/*` (serverless functions)
- Both share the same domain

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### Issue 1: "pnpm command not found"
**Solution:**
```bash
npm install -g pnpm
```

#### Issue 2: "node_modules not found"
**Solution:**
```bash
# From ROOT directory
pnpm install
```

#### Issue 3: "Cannot connect to database"
**Solution:**
1. Check your DATABASE_URL in .env files
2. Ensure it includes `?sslmode=require`
3. Verify your Neon database is active
4. Check that your Neon project hasn't been suspended

#### Issue 4: "Google Sheets API error"
**Solution:**
1. Verify your API key is correct
2. Ensure Google Sheets API is enabled in Google Cloud Console
3. Check that your Google Sheet is shared with "Anyone with the link"
4. Verify the Apps Script URL is correct and deployed

#### Issue 5: "Port already in use"
**Solution:**
```bash
# Find the process using the port
netstat -ano | findstr :3000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

#### Issue 6: "Type check errors"
**Solution:**
```bash
# Clean install
rm -rf node_modules
pnpm install

# Run type check
pnpm run typecheck:libs
```

#### Issue 7: "Expo/Metro not starting"
**Solution:**
```bash
# Clear Metro cache
cd artifacts/tm-tracker-mobile
npx expo start -c

# Or from ROOT
pnpm --filter @workspace/tm-tracker-mobile run dev -- --clear
```

#### Issue 8: "Vercel deployment fails"
**Solution:**
1. Check that all environment variables are set in Vercel dashboard
2. Ensure your build passes locally: `pnpm run build`
3. Check Vercel deployment logs for specific errors
4. Verify your vercel.json configuration is correct

#### Issue 9: "Security vulnerabilities detected"
**Solution:**
```bash
# Check for vulnerabilities
pnpm audit

# Update dependencies
pnpm update

# If vulnerabilities persist, you may need to override specific packages
# (this is advanced - seek help if needed)
```

#### Issue 10: "Mobile app not loading"
**Solution:**
1. Ensure API server is running first
2. Check that API_URL is correctly configured
3. Verify network connectivity
4. Try clearing browser cache

### Getting Help

If you encounter issues not covered here:

1. **Check the logs** - Read error messages carefully
2. **Google the error** - Many common issues have solutions online
3. **Check GitHub Issues** - https://github.com/0utLawzz/Brandex/issues
4. **Create a new issue** - Provide detailed error messages and steps to reproduce

---

## 🔒 Security Best Practices

### 1. Never Commit .env Files

**CRITICAL:** Never commit .env files to GitHub!

Add this to your `.gitignore` file (if not already present):
```
.env
.env.local
.env.*.local
```

### 2. Use Different Secrets for Development and Production

- Development: Use .env files locally
- Production: Use Vercel environment variables
- Never share secrets in public forums or GitHub issues

### 3. Rotate Secrets Regularly

- Change API keys and passwords periodically
- Update both local .env files and Vercel environment variables
- Test after rotating to ensure everything still works

### 4. Limit API Key Permissions

- Only enable necessary permissions in Google Cloud Console
- Use restrictive API key settings (e.g., limit to specific domains)
- Monitor API usage for unusual activity

### 5. Keep Dependencies Updated

```bash
# Regularly check for updates
pnpm update

# Check for security vulnerabilities
pnpm audit
```

### 6. Use SSL/TLS

- Always use `?sslmode=require` in database URLs
- Vercel automatically provides SSL certificates
- Never use unencrypted connections in production

---

## 📚 Additional Resources

### Official Documentation
- **pnpm**: https://pnpm.io/
- **Vercel**: https://vercel.com/docs
- **Neon**: https://neon.tech/docs
- **Expo**: https://docs.expo.dev/
- **React**: https://react.dev/

### Project-Specific Documentation
- **README.md**: Project overview and setup
- **AGENTS.md**: Development guidelines and backup practices
- **Progress.md**: Current project status and completed tasks
- **CONTRIBUTING.md**: Contribution guidelines
- **SECURITY.md**: Security policy

---

## ✅ Quick Start Checklist

Before you begin, ensure you have:

- [ ] Node.js installed (v18+)
- [ ] pnpm installed globally
- [ ] Git installed
- [ ] GitHub account
- [ ] Neon account
- [ ] Vercel account
- [ ] Google Cloud account
- [ ] Code editor (VS Code recommended)

### Local Development Setup

- [ ] Cloned the repository
- [ ] Run `pnpm install` from ROOT directory
- [ ] Created .env files in ROOT and api-server directories
- [ ] Added all required environment variables
- [ ] Tested with `pnpm run typecheck:libs`
- [ ] Started API server successfully
- [ ] Started mobile/desktop apps successfully

### Deployment Setup

- [ ] Installed Vercel CLI
- [ ] Logged in to Vercel
- [ ] Deployed project with `vercel`
- [ ] Added environment variables in Vercel dashboard
- [ ] Redeployed with `vercel --prod`
- [ ] Verified deployment at provided URL

---

## 🎯 Next Steps

1. **Complete Local Setup** - Get everything running on your machine
2. **Test All Features** - Ensure mobile, desktop, and API work together
3. **Set Up Google Sheets Integration** - Configure bidirectional sync
4. **Deploy to Vercel** - Get your production site running
5. **Set Up Database Backups** - Configure Neon backups
6. **Monitor Performance** - Set up error tracking and monitoring

---

**Need Help?** If you get stuck, refer to the troubleshooting section or create an issue on GitHub with detailed error messages.

**Happy Coding! 🚀**
