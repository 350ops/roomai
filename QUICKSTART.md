# Quick Start Guide - Bianco AI

## ✅ What's Been Completed

Your app now has production-ready:
- ✅ Secure environment variable management
- ✅ Full authentication system (signup, login, password reset)
- ✅ Input validation and security hardening
- ✅ Error boundaries (app won't crash)
- ✅ Structured logging system
- ✅ API retry logic with exponential backoff

## 🚀 Getting Started

### 1. Environment Setup

Your environment variables are already configured in `.env`:
```env
EXPO_PUBLIC_OPENAI_API_KEY=sk-proj-... ✅
EXPO_PUBLIC_SUPABASE_URL=https://... ✅
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhb... ✅
```

### 2. Start the Development Server

```bash
# Clear cache and start fresh
npx expo start -c

# Or just start normally
npx expo start
```

### 3. Test Authentication

**Sign Up Flow:**
1. Open the app → Navigate to Signup screen
2. Enter email: `test@example.com`
3. Create password (min 8 chars, 1 uppercase, 1 number)
4. Check your email for verification link
5. Click verification link
6. Return to app and login

**Login Flow:**
1. Navigate to Login screen
2. Enter your verified email and password
3. Should redirect to main app tabs

**Forgot Password:**
1. Click "Forgot Password?" on login screen
2. Enter your email
3. Check email for reset link

### 4. Test Error Handling

The app now has comprehensive error handling:

**Test Error Boundary:**
- Any uncaught error will show a friendly error screen
- Users can "Try Again" or "Go to Home"
- In development, you'll see error details

**Test Validation:**
- Try submitting empty forms → Validation errors
- Try uploading huge images → Size validation
- Try making 6+ rapid AI requests → Rate limit error
- Long-running API calls → Timeout after 30 seconds

**Test Logging:**
- Open React Native Debugger or terminal
- All logs are now structured with timestamps
- Debug logs only show in development
- Production builds will only show warnings/errors

## 📱 Testing Checklist

- [ ] Sign up with new email
- [ ] Verify email via link
- [ ] Login with verified account
- [ ] Test forgot password flow
- [ ] Upload image in AI Studio (with validation)
- [ ] Submit prompt (with rate limiting)
- [ ] Test error boundary (cause a crash intentionally)
- [ ] Check structured logs in console

## 🔧 Known Issues & Notes

### Current Limitations:
1. **OAuth Not Implemented:** Google/Apple sign-in buttons are visible but not functional
2. **No Route Protection:** Users can access tabs without login (next TODO)
3. **No Database Integration:** Projects/designs not saved yet (Phase 4)

### Metro Bundler Cache:
If you see import errors after new files were created:
```bash
# Clear Metro bundler cache
npx expo start -c

# Or manually
rm -rf node_modules/.cache
```

### Supabase Email Verification:
- Check your Supabase dashboard → Authentication → Email Templates
- Ensure email verification is enabled
- Test emails may go to spam folder

## 🐛 Troubleshooting

### "Unable to resolve module @/hooks/useAuth"
**Fixed!** The imports now use relative paths. If you still see this:
```bash
npx expo start -c
```

### "Supabase not configured"
Check that your `.env` file has all required variables:
```bash
cat .env | grep EXPO_PUBLIC
```

### API Key Invalid
Verify your OpenAI API key is active:
1. Go to https://platform.openai.com/api-keys
2. Check key status
3. Ensure you have credits available

### Authentication Errors
Common issues:
- Email not verified → Check inbox/spam
- Invalid credentials → Check password requirements
- Session expired → Logout and login again

## 📊 Progress Status

**Completed (50%):**
- Phase 1: Security & Configuration ✅
- Phase 2: Authentication ✅
- Phase 3: Error Handling & Logging ✅

**Next Steps:**
- Phase 4: Database schema + image storage (2-3 days)
- Phase 5: Testing & CI/CD (2-3 days)
- Phase 6: Production build (1-2 days)

## 📝 Important Files

**Configuration:**
- [`.env`](.env) - Your environment variables (never commit!)
- [`eas.json`](eas.json) - EAS build configuration
- [`app.json`](app.json) - Expo app configuration

**Authentication:**
- [`app/contexts/AuthContext.tsx`](app/contexts/AuthContext.tsx) - Auth system
- [`app/screens/login.tsx`](app/screens/login.tsx) - Login screen
- [`app/screens/signup.tsx`](app/screens/signup.tsx) - Signup screen

**Security:**
- [`app/lib/validation.ts`](app/lib/validation.ts) - Input validation
- [`app/lib/api-client.ts`](app/lib/api-client.ts) - API retry logic
- [`app/lib/logger.ts`](app/lib/logger.ts) - Structured logging

**Error Handling:**
- [`app/components/ErrorBoundary.tsx`](app/components/ErrorBoundary.tsx) - Crash prevention
- [`app/components/ErrorFallback.tsx`](app/components/ErrorFallback.tsx) - Error UI

## 🎯 Next Implementation Priority

1. **Route Protection** (1 day)
   - Redirect unauthenticated users to welcome/login
   - Protect main app tabs

2. **Database Schema** (1-2 days)
   - Create projects table
   - Create estimates table
   - Set up Row Level Security (RLS)

3. **Image Storage** (1 day)
   - Compress images before upload
   - Save to Supabase Storage
   - Link to user projects

4. **Testing** (2-3 days)
   - E2E tests for auth flow
   - Critical path testing
   - CI/CD setup

## 🚢 Production Checklist (Before Launch)

- [ ] Test signup/login flows thoroughly
- [ ] Verify email verification works
- [ ] Test on physical iOS device
- [ ] Check LiDAR permissions
- [ ] Configure EAS Secrets for production
- [ ] Run production build via EAS
- [ ] Test production build on device
- [ ] Verify no API keys in code
- [ ] Set up error tracking (Sentry - optional)
- [ ] Prepare App Store metadata

## 💡 Tips

**Development:**
- Use `npx expo start -c` when you add new files
- Check Metro bundler terminal for errors
- Use React Native Debugger for better logs

**Testing:**
- Test with real email addresses for verification
- Check Supabase dashboard for auth events
- Monitor API usage in OpenAI dashboard

**Debugging:**
- All logs now go through structured logger
- Check `[Auth]`, `[API]`, `[Storage]` prefixes
- Error details shown in dev mode only

---

**Need Help?**
- Review [`PRODUCTION_POLISH_PROGRESS.md`](PRODUCTION_POLISH_PROGRESS.md) for detailed status
- Check [`SETUP_ENVIRONMENT.md`](SETUP_ENVIRONMENT.md) for environment setup
- See inline code comments in critical files

**Ready to continue?** Run `npx expo start` and test the authentication system!
