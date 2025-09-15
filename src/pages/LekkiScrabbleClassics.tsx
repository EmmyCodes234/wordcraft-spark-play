import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { MapPin, Calendar, Clock, Trophy, Users, Star, Award } from 'lucide-react';

export default function LekkiScrabbleClassics() {
  const tournamentDetails = {
    title: "LEKKI SCRABBLE CLASSICS '25",
    starPrize: "₦1,000,000 + TROPHY",
    location: "PENINSULA HOTEL & TOWERS, PLOT 16, THE PROVIDENCE, LEKKI, LAGOS",
    dates: "SEPTEMBER 27 - 28, 2025",
    time: "8:30AM",
    totalGames: 18,
    lexicon: "CSW24",
    ratings: "NSF/PANASA/WESPA",
    maxPlayers: 120,
    registrationDeadline: "SEPTEMBER 20, 2025",
    categories: [
      {
        name: "Premier",
        divisions: [
          { rating: "1400 - 2000", prize: "₦30,000" },
          { rating: "1300 - 1399", prize: "₦20,000" }
        ]
      },
      {
        name: "Championship", 
        divisions: [
          { rating: "1200 - 1299", prize: "₦20,000" },
          { rating: "000 - 1199", prize: "₦15,000" }
        ]
      }
    ],
    requirements: [
      "ALL PLAYERS MUST BE NSF-LICENSED",
      "MAXIMUM PLAYER CAPACITY OF 120",
      "REGISTRATION CLOSES ON SEPTEMBER 20, 2025"
    ],
    sponsors: [
      "AGPC", "PANASA", "FRONT PAGE", "NSF", "ELCREST", 
      "JULYET PETERS", "MINIGAMES INCORPORATED"
    ]
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white">
      {/* Background Bridge Image Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-900/20 to-slate-900/40"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-6">
            <div className="text-black font-bold text-lg">S</div>
          </div>
          <h1 className="text-6xl font-bold text-green-400 mb-4 leading-tight">
            LEKKI<br />
            SCRABBLE<br />
            CLASSICS '25
          </h1>
        </div>

        {/* Star Prize */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="relative inline-block">
            <div className="bg-white text-black px-8 py-4 rounded-lg text-2xl font-bold">
              ₦1,000,000 + TROPHY
            </div>
            <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 text-sm font-bold rounded-lg transform rotate-12">
              STAR PRIZE
            </div>
          </div>
        </motion.div>

        {/* Event Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Location & Dates */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-green-400" />
                  <div>
                    <h3 className="font-semibold text-lg">Location</h3>
                    <p className="text-sm text-gray-300">{tournamentDetails.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-green-400" />
                  <div>
                    <h3 className="font-semibold text-lg">Dates</h3>
                    <p className="text-sm text-gray-300">{tournamentDetails.dates}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-green-400" />
                  <div>
                    <h3 className="font-semibold text-lg">Start Time</h3>
                    <p className="text-sm text-gray-300">{tournamentDetails.time}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tournament Format */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 text-green-400">Tournament Format</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Games:</span>
                  <span className="text-green-400 font-semibold">{tournamentDetails.totalGames}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lexicon:</span>
                  <span className="text-green-400 font-semibold">{tournamentDetails.lexicon}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ratings:</span>
                  <span className="text-green-400 font-semibold">{tournamentDetails.ratings}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Players:</span>
                  <span className="text-green-400 font-semibold">{tournamentDetails.maxPlayers}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prize Categories */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-green-400 text-xl">Prize Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tournamentDetails.categories.map((category, index) => (
                <motion.div
                  key={category.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-3"
                >
                  <h4 className="font-semibold text-lg text-white">{category.name}</h4>
                  {category.divisions.map((division, divIndex) => (
                    <div key={divIndex} className="flex justify-between items-center bg-slate-700/50 p-3 rounded">
                      <span className="text-sm">{division.rating}</span>
                      <span className="text-green-400 font-semibold">{division.prize}</span>
                    </div>
                  ))}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="bg-slate-800/50 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-red-400 text-xl">Important Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tournamentDetails.requirements.map((requirement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  <span className="text-sm">{requirement}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Registration Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-8"
        >
          <Button 
            size="lg" 
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg font-bold"
          >
            <Trophy className="mr-2 h-5 w-5" />
            REGISTER NOW
          </Button>
          <p className="text-sm text-gray-400 mt-2">
            Registration closes on {tournamentDetails.registrationDeadline}
          </p>
        </motion.div>

        {/* Sponsors */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-center text-gray-400">SPONSORS/PARTNERS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-center gap-4">
              {tournamentDetails.sponsors.map((sponsor, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {sponsor}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
