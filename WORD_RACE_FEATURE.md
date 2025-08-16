# Enhanced Word Race Feature

## Overview

The Word Race feature has been completely rebuilt and enhanced with probability-based scoring, modern UI, and robust gameplay mechanics. This feature allows users to compete in real-time anagram battles with sophisticated scoring systems.

## Key Features

### 🏁 Race Types
- **Sprint**: Quick 3-minute races (8 rounds)
- **Marathon**: Extended 10-minute challenges (20 rounds)  
- **Blitz**: Lightning fast 1-minute rounds (5 rounds)
- **Custom**: Fully customizable races

### 🎯 Probability-Based Scoring
- **Word Frequency Analysis**: Words are scored based on their frequency in language
- **Rarity Bonuses**: Rare words earn extra points
- **Streak Multipliers**: Consecutive correct words increase scoring
- **Time Bonuses**: Faster submissions earn additional points

### 🏆 Enhanced Gameplay
- **Real-time Statistics**: Live tracking of performance metrics
- **Achievement System**: Unlock badges for various accomplishments
- **Hint System**: Probability-filtered word suggestions
- **Progress Tracking**: Visual progress indicators and timers

## Database Schema

### Races Table
```sql
CREATE TABLE races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT DEFAULT 'Anagram Race',
  type TEXT DEFAULT 'sprint',
  difficulty TEXT DEFAULT 'medium',
  duration_seconds INTEGER DEFAULT 180,
  max_participants INTEGER DEFAULT 8,
  current_players INTEGER DEFAULT 0,
  status TEXT DEFAULT 'waiting',
  creator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_public BOOLEAN DEFAULT true,
  word_length INTEGER,
  rounds INTEGER DEFAULT 10,
  alphagram TEXT,
  probability_mode BOOLEAN DEFAULT false,
  min_probability INTEGER DEFAULT 0,
  max_probability INTEGER DEFAULT 100
);
```

### Race Participants Table
```sql
CREATE TABLE race_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID REFERENCES races(id),
  user_id UUID REFERENCES auth.users(id),
  username TEXT,
  score INTEGER DEFAULT 0,
  words_found INTEGER DEFAULT 0,
  current_round INTEGER DEFAULT 0,
  is_ready BOOLEAN DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  streak INTEGER DEFAULT 0,
  average_word_score INTEGER DEFAULT 0,
  rare_words_found INTEGER DEFAULT 0
);
```

### Race Words Table
```sql
CREATE TABLE race_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID REFERENCES races(id),
  user_id UUID REFERENCES auth.users(id),
  word TEXT NOT NULL,
  round_index INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  frequency INTEGER DEFAULT 50,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Race Results Table
```sql
CREATE TABLE race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID REFERENCES races(id),
  user_id UUID REFERENCES auth.users(id),
  final_score INTEGER DEFAULT 0,
  words_found INTEGER DEFAULT 0,
  average_time INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  streak INTEGER DEFAULT 0,
  rare_words_found INTEGER DEFAULT 0,
  average_word_score INTEGER DEFAULT 0
);
```

## Scoring System

### Base Scoring
- **Base Score**: 10 points per word
- **Length Bonus**: +2 points per letter
- **Scrabble Score**: +50% of Scrabble point value

### Probability-Based Bonuses
- **Rare Words** (< 30% frequency): +15 points
- **Uncommon Words** (30-50% frequency): +10 points
- **Common Words** (50-70% frequency): +5 points
- **Very Common Words** (≥ 70% frequency): +0 points

### Performance Bonuses
- **Streak Bonus**: +2 points per consecutive word (max 20)
- **Time Bonus**: +1-5 points for fast submissions
- **Efficiency Bonus**: Based on words per minute

## Components

### Core Components
1. **RaceLobby**: Main lobby for browsing and joining races
2. **RaceGame**: Active gameplay interface
3. **RaceResults**: Post-race results and statistics
4. **CreateRaceModal**: Race creation with advanced options
5. **ProbabilityHintModal**: Probability-based word hints
6. **RaceStats**: Comprehensive statistics display

### Context Providers
- **RaceContext**: Manages race state and operations
- **WordFrequency**: Probability calculations and analysis

## Usage

### Creating a Race
1. Navigate to the Race Lobby
2. Click "Create Race" or select a quick-start option
3. Configure race settings:
   - Race type (Sprint/Marathon/Blitz/Custom)
   - Difficulty level
   - Word length restrictions
   - Probability mode settings
   - Advanced scoring options
4. Set privacy and participant limits
5. Click "Create Race"

### Joining a Race
1. Browse available races in the lobby
2. Filter by difficulty, type, or search terms
3. Click "Join Race" on desired race
4. Wait for race to start or join as spectator

### Playing a Race
1. View current alphagram (scrambled letters)
2. Enter valid anagrams in the input field
3. Submit words to earn points
4. Use hints if available
5. Monitor real-time statistics
6. Advance to next round when ready

### Probability Mode
- **Enable**: Toggle probability-based scoring
- **Range**: Set minimum and maximum word frequency
- **Hints**: Get filtered word suggestions
- **Scoring**: Enhanced scoring based on word rarity

## Achievements

### Performance Achievements
- **High Scorer**: Score over 500 points
- **Word Master**: Find over 20 words
- **Streak Master**: Achieve 5+ word streak
- **Rare Word Hunter**: Find 3+ rare words
- **Efficiency Expert**: Average score over 25 points
- **Probability Pro**: Complete probability mode race

## API Endpoints

### Race Management
- `POST /races` - Create new race
- `GET /races` - List available races
- `PUT /races/:id` - Update race status
- `DELETE /races/:id` - Delete race

### Gameplay
- `POST /race-participants` - Join race
- `DELETE /race-participants` - Leave race
- `POST /race-words` - Submit word
- `PUT /race-participants` - Update participant stats

### Results
- `GET /race-results/:raceId` - Get race results
- `POST /race-results` - Save final results

## Installation

1. **Database Migration**: Run the provided SQL migration script
2. **Dependencies**: Ensure all required packages are installed
3. **Configuration**: Set up Supabase environment variables
4. **Testing**: Verify race creation and gameplay functionality

## Future Enhancements

### Planned Features
- **Tournament Mode**: Multi-stage competitions
- **Team Races**: Collaborative gameplay
- **AI Opponents**: Computer-generated competitors
- **Leaderboards**: Global and seasonal rankings
- **Replay System**: Watch previous races
- **Social Features**: Friend challenges and sharing

### Technical Improvements
- **Real-time Updates**: WebSocket integration
- **Performance Optimization**: Caching and indexing
- **Mobile Support**: Responsive design improvements
- **Accessibility**: Screen reader and keyboard support

## Troubleshooting

### Common Issues
1. **Database Errors**: Ensure migration script has been run
2. **Race Creation Fails**: Check user authentication
3. **Word Validation**: Verify dictionary integration
4. **Performance Issues**: Monitor database query optimization

### Support
For technical support or feature requests, please refer to the project documentation or create an issue in the repository. 