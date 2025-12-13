# OpenNet: Community Platform for Volleyball Meetup Scheduling
# Jira Link
https://camdenkseaver.atlassian.net/jira/software/projects/OP/boards/34
---
## Team Members
- Camden Seaver  
- Aaron Sallade
- Grogan Kraus

---

## Introduction
In the volleyball community—whether competitive or casual—it remains difficult to organize games, find local meetups, and coordinate with others effectively. Using group texts or social media often leads to miscommunication and low turnout.  
**OpenNet** aims to solve this by providing a streamlined platform that connects volleyball players, allowing them to easily find, join, and organize games in their area. Through clear scheduling tools and an intuitive interface, the app fosters better coordination and stronger community participation.

---

## Objectives
- Develop a comprehensive mobile platform that connects volleyball players and facilitates meetup creation and management.  
- Design an intuitive, map-based discovery system that allows users to find and join volleyball games in their area.  
- Implement structured team formation and position management features specific to volleyball gameplay.  
- Provide robust community-building tools, including user profiles, waitlist management, and invitation systems.  

---

## Scope
This project focuses on creating a **React Native mobile application** dedicated to volleyball meetups.  
Core features include:
- User authentication and profile management  
- Meetup creation and discovery  
- Interactive map-based visualization  
- Team formation and player position management  
- Notification and waitlist systems  

The platform will support three court types:
- Beach  
- Indoor  
- Grass  

Advanced features like payment processing, league management, and tournament brackets are **outside the initial scope** of this version.

---

## Proposed Solution
**OpenNet** is a mobile community platform that connects volleyball players through **location-based meetups**.  
Users can:
- Create profiles with their preferred positions and skill levels  
- Host or discover games via an interactive map  
- Join meetups that include court type, player limits, and scheduling details  
- Participate in host-managed waitlists and team formations  

The app is designed for both **recreational and competitive** volleyball players seeking organized and enjoyable local games.

---

## Technology Stack
| Layer | Technology |
|--------|-------------|
| **Frontend** | React Native with Expo |
| **Backend / Database** | JavaScript, Cloud Firestore |
| **Storage** | Supabase |
| **Deployment** | Expo EAS Build (iOS & Android) |

---

## Expected Outcomes
The final deliverable will be a **fully functional mobile application** featuring:
- User authentication and profiles  
- Map-based game discovery  
- Game creation and joining workflows  
- Waitlist and team formation systems  
- Push notifications for game updates  
- Testing results confirming successful coordination among community members  

---



---

## How to Run the Project

### Prerequisites
- Node.js (v18+)
- npm
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/CamdenKSeaver/Open-Net.git
cd Open-Net
```

2. **Install dependencies**
```bash
npm install
```

3. **Create `.env` file** with your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
I have this already in there for now which I know is normally really bad bud it should be fine for this
```

4. **Start the backend server**
```bash
cd backend, npm start
```

5. **Start the Expo app** (in a new terminal)
```bash
npx expo start
```

6. **Run on your device**
- Scan the QR code with Expo Go app (Android) or Camera (iOS)
- Or press `i` for iOS simulator / `a` for Android emulator

### Run Tests
```bash
npm test                    # Run all tests
```

---

