# Environment Setup Guide

## Overview
This app uses environment variables to securely manage API keys and configuration. This guide explains how to set up your development environment and configure EAS Secrets for production builds.

## Local Development Setup

### 1. Copy Environment Template
```bash
cp .env.example .env.development
```

### 2. Fill in Your API Keys
Edit `.env.development` and add your actual credentials:

```env
# OpenAI API Configuration
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
EXPO_PUBLIC_OPENAI_API_URL=https://api.openai.com

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
EXPO_PUBLIC_APP_ENV=development
```

### 3. Where to Find Your Keys

**OpenAI API Key:**
1. Go to https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the key (starts with `sk-proj-`)

**Supabase Credentials:**
1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the "Project URL" (EXPO_PUBLIC_SUPABASE_URL)
4. Copy the "anon public" key (EXPO_PUBLIC_SUPABASE_ANON_KEY)

## EAS Build Setup (Production/Preview)

For production and preview builds, you must configure EAS Secrets to avoid storing sensitive keys in your repository.

### 1. Install EAS CLI
```bash
npm install -g eas-cli
eas login
```

### 2. Set Environment Secrets
Run these commands to securely store your credentials:

```bash
# Set OpenAI API Key
eas secret:create --scope project --name EXPO_PUBLIC_OPENAI_API_KEY --value "sk-proj-xxxxxxxxxxxxx" --type string

# Set OpenAI API URL
eas secret:create --scope project --name EXPO_PUBLIC_OPENAI_API_URL --value "https://api.openai.com" --type string

# Set Supabase URL
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://your-project.supabase.co" --type string

# Set Supabase Anon Key
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." --type string
```

### 3. Verify Secrets
```bash
eas secret:list
```

You should see all four secrets listed.

### 4. Build Your App
```bash
# Preview build
eas build --profile preview --platform ios

# Production build
eas build --profile production --platform ios
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_OPENAI_API_KEY` | Yes | OpenAI API key for AI image generation |
| `EXPO_PUBLIC_OPENAI_API_URL` | Yes | OpenAI API endpoint (default: https://api.openai.com) |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous/public API key |
| `EXPO_PUBLIC_APP_ENV` | No | Current environment (development/preview/production) |

## Security Best Practices

### ⚠️ NEVER commit these files:
- `.env.development`
- `.env.preview`
- `.env.production`
- Any file containing actual API keys

### ✅ Safe to commit:
- `.env.example` (template with placeholder values)
- `eas.json` (now contains no secrets)

### Important Notes:

1. **API Key Exposure:** Variables prefixed with `EXPO_PUBLIC_` are embedded in the app binary and can be extracted. For maximum security, consider implementing a backend proxy for OpenAI API calls.

2. **Supabase Row Level Security (RLS):** Since the Supabase anon key is public, you MUST configure Row Level Security policies in your Supabase database to protect user data.

3. **Rotation:** Regularly rotate your API keys, especially if you suspect they've been compromised.

4. **Git History:** If you previously committed API keys, they may still exist in your git history. Consider using tools like `git-filter-repo` to remove them permanently.

## Troubleshooting

### "Supabase not configured" warning
- Ensure all Supabase environment variables are set
- Check for typos in variable names
- Verify `.env.development` exists and is in the project root

### "OpenAI API key invalid" error
- Verify your API key is correct and active
- Check that you have credits available in your OpenAI account
- Ensure the key starts with `sk-proj-`

### EAS build fails with missing secrets
- Run `eas secret:list` to verify all secrets are configured
- Make sure secret names exactly match the variable names (case-sensitive)
- Try deleting and recreating the secret if it's malformed

## Development Workflow

```bash
# 1. Set up environment
cp .env.example .env.development
# Edit .env.development with your keys

# 2. Start development server
npx expo start

# 3. Run on iOS simulator
npm run ios

# 4. Build for preview/testing
eas build --profile preview --platform ios

# 5. Build for production
eas build --profile production --platform ios
```

## Need Help?

If you encounter issues:
1. Check that all environment variables are correctly set
2. Verify your API keys are valid and have sufficient quota
3. Review Expo's documentation: https://docs.expo.dev/build-reference/variables/
4. Check EAS Secrets documentation: https://docs.expo.dev/build-reference/variables/#using-secrets-in-environment-variables
