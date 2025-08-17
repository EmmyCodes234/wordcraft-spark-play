import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getEnhancedWordFrequency, WordFrequencyData } from "@/data/wordFrequency";

export interface Race {
  id: string;
  name: string;
  type: 'sprint' | 'marathon' | 'blitz' | 'custom';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  duration: number; // seconds
  maxPlayers: number;
  currentPlayers: number;
  status: 'waiting' | 'active' | 'finished';
  createdBy: string;
  createdAt: string;
  startTime?: string;
  endTime?: string;
  isPublic: boolean;
  wordLength?: number;
  rounds: number;
  alphagrams: string[];
  settings: RaceSettings;
  probabilityMode: boolean;
  minProbability: number;
  maxProbability: number;
}

export interface RaceSettings {
  allowHints: boolean;
  showProgress: boolean;
  enableChat: boolean;
  pointsPerWord: number;
  timeBonus: boolean;
  difficultyMultiplier: number;
  probabilityScoring: boolean;
  bonusForRareWords: boolean;
  streakMultiplier: boolean;
}

export interface RaceParticipant {
  id: string;
  userId: string;
  username: string;
  score: number;
  wordsFound: number;
  currentRound: number;
  joinedAt: string;
  finishedAt?: string;
  isReady: boolean;
  streak: number;
  averageWordScore: number;
  rareWordsFound: number;
}

export interface RaceResult {
  raceId: string;
  userId: string;
  finalScore: number;
  wordsFound: number;
  averageTime: number;
  rank: number;
  completedAt: string;
  streak: number;
  rareWordsFound: number;
  averageWordScore: number;
}

export interface WordSubmission {
  word: string;
  frequency: WordFrequencyData;
  score: number;
  timeBonus: number;
  streakBonus: number;
  rarityBonus: number;
  totalScore: number;
  submittedAt: string;
}

interface RaceContextType {
  currentRace: Race | null;
  participants: RaceParticipant[];
  myParticipant: RaceParticipant | null;
  availableRaces: Race[];
  isLoading: boolean;
  mySubmissions: WordSubmission[];
  
  // Race management
  createRace: (settings: Partial<Race>) => Promise<Race | null>;
  joinRace: (raceId: string) => Promise<boolean>;
  leaveRace: (raceId: string) => Promise<boolean>;
  startRace: (raceId: string) => Promise<boolean>;
  
  // Gameplay
  submitWord: (word: string, roundIndex: number) => Promise<WordSubmission | null>;
  nextRound: () => Promise<boolean>;
  finishRace: () => Promise<RaceResult | null>;
  
  // Real-time updates
  subscribeToRace: (raceId: string) => void;
  unsubscribeFromRace: () => void;
  
  // Utilities
  fetchAvailableRaces: () => Promise<void>;
  getRaceResults: (raceId: string) => Promise<RaceResult[]>;
  calculateWordScore: (word: string, timeBonus: number, streak: number) => WordSubmission;
  getProbabilityFilteredWords: (alphagram: string, minProb: number, maxProb: number) => Promise<string[]>;
  loadRace: (raceId: string) => Promise<boolean>;
}

const RaceContext = createContext<RaceContextType | undefined>(undefined);

export const RaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentRace, setCurrentRace] = useState<Race | null>(null);
  const [participants, setParticipants] = useState<RaceParticipant[]>([]);
  const [myParticipant, setMyParticipant] = useState<RaceParticipant | null>(null);
  const [availableRaces, setAvailableRaces] = useState<Race[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mySubmissions, setMySubmissions] = useState<WordSubmission[]>([]);

  // Enhanced alphagram generation with probability filtering
  const generateAlphagrams = (count: number, difficulty: string, wordLength?: number, probabilityMode: boolean = false): string[] => {
    const alphagrams: string[] = [];
    
    // Enhanced alphagrams by difficulty with probability considerations
    const easyAlphagrams = ['AERT', 'AEINS', 'AELST', 'AEIRST', 'AEINST', 'AELNRT', 'AEILNT', 'AEGLNT'];
    const mediumAlphagrams = ['AEGINR', 'AEILNR', 'AEILOR', 'AEGLOR', 'AEGNOR', 'AEILNT', 'AEGLNT', 'AEILRT'];
    const hardAlphagrams = ['AEGINRS', 'AEILNRS', 'AEGLNOR', 'AEILORT', 'AEGINRT', 'AEILNRT', 'AEGLNRT', 'AEILORT'];
    const expertAlphagrams = ['AEGINRST', 'AEILNRST', 'AEGLNORT', 'AEILORST', 'AEGINORT', 'AEILNORT', 'AEGLNORT', 'AEILORST'];
    
    let sourceAlphagrams: string[];
    switch (difficulty) {
      case 'easy': sourceAlphagrams = easyAlphagrams; break;
      case 'medium': sourceAlphagrams = mediumAlphagrams; break;
      case 'hard': sourceAlphagrams = hardAlphagrams; break;
      case 'expert': sourceAlphagrams = expertAlphagrams; break;
      default: sourceAlphagrams = mediumAlphagrams;
    }
    
    // Generate required number of alphagrams
    for (let i = 0; i < count; i++) {
      const randomIndex = Math.floor(Math.random() * sourceAlphagrams.length);
      alphagrams.push(sourceAlphagrams[randomIndex]);
    }
    
    return alphagrams;
  };

  // Calculate word score with probability-based bonuses
  const calculateWordScore = (word: string, timeBonus: number = 0, streak: number = 0): WordSubmission => {
    const frequency = getEnhancedWordFrequency(word);
    let baseScore = 10;
    
    // Base score based on word length
    baseScore += word.length * 2;
    
    // Frequency-based scoring
    let rarityBonus = 0;
    if (frequency.frequency < 30) {
      rarityBonus = 15; // Rare words get bonus
    } else if (frequency.frequency < 50) {
      rarityBonus = 10;
    } else if (frequency.frequency < 70) {
      rarityBonus = 5;
    }
    
    // Streak bonus
    const streakBonus = Math.min(streak * 2, 20);
    
    // Scrabble score bonus
    const scrabbleBonus = Math.floor(frequency.scrabbleScore / 2);
    
    const totalScore = baseScore + rarityBonus + streakBonus + scrabbleBonus + timeBonus;
    
    return {
      word,
      frequency,
      score: baseScore,
      timeBonus,
      streakBonus,
      rarityBonus,
      totalScore,
      submittedAt: new Date().toISOString()
    };
  };

  // Get probability-filtered words for hints
  const getProbabilityFilteredWords = async (alphagram: string, minProb: number, maxProb: number): Promise<string[]> => {
    try {
      // This would typically query a dictionary with frequency data
      // For now, we'll return a filtered subset based on our frequency calculation
      const { data } = await supabase
        .from('words')
        .select('word')
        .ilike('word', `%${alphagram}%`)
        .limit(100);

      if (!data) return [];

      const filteredWords = data
        .map(item => item.word.toUpperCase())
        .filter(word => {
          const freq = getEnhancedWordFrequency(word);
          return freq.frequency >= minProb && freq.frequency <= maxProb;
        });

      return filteredWords;
    } catch (error) {
      console.error('Error fetching probability-filtered words:', error);
      return [];
    }
  };

  const createRace = async (settings: Partial<Race>): Promise<Race | null> => {
    if (!user) return null;
    
    setIsLoading(true);
    try {
      const raceData: Partial<Race> = {
        name: settings.name || `${user.user_metadata?.username || 'Anonymous'}'s Race`,
        type: settings.type || 'sprint',
        difficulty: settings.difficulty || 'medium',
        duration: settings.duration || 180,
        maxPlayers: settings.maxPlayers || 8,
        currentPlayers: 1,
        status: 'waiting',
        createdBy: user.id,
        isPublic: settings.isPublic ?? true,
        wordLength: settings.wordLength,
        rounds: settings.rounds || 10,
        probabilityMode: settings.probabilityMode ?? false,
        minProbability: settings.minProbability ?? 0,
        maxProbability: settings.maxProbability ?? 100,
        settings: {
          allowHints: false,
          showProgress: true,
          enableChat: true,
          pointsPerWord: 10,
          timeBonus: true,
          difficultyMultiplier: 1,
          probabilityScoring: true,
          bonusForRareWords: true,
          streakMultiplier: true,
          ...settings.settings
        }
      };
      
      // Generate alphagrams
      raceData.alphagrams = generateAlphagrams(
        raceData.rounds!,
        raceData.difficulty!,
        raceData.wordLength,
        raceData.probabilityMode
      );

      // Map our enhanced race data to the existing database schema
      const dbRaceData = {
        creator_id: raceData.createdBy,
        alphagram: raceData.alphagrams?.[0] || 'AERT', // Use first alphagram for now
        word_length: raceData.wordLength,
        duration_seconds: raceData.duration,
        max_participants: raceData.maxPlayers,
        status: raceData.status,
        // Add new fields if they exist in the database
        ...(raceData.isPublic !== undefined && { is_public: raceData.isPublic }),
        ...(raceData.name && { name: raceData.name }),
        ...(raceData.type && { type: raceData.type }),
        ...(raceData.difficulty && { difficulty: raceData.difficulty }),
        ...(raceData.rounds && { rounds: raceData.rounds }),
        ...(raceData.probabilityMode !== undefined && { probability_mode: raceData.probabilityMode }),
        ...(raceData.minProbability && { min_probability: raceData.minProbability }),
        ...(raceData.maxProbability && { max_probability: raceData.maxProbability }),
      };

      const { data, error } = await supabase
        .from('races')
        .insert([dbRaceData])
        .select()
        .single();

      if (error) {
        console.error('Race creation error:', error);
        throw error;
      }

      if (!data) {
        throw new Error('No race data returned from database');
      }

      // Transform database race to our Race interface
      const race: Race = {
        id: data.id,
        name: data.name || raceData.name!,
        type: data.type || raceData.type!,
        difficulty: data.difficulty || raceData.difficulty!,
        duration: data.duration_seconds || raceData.duration!,
        maxPlayers: data.max_participants || raceData.maxPlayers!,
        currentPlayers: 0, // Will be updated when creator joins
        status: data.status || raceData.status!,
        createdBy: data.creator_id,
        createdAt: data.created_at,
        isPublic: data.is_public ?? raceData.isPublic!,
        wordLength: data.word_length || raceData.wordLength,
        rounds: data.rounds || raceData.rounds!,
        alphagrams: raceData.alphagrams!,
        probabilityMode: data.probability_mode ?? raceData.probabilityMode!,
        minProbability: data.min_probability ?? raceData.minProbability!,
        maxProbability: data.max_probability ?? raceData.maxProbability!,
        settings: raceData.settings!
      };

      console.log('Created race:', race);
      setCurrentRace(race);
      
      // Auto-join the creator
      const joinSuccess = await joinRace(race.id);
      if (!joinSuccess) {
        console.error('Failed to auto-join creator to race');
        // Don't throw error, race was created successfully
      }
      
      toast({
        title: "Race Created!",
        description: `Your ${race.type} race is ready. Share the race ID: ${race.id}`,
        variant: "default",
      });
      
      return race;
    } catch (error) {
      console.error('Error creating race:', error);
      toast({
        title: "Error",
        description: "Failed to create race. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const joinRace = async (raceId: string): Promise<boolean> => {
    if (!user) {
      console.error('No user found');
      toast({
        title: "Authentication Required",
        description: "Please log in to join races.",
        variant: "destructive",
      });
      return false;
    }

    try {
      console.log('Joining race:', raceId);
      
      // First, check if the race exists and get its details
      const { data: race, error: raceError } = await supabase
        .from('races')
        .select('*')
        .eq('id', raceId)
        .single();

      if (raceError || !race) {
        console.error('Race not found:', raceError);
        toast({
          title: "Race Not Found",
          description: "This race may have ended or been removed.",
          variant: "destructive",
        });
        return false;
      }

      // Check if user is already a participant
      const { data: existingParticipant, error: participantCheckError } = await supabase
        .from('race_participants')
        .select('*')
        .eq('race_id', raceId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (participantCheckError) {
        console.error('Error checking existing participant:', participantCheckError);
        toast({
          title: "Error",
          description: "Failed to check race status. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      if (existingParticipant) {
        console.log('User already joined race');
        // User is already a participant, load the race data
        await loadRaceData(raceId, race);
        return true;
      }

      // Check if race is full
      const { data: participants, error: participantsError } = await supabase
        .from('race_participants')
        .select('*')
        .eq('race_id', raceId);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        toast({
          title: "Error",
          description: "Failed to check race capacity. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      const currentPlayerCount = participants?.length || 0;
      const maxPlayers = race.max_participants || 8;

      console.log('Player count:', currentPlayerCount, 'Max:', maxPlayers);

      if (currentPlayerCount >= maxPlayers) {
        toast({
          title: "Race Full",
          description: "This race is already full.",
          variant: "destructive",
        });
        return false;
      }

      // Check if race is still accepting participants
      if (race.status !== 'waiting') {
        toast({
          title: "Race Already Started",
          description: "This race has already started and is no longer accepting participants.",
          variant: "destructive",
        });
        return false;
      }

      // Add participant
      console.log('Adding participant...');
      const participantData = {
        race_id: raceId,
        user_id: user.id,
        username: user.user_metadata?.username || 'Anonymous',
        score: 0,
        is_ready: false
      };

      console.log('Participant data:', participantData);

      const { data: newParticipant, error: participantError } = await supabase
        .from('race_participants')
        .insert(participantData)
        .select()
        .single();

      if (participantError) {
        console.error('Participant insert error:', participantError);
        console.error('Error details:', {
          code: participantError.code,
          message: participantError.message,
          details: participantError.details,
          hint: participantError.hint
        });
        
        // Handle specific error cases
        if (participantError.code === '23505') {
          // Unique constraint violation - user already joined
          console.log('User already joined race (unique constraint)');
          await loadRaceData(raceId, race);
          return true;
        }
        
        if (participantError.code === '23503') {
          // Foreign key constraint violation
          console.log('Foreign key constraint violation');
          toast({
            title: "Race Not Found",
            description: "The race you're trying to join no longer exists.",
            variant: "destructive",
          });
          return false;
        }

        if (participantError.code === '42501') {
          // Insufficient privileges
          console.log('Insufficient privileges to join race');
          toast({
            title: "Permission Denied",
            description: "You don't have permission to join this race.",
            variant: "destructive",
          });
          return false;
        }
        
        // Generic error handling
        console.log('Generic participant insert error');
        console.log('Full error object:', JSON.stringify(participantError, null, 2));
        toast({
          title: "Join Failed",
          description: `Failed to join race: ${participantError.message || 'Unknown error'}`,
          variant: "destructive",
        });
        return false;
      }

      console.log('Successfully added participant:', newParticipant);

      // Verify the participant was added
      if (!newParticipant) {
        console.error('No participant data returned after insert');
        toast({
          title: "Join Failed",
          description: "Failed to join race. Please try again.",
          variant: "destructive",
        });
        return false;
      }

      // Load the complete race data
      await loadRaceData(raceId, race);
      
      toast({
        title: "Joined Race!",
        description: `You've joined the ${race.name || 'Anagram Race'}.`,
        variant: "default",
      });
      
      return true;
    } catch (error) {
      console.error('Error joining race:', error);
      toast({
        title: "Error",
        description: "Failed to join race. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Helper function to load complete race data
  const loadRaceData = async (raceId: string, raceData: any) => {
    try {
      // Fetch all participants for this race
      const { data: participants, error: participantsError } = await supabase
        .from('race_participants')
        .select('*')
        .eq('race_id', raceId);

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return;
      }

      // Find current user's participant data
      const myParticipantData = participants?.find(p => p.user_id === user?.id);

      // Transform database race to our Race interface
      const transformedRace: Race = {
        id: raceData.id,
        name: raceData.name || `Race ${raceData.id}`,
        type: raceData.type || 'sprint',
        difficulty: raceData.difficulty || 'medium',
        duration: raceData.duration_seconds || 180,
        maxPlayers: raceData.max_participants || 8,
        currentPlayers: participants?.length || 0,
        status: raceData.status || 'waiting',
        createdBy: raceData.creator_id,
        createdAt: raceData.created_at,
        isPublic: raceData.is_public !== false,
        wordLength: raceData.word_length,
        rounds: raceData.rounds || 10,
        alphagrams: raceData.alphagram ? [raceData.alphagram] : ['AERT'],
        probabilityMode: raceData.probability_mode || false,
        minProbability: raceData.min_probability || 0,
        maxProbability: raceData.max_probability || 100,
        settings: {
          allowHints: false,
          showProgress: true,
          enableChat: true,
          pointsPerWord: 10,
          timeBonus: true,
          difficultyMultiplier: 1,
          probabilityScoring: true,
          bonusForRareWords: true,
          streakMultiplier: true,
        }
      };

      // Transform participant data
      const transformedParticipants = participants?.map(p => ({
        id: p.id,
        raceId: p.race_id,
        userId: p.user_id,
        username: p.username || 'Anonymous',
        score: p.score || 0,
        wordsFound: p.words_found || 0,
        currentRound: p.current_round || 0,
        isReady: p.is_ready || false,
        joinedAt: p.joined_at,
        finishedAt: p.finished_at,
        streak: p.streak || 0,
        averageWordScore: p.average_word_score || 0,
        rareWordsFound: p.rare_words_found || 0,
      })) || [];

      // Set state
      setCurrentRace(transformedRace);
      setParticipants(transformedParticipants);
      
      if (myParticipantData) {
        setMyParticipant({
          id: myParticipantData.id,
          raceId: myParticipantData.race_id,
          userId: myParticipantData.user_id,
          username: myParticipantData.username || 'Anonymous',
          score: myParticipantData.score || 0,
          wordsFound: myParticipantData.words_found || 0,
          currentRound: myParticipantData.current_round || 0,
          isReady: myParticipantData.is_ready || false,
          joinedAt: myParticipantData.joined_at,
          finishedAt: myParticipantData.finished_at,
          streak: myParticipantData.streak || 0,
          averageWordScore: myParticipantData.average_word_score || 0,
          rareWordsFound: myParticipantData.rare_words_found || 0,
        });
      }

      // Subscribe to real-time updates
      subscribeToRace(raceId);
      
      console.log('Race data loaded successfully:', {
        race: transformedRace,
        participants: transformedParticipants,
        myParticipant: myParticipantData
      });
    } catch (error) {
      console.error('Error loading race data:', error);
    }
  };

  const leaveRace = async (raceId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      await supabase
        .from('race_participants')
        .delete()
        .eq('race_id', raceId)
        .eq('user_id', user.id);

      // Update race player count
      const { data: race } = await supabase
        .from('races')
        .select('current_players')
        .eq('id', raceId)
        .single();

      if (race) {
        await supabase
          .from('races')
          .update({ current_players: Math.max(0, race.current_players - 1) })
          .eq('id', raceId);
      }

      setCurrentRace(null);
      setParticipants([]);
      setMyParticipant(null);
      setMySubmissions([]);
      unsubscribeFromRace();
      
      return true;
    } catch (error) {
      console.error('Error leaving race:', error);
      return false;
    }
  };

  const startRace = async (raceId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('races')
        .update({ 
          status: 'active',
          start_time: new Date().toISOString()
        })
        .eq('id', raceId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error starting race:', error);
      return false;
    }
  };

  const submitWord = async (word: string, roundIndex: number): Promise<WordSubmission | null> => {
    if (!user || !currentRace || !myParticipant) return null;
    
    try {
      // Calculate score with probability-based bonuses
      const timeBonus = currentRace.settings.timeBonus ? Math.floor(Math.random() * 5) : 0; // Simplified time bonus
      const submission = calculateWordScore(word, timeBonus, myParticipant.streak);
      
      // Validate word exists in dictionary
      const { data: wordData } = await supabase
        .from('words')
        .select('word')
        .eq('word', word.toUpperCase())
        .single();

      if (!wordData) {
        toast({
          title: "Invalid Word",
          description: "This word is not in our dictionary.",
          variant: "destructive",
        });
        return null;
      }

      // Check if word is valid for current alphagram
      const currentAlphagram = currentRace.alphagrams[roundIndex];
      if (!isValidAnagram(word, currentAlphagram)) {
        toast({
          title: "Invalid Anagram",
          description: "This word is not a valid anagram of the given letters.",
          variant: "destructive",
        });
        return null;
      }

      // Check if word was already submitted
      const alreadySubmitted = mySubmissions.some(sub => sub.word === word.toUpperCase());
      if (alreadySubmitted) {
        toast({
          title: "Already Submitted",
          description: "You've already submitted this word.",
          variant: "destructive",
        });
        return null;
      }

      // Save submission
      const { error } = await supabase
        .from('race_words')
        .insert([{
          race_id: currentRace.id,
          user_id: user.id,
          word: word.toUpperCase(),
          round_index: roundIndex,
          score: submission.totalScore,
          frequency: submission.frequency.frequency,
          submitted_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Update local state
      setMySubmissions(prev => [...prev, submission]);
      
      // Update participant stats
      const newStreak = myParticipant.streak + 1;
      const newScore = myParticipant.score + submission.totalScore;
      const newWordsFound = myParticipant.wordsFound + 1;
      const newRareWordsFound = submission.frequency.frequency < 30 ? myParticipant.rareWordsFound + 1 : myParticipant.rareWordsFound;
      
      setMyParticipant(prev => prev ? {
        ...prev,
        score: newScore,
        wordsFound: newWordsFound,
        streak: newStreak,
        rareWordsFound: newRareWordsFound,
        averageWordScore: Math.round(newScore / newWordsFound)
      } : null);

      // Update database
      await supabase
        .from('race_participants')
        .update({
          score: newScore,
          words_found: newWordsFound,
          streak: newStreak,
          rare_words_found: newRareWordsFound,
          average_word_score: Math.round(newScore / newWordsFound)
        })
        .eq('race_id', currentRace.id)
        .eq('user_id', user.id);

      toast({
        title: "Word Submitted!",
        description: `+${submission.totalScore} points! ${submission.frequency.frequency < 30 ? 'Rare word bonus!' : ''}`,
        variant: "default",
      });

      return submission;
    } catch (error) {
      console.error('Error submitting word:', error);
      toast({
        title: "Error",
        description: "Failed to submit word. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Helper function to check if word is valid anagram
  const isValidAnagram = (word: string, alphagram: string): boolean => {
    const sortedWord = word.toUpperCase().split('').sort().join('');
    const sortedAlphagram = alphagram.split('').sort().join('');
    return sortedWord === sortedAlphagram;
  };

  const nextRound = async (): Promise<boolean> => {
    if (!user || !currentRace || !myParticipant) return false;
    
    try {
      // Note: current_round column may not exist in database yet
      // For now, we'll track rounds locally
      console.log('Advancing to round:', myParticipant.currentRound + 1);
      
      // Reset streak for new round
      setMyParticipant(prev => prev ? { ...prev, streak: 0 } : null);
      setMySubmissions([]);
      
      return true;
    } catch (error) {
      console.error('Error advancing round:', error);
      return false;
    }
  };

  const finishRace = async (): Promise<RaceResult | null> => {
    if (!user || !currentRace || !myParticipant) return null;
    
    try {
      const result: Partial<RaceResult> = {
        raceId: currentRace.id,
        userId: user.id,
        finalScore: myParticipant.score,
        wordsFound: myParticipant.wordsFound,
        streak: myParticipant.streak,
        rareWordsFound: myParticipant.rareWordsFound,
        averageWordScore: myParticipant.averageWordScore,
        completedAt: new Date().toISOString()
      };

      // Map to database schema
      const dbResult = {
        race_id: result.raceId,
        user_id: result.userId,
        final_score: result.finalScore,
        words_found: result.wordsFound,
        streak: result.streak,
        rare_words_found: result.rareWordsFound,
        average_word_score: result.averageWordScore,
        completed_at: result.completedAt
      };

      const { data, error } = await supabase
        .from('race_results')
        .insert([dbResult])
        .select()
        .single();

      if (error) throw error;
      return data as RaceResult;
    } catch (error) {
      console.error('Error finishing race:', error);
      return null;
    }
  };

  const subscribeToRace = (raceId: string) => {
    // Real-time subscription logic would go here
    // For now, we'll use polling
  };

  const unsubscribeFromRace = () => {
    // Cleanup subscription
  };

  const fetchAvailableRaces = async () => {
    try {
      console.log('Fetching available races...');
      // Query with existing database schema
      const { data, error } = await supabase
        .from('races')
        .select('*')
        .eq('status', 'waiting')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching races:', error);
        throw error;
      }
      
      console.log('Fetched races:', data);
      
      // Transform database data to our Race interface
      const transformedRaces = (data || []).map(dbRace => ({
        id: dbRace.id,
        name: dbRace.name || `Race ${dbRace.id}`,
        type: dbRace.type || 'sprint',
        difficulty: dbRace.difficulty || 'medium',
        duration: dbRace.duration_seconds || 180,
        maxPlayers: dbRace.max_participants || 8,
        currentPlayers: dbRace.current_players || 0,
        status: dbRace.status || 'waiting',
        createdBy: dbRace.creator_id,
        createdAt: dbRace.created_at,
        isPublic: dbRace.is_public !== false, // Default to true if not specified
        wordLength: dbRace.word_length,
        rounds: dbRace.rounds || 10,
        alphagrams: dbRace.alphagram ? [dbRace.alphagram] : ['AERT'],
        probabilityMode: dbRace.probability_mode || false,
        minProbability: dbRace.min_probability || 0,
        maxProbability: dbRace.max_probability || 100,
        settings: {
          allowHints: false,
          showProgress: true,
          enableChat: true,
          pointsPerWord: 10,
          timeBonus: true,
          difficultyMultiplier: 1,
          probabilityScoring: true,
          bonusForRareWords: true,
          streakMultiplier: true,
        }
      }));
      
      setAvailableRaces(transformedRaces);
    } catch (error) {
      console.error('Error fetching races:', error);
    }
  };

  const getRaceResults = async (raceId: string): Promise<RaceResult[]> => {
    try {
      const { data, error } = await supabase
        .from('race_results')
        .select('*')
        .eq('race_id', raceId)
        .order('final_score', { ascending: false });

      if (error) throw error;
      
      // Transform database results to our RaceResult interface
      const transformedResults = (data || []).map(dbResult => ({
        raceId: dbResult.race_id,
        userId: dbResult.user_id,
        finalScore: dbResult.final_score,
        wordsFound: dbResult.words_found,
        averageTime: dbResult.average_time || 0,
        rank: dbResult.rank || 0,
        completedAt: dbResult.completed_at,
        streak: dbResult.streak || 0,
        rareWordsFound: dbResult.rare_words_found || 0,
        averageWordScore: dbResult.average_word_score || 0,
      }));
      
      return transformedResults;
    } catch (error) {
      console.error('Error fetching race results:', error);
      return [];
    }
  };

  // Function to load race data without joining (for direct navigation)
  const loadRace = async (raceId: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      console.log('Loading race data:', raceId);
      
      // Check if the race exists
      const { data: race, error: raceError } = await supabase
        .from('races')
        .select('*')
        .eq('id', raceId)
        .single();

      if (raceError || !race) {
        console.error('Race not found:', raceError);
        return false;
      }

      // Check if user is a participant
      const { data: participant, error: participantError } = await supabase
        .from('race_participants')
        .select('*')
        .eq('race_id', raceId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (participantError) {
        console.error('Error checking participant status:', participantError);
        return false;
      }

      if (!participant) {
        console.log('User is not a participant in this race');
        return false;
      }

      // Load the race data
      await loadRaceData(raceId, race);
      return true;
    } catch (error) {
      console.error('Error loading race:', error);
      return false;
    }
  };

  return (
    <RaceContext.Provider value={{
      currentRace,
      participants,
      myParticipant,
      availableRaces,
      isLoading,
      mySubmissions,
      createRace,
      joinRace,
      leaveRace,
      startRace,
      submitWord,
      nextRound,
      finishRace,
      subscribeToRace,
      unsubscribeFromRace,
      fetchAvailableRaces,
      getRaceResults,
      calculateWordScore,
      getProbabilityFilteredWords: getProbabilityFilteredWords,
      loadRace: loadRace,
    }}>
      {children}
    </RaceContext.Provider>
  );
};

export const useRace = () => {
  const context = useContext(RaceContext);
  if (!context) {
    throw new Error('useRace must be used within a RaceProvider');
  }
  return context;
};