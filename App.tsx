
import React, { useState, useEffect } from 'react';
import { GamePhase, GameState, Player, Category, Language } from './types';
import { fetchSecretWord } from './services/geminiService';
import { Button } from './components/Button';
import { UserIcon, UsersIcon, FilmIcon, TvIcon, StarIcon, TrophyIcon, EyeIcon, EyeOffIcon } from './components/Icons';

// --- Translations ---
const TRANSLATIONS = {
  en: {
    title: "Gozlan",
    subtitle: "Social Deduction Game",
    squadSize: "Squad Size",
    topic: "The Topic",
    startGame: "Start Game",
    playerPlaceholder: "Name",
    categories: {
      [Category.MOVIES]: "Movies",
      [Category.TV_SHOWS]: "TV Shows",
      [Category.TV_ACTORS]: "Characters",
      [Category.FOOTBALL_PLAYERS]: "Football",
    },
    loading: "Shuffling...",
    turn: "Turn",
    last: "Last",
    passDevice: "Pass Device To",
    tapReveal: "Tap to Reveal",
    secretIdentity: "Secret Identity",
    impostor: "IMPOSTOR",
    innocent: "INNOCENT",
    missionTitle: "Your Mission",
    missionDesc: "Blend in & don't get caught!",
    secretTitle: "The Secret",
    hideNext: "Hide & Next Player",
    everyoneReady: "Everyone Ready?",
    discussTitle: "Discuss!",
    discussDesc: "Find the liar among you.",
    whoConfused: "Who seems confused?",
    secretWas: "The secret word is:",
    reveal: "Reveal Impostor",
    busted: "Busted!",
    wasImpostor: "was the impostor",
    playAgain: "Play Again",
    backMenu: "Back to Menu",
    categoryLabel: "Category"
  },
  he: {
    title: "גוזלן",
    subtitle: "משחק בילוש חברתי",
    squadSize: "מספר שחקנים",
    topic: "הקטגוריה",
    startGame: "התחל משחק",
    playerPlaceholder: "שם",
    categories: {
      [Category.MOVIES]: "סרטים",
      [Category.TV_SHOWS]: "סדרות",
      [Category.TV_ACTORS]: "דמויות",
      [Category.FOOTBALL_PLAYERS]: "כדורגל",
    },
    loading: "מערבב...",
    turn: "תור",
    last: "אחרון",
    passDevice: "העבר מכשיר ל",
    tapReveal: "לחץ לחשיפה",
    secretIdentity: "זהות סודית",
    impostor: "מתחזה",
    innocent: "חף מפשע",
    missionTitle: "המשימה שלך",
    missionDesc: "השתלב ואל תיתפס!",
    secretTitle: "המילה הסודית",
    hideNext: "הסתר והעבר שחקן",
    everyoneReady: "כולם מוכנים?",
    discussTitle: "הדיון!",
    discussDesc: "מצאו את השקרן ביניכם.",
    whoConfused: "מי נראה מבולבל?",
    secretWas: "המילה הסודית היא:",
    reveal: "חשוף את המתחזה",
    busted: "נתפס!",
    wasImpostor: "היה המתחזה",
    playAgain: "שחק שוב",
    backMenu: "תפריט ראשי",
    categoryLabel: "קטגוריה"
  }
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    phase: GamePhase.SETUP,
    players: [],
    category: Category.MOVIES,
    secretWord: '',
    currentPlayerIndex: 0,
    impostorIndex: -1,
    roundCount: 1,
  });

  const [language, setLanguage] = useState<Language>('en');
  const [playerCount, setPlayerCount] = useState(3);
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2', 'Player 3']);
  const [showRole, setShowRole] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Track used words per category to avoid repetition
  const [usedWords, setUsedWords] = useState<Record<Category, string[]>>({
    [Category.MOVIES]: [],
    [Category.TV_SHOWS]: [],
    [Category.TV_ACTORS]: [],
    [Category.FOOTBALL_PLAYERS]: [],
  });

  const t = TRANSLATIONS[language];
  const isRTL = language === 'he';

  // -- Effects --
  useEffect(() => {
    // Update body dir based on language
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRTL]);

  // -- Handlers --

  const updatePlayerCount = (delta: number) => {
    const newCount = Math.max(3, Math.min(20, playerCount + delta));
    if (newCount === playerCount) return;

    setPlayerCount(newCount);
    setPlayerNames(prev => {
      if (newCount > prev.length) {
        const addedCount = newCount - prev.length;
        const newEntries = Array.from({ length: addedCount }, (_, i) => 
          language === 'he' ? `שחקן ${prev.length + i + 1}` : `Player ${prev.length + i + 1}`
        );
        return [...prev, ...newEntries];
      } else {
        return prev.slice(0, newCount);
      }
    });
  };

  const handleNameChange = (index: number, value: string) => {
    const newNames = [...playerNames];
    newNames[index] = value;
    setPlayerNames(newNames);
  };

  const transitionTo = (fn: () => void) => {
    setIsTransitioning(true);
    setTimeout(() => {
      fn();
      setIsTransitioning(false);
    }, 400);
  };

  const getSecretWord = async (cat: Category) => {
    const previouslyUsed = usedWords[cat];
    const secret = await fetchSecretWord(cat, previouslyUsed);
    
    // Update used words
    setUsedWords(prev => ({
      ...prev,
      [cat]: [...prev[cat], secret]
    }));
    
    return secret;
  };

  const startGame = async () => {
    setGameState(prev => ({ ...prev, phase: GamePhase.FETCHING }));
    
    const newPlayers: Player[] = playerNames.map((name, i) => ({
      id: i,
      name: name.trim() || (language === 'he' ? `שחקן ${i + 1}` : `Player ${i + 1}`),
      isImpostor: false,
    }));

    const impostorIdx = Math.floor(Math.random() * playerCount);
    newPlayers[impostorIdx].isImpostor = true;

    try {
      const secret = await getSecretWord(gameState.category);
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          players: newPlayers,
          secretWord: secret,
          impostorIndex: impostorIdx,
          currentPlayerIndex: 0,
          phase: GamePhase.TURN_REVEAL,
        }));
      }, 2000);
    } catch (e) {
      console.error("Failed to start game", e);
      setGameState(prev => ({ ...prev, phase: GamePhase.SETUP }));
    }
  };

  const nextPlayer = () => {
    setShowRole(false);
    setTimeout(() => {
      transitionTo(() => {
        if (gameState.currentPlayerIndex < gameState.players.length - 1) {
          setGameState(prev => ({ ...prev, currentPlayerIndex: prev.currentPlayerIndex + 1 }));
        } else {
          setGameState(prev => ({ ...prev, phase: GamePhase.DISCUSSION }));
        }
      });
    }, 300);
  };

  const startNewRound = () => {
    setGameState(prev => ({ ...prev, phase: GamePhase.FETCHING, roundCount: prev.roundCount + 1 }));
    
    const newPlayers = gameState.players.map(p => ({ ...p, isImpostor: false }));
    const impostorIdx = Math.floor(Math.random() * newPlayers.length);
    newPlayers[impostorIdx].isImpostor = true;

    getSecretWord(gameState.category).then(secret => {
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          players: newPlayers,
          secretWord: secret,
          impostorIndex: impostorIdx,
          currentPlayerIndex: 0,
          phase: GamePhase.TURN_REVEAL,
        }));
      }, 2000);
    });
  };

  const resetGame = () => {
    setGameState({
      phase: GamePhase.SETUP,
      players: [],
      category: Category.MOVIES,
      secretWord: '',
      currentPlayerIndex: 0,
      impostorIndex: -1,
      roundCount: 1,
    });
    // We do NOT reset usedWords here so users can play multiple games in session without repeat
    // unless they refresh the page.
    setPlayerCount(3);
    setPlayerNames(Array.from({length: 3}, (_, i) => language === 'he' ? `שחקן ${i + 1}` : `Player ${i + 1}`));
  };

  // -- Render Components --

  const LanguageToggle = () => (
    <button 
      onClick={() => setLanguage(prev => prev === 'en' ? 'he' : 'en')}
      className="fixed top-4 right-4 z-50 bg-white/50 backdrop-blur-md border border-white/50 shadow-sm rounded-full px-3 py-1.5 flex items-center gap-2 transition-transform hover:scale-105"
      dir="ltr"
    >
      <span className="text-lg leading-none">{language === 'en' ? '🇺🇸' : '🇮🇱'}</span>
      <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{language === 'en' ? 'EN' : 'HE'}</span>
    </button>
  );

  const renderSetup = () => {
    const categories = [
      { id: Category.MOVIES, label: t.categories[Category.MOVIES], icon: <FilmIcon />, color: "text-blue-500", bg: "bg-blue-50" },
      { id: Category.TV_SHOWS, label: t.categories[Category.TV_SHOWS], icon: <TvIcon />, color: "text-purple-500", bg: "bg-purple-50" },
      { id: Category.TV_ACTORS, label: t.categories[Category.TV_ACTORS], icon: <StarIcon />, color: "text-amber-500", bg: "bg-amber-50" },
      { id: Category.FOOTBALL_PLAYERS, label: t.categories[Category.FOOTBALL_PLAYERS], icon: <TrophyIcon />, color: "text-emerald-500", bg: "bg-emerald-50" },
    ];

    return (
      <div className="w-full max-w-lg mx-auto p-4 pb-32 animate-pop-in">
        {/* Header */}
        <header className="text-center mb-10 mt-6 relative z-10">
          <h1 className="text-7xl font-display text-transparent bg-clip-text bg-gradient-to-r from-love-500 to-orange-400 drop-shadow-sm rotate-[-4deg] animate-float">
            {t.title}
          </h1>
          <div className="inline-block bg-white/60 backdrop-blur-sm px-4 py-1 rounded-full border border-white/50 shadow-sm mt-2 transform rotate-2">
            <p className="text-love-800 font-bold text-xs tracking-widest uppercase">{t.subtitle}</p>
          </div>
        </header>

        {/* Players Section */}
        <div className="glass-panel rounded-[2rem] p-6 mb-6 shadow-card relative overflow-hidden group">
          <div className={`absolute top-0 ${isRTL ? 'left-0' : 'right-0'} w-32 h-32 bg-gradient-to-br from-love-100 to-transparent rounded-bl-full opacity-50 ${isRTL ? '-ml-8' : '-mr-8'} -mt-8`}></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <span className="bg-love-100 text-love-600 p-2.5 rounded-xl shadow-inner">
                  <UsersIcon className="w-5 h-5" />
                </span>
                {t.squadSize}
              </h2>
            </div>
            
            <div className="flex items-center justify-between gap-4 mb-8 bg-slate-50 p-2 rounded-2xl border border-slate-100" dir="ltr">
              <button 
                onClick={() => updatePlayerCount(-1)}
                className="w-12 h-12 flex items-center justify-center bg-white text-slate-600 rounded-xl shadow-sm border border-slate-200 font-black text-2xl active:scale-90 transition-transform hover:text-love-500"
              >
                -
              </button>
              <div className="font-display text-4xl text-slate-800 tabular-nums">
                {playerCount}
              </div>
              <button 
                onClick={() => updatePlayerCount(1)}
                className="w-12 h-12 flex items-center justify-center bg-slate-800 text-white rounded-xl shadow-lg shadow-slate-300 font-black text-2xl active:scale-90 transition-transform hover:bg-black"
              >
                +
              </button>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
              {playerNames.map((name, index) => (
                <div key={index} className="flex items-center gap-3 animate-slide-up group/input" style={{animationDelay: `${index * 50}ms`}}>
                  <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-white border border-slate-100 text-slate-400 font-black text-sm flex items-center justify-center shadow-sm group-focus-within/input:bg-love-500 group-focus-within/input:text-white group-focus-within/input:border-love-500 transition-colors">
                    {index + 1}
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(index, e.target.value)}
                    className="flex-1 bg-white/50 border border-transparent border-b-slate-200 focus:border-b-love-500 focus:bg-white rounded-lg px-4 py-2.5 transition-all outline-none font-bold text-slate-700 placeholder-slate-300 text-lg"
                    placeholder={`${t.playerPlaceholder} ${index + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4 px-2">
           <span className="bg-amber-100 text-amber-600 p-2.5 rounded-xl shadow-inner">
              <StarIcon className="w-5 h-5" />
           </span>
           {t.topic}
        </h2>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setGameState(prev => ({ ...prev, category: cat.id }))}
              className={`
                relative p-4 rounded-[2rem] text-left transition-all duration-300 h-32 flex flex-col justify-between overflow-hidden group
                ${gameState.category === cat.id 
                  ? 'bg-white ring-4 ring-love-400 shadow-glow-love scale-[1.02]' 
                  : 'bg-white/80 hover:bg-white border-2 border-transparent hover:border-love-100 shadow-sm hover:shadow-md'}
              `}
            >
              <div className="flex justify-between items-start relative z-10">
                <div className={`
                  w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
                  ${cat.bg} ${cat.color}
                `}>
                  {cat.icon}
                </div>
                {gameState.category === cat.id && (
                   <div className="w-6 h-6 bg-love-500 rounded-full flex items-center justify-center animate-pop-in">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                   </div>
                )}
              </div>
              
              <span className={`font-black text-lg tracking-tight relative z-10 ${gameState.category === cat.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`}>
                {cat.label}
              </span>
            </button>
          ))}
        </div>

        {/* Floating Start Button */}
        <div className="fixed bottom-8 left-0 w-full px-6 z-40 flex justify-center">
          <div className="max-w-lg w-full">
            <Button 
              onClick={startGame} 
              size="xl" 
              fullWidth 
              className="shadow-glow-love hover:scale-105"
            >
              {t.startGame}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderLoading = () => (
    <div className="flex flex-col items-center justify-center h-screen w-full relative overflow-hidden">
      <div className="relative z-10 flex flex-col items-center animate-pop-in">
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 bg-gradient-to-tr from-love-400 to-orange-400 rounded-[2rem] rotate-6 animate-pulse opacity-40 blur-xl"></div>
          <div className="absolute inset-0 bg-white rounded-[2rem] shadow-2xl flex items-center justify-center animate-spin" style={{animationDuration: '3s'}}>
             <div className="text-4xl">🎲</div>
          </div>
        </div>
        <h2 className="text-4xl font-display text-slate-800 mb-2">{t.loading}</h2>
        <div className="flex gap-2">
          <div className="w-3 h-3 bg-love-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
          <div className="w-3 h-3 bg-love-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
          <div className="w-3 h-3 bg-love-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
        </div>
      </div>
    </div>
  );

  const renderTurnReveal = () => {
    const player = gameState.players[gameState.currentPlayerIndex];
    const totalPlayers = gameState.players.length;

    return (
      <div className={`flex flex-col h-screen w-full overflow-hidden relative transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
        
        {/* Top Bar */}
        <div className="pt-safe-top px-6 py-4 flex justify-between items-center z-10">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.turn}</span>
            <span className="font-display text-2xl text-slate-800">{gameState.currentPlayerIndex + 1} <span className="text-slate-300">/</span> {totalPlayers}</span>
          </div>
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-md border border-slate-100 font-bold text-slate-700">
            {totalPlayers - gameState.currentPlayerIndex - 1 > 0 ? `+${totalPlayers - gameState.currentPlayerIndex - 1}` : t.last}
          </div>
        </div>

        {/* Progress Line */}
        <div className="w-full px-6 mb-4">
          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden" dir="ltr">
             <div className="h-full bg-love-500 transition-all duration-500 ease-out" style={{ width: `${((gameState.currentPlayerIndex + 1) / totalPlayers) * 100}%` }}></div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 perspective-1000">
          
          {/* Flip Card Container */}
          <div className={`relative w-full max-w-sm aspect-[3/4] transition-transform duration-700 transform-style-3d cursor-pointer ${showRole ? 'rotate-y-180' : ''}`} onClick={() => !showRole && setShowRole(true)}>
            
            {/* FRONT of Card */}
            <div className="absolute inset-0 backface-hidden">
               <div className="h-full w-full bg-white rounded-[3rem] shadow-card border-4 border-white flex flex-col items-center justify-center p-8 relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-love-400 to-orange-400"></div>
                  
                  {/* Decorative Pattern */}
                  <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>

                  <div className="w-28 h-28 bg-slate-50 rounded-3xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-300">
                      <UserIcon className="w-14 h-14 text-slate-400" />
                  </div>
                  
                  <h3 className="text-slate-400 font-bold text-sm uppercase tracking-widest mb-2">{t.passDevice}</h3>
                  <h2 className="text-5xl font-display text-slate-800 text-center leading-tight mb-8 break-words max-w-full">
                    {player.name}
                  </h2>
                  
                  <div className="mt-auto flex flex-col items-center gap-2 animate-pulse-fast">
                    <span className="text-xs font-bold text-slate-400 uppercase">{t.tapReveal}</span>
                    <div className="w-12 h-1 bg-slate-200 rounded-full"></div>
                  </div>
               </div>
            </div>

            {/* BACK of Card */}
            <div className="absolute inset-0 backface-hidden rotate-y-180">
               <div className={`
                  h-full w-full rounded-[3rem] shadow-card border-[6px] border-white flex flex-col items-center justify-center p-8 relative overflow-hidden
                  ${player.isImpostor 
                    ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white' 
                    : 'bg-gradient-to-br from-love-500 to-orange-400 text-white'}
               `}>
                  <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

                  <div className="relative z-10 flex flex-col items-center w-full h-full justify-between py-6">
                    <div className="bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-sm border border-white/10">
                      {t.secretIdentity}
                    </div>
                    
                    <div className="flex flex-col items-center">
                      {player.isImpostor ? (
                        <>
                          <div className="w-32 h-32 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-xl rotate-3 animate-float text-red-500">
                            <EyeIcon className="w-16 h-16" />
                          </div>
                          <h3 className="text-5xl font-display mb-2 drop-shadow-md tracking-wide">{t.impostor}</h3>
                        </>
                      ) : (
                        <>
                           <div className="w-32 h-32 bg-white rounded-[2rem] flex items-center justify-center mb-6 shadow-xl -rotate-3 animate-float text-orange-500">
                            <StarIcon className="w-16 h-16" />
                          </div>
                          <h3 className="text-5xl font-display mb-2 drop-shadow-md tracking-wide">{t.innocent}</h3>
                        </>
                      )}
                    </div>

                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 w-full text-center shadow-lg transform translate-y-2">
                       {player.isImpostor ? (
                          <>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t.missionTitle}</p>
                            <p className="text-slate-800 font-bold text-lg leading-tight">{t.missionDesc}</p>
                            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-500">
                              <span>{t.categoryLabel}</span>
                              <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded">{t.categories[gameState.category]}</span>
                            </div>
                          </>
                       ) : (
                          <>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{t.secretTitle}</p>
                            <p className="text-3xl font-black text-love-600 leading-tight break-words" dir="ltr">{gameState.secretWord}</p>
                          </>
                       )}
                    </div>
                  </div>
               </div>
            </div>

          </div>

          {/* Action Button - Only visible when revealed */}
          <div className={`absolute bottom-8 left-0 w-full px-6 transition-all duration-500 transform ${showRole ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
             <Button onClick={nextPlayer} variant="secondary" fullWidth size="xl" className="shadow-xl bg-white/90 backdrop-blur border-none">
                {gameState.currentPlayerIndex < gameState.players.length - 1 ? t.hideNext : t.everyoneReady}
             </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderDiscussion = () => (
    <div className="flex flex-col items-center justify-center h-screen w-full p-6 animate-pop-in relative overflow-hidden">
      
      <div className="w-full max-w-md text-center space-y-10 relative z-10">
        
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-love-500 blur-2xl opacity-20 animate-pulse"></div>
          <div className="relative inline-flex items-center justify-center w-32 h-32 bg-white rounded-[2.5rem] shadow-card mb-4 -rotate-6 ring-8 ring-white/50">
             <UsersIcon className="w-16 h-16 text-love-500" />
          </div>
          <div className={`absolute -top-4 ${isRTL ? '-left-4' : '-right-4'} bg-orange-500 text-white w-12 h-12 flex items-center justify-center rounded-full font-black text-xl shadow-lg animate-bounce`}>
            ?
          </div>
        </div>
        
        <div>
          <h2 className="text-6xl font-display text-slate-900 drop-shadow-sm mb-2">{t.discussTitle}</h2>
          <p className="text-slate-500 font-medium text-lg">{t.discussDesc}</p>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-8 shadow-card border border-white transform rotate-1">
          <p className="text-slate-600 text-2xl leading-relaxed font-black mb-2">
            {t.whoConfused}
          </p>
           <div className="w-16 h-1 bg-love-200 rounded-full mx-auto my-4"></div>
           <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">{t.missionDesc}</p>
        </div>

        <Button 
          onClick={() => setGameState(prev => ({ ...prev, phase: GamePhase.RESULTS }))} 
          size="xl" 
          fullWidth
          className="shadow-glow-love bg-slate-900 text-white hover:bg-black"
        >
          {t.reveal}
        </Button>
      </div>
    </div>
  );

  const renderResults = () => {
    const impostor = gameState.players[gameState.impostorIndex];

    return (
      <div className="flex flex-col min-h-screen p-6 animate-pop-in">
         <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mx-auto">
            
            <div className="relative mb-12 group w-full perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-b from-red-500 to-rose-600 blur-[60px] opacity-40 group-hover:opacity-50 transition-opacity"></div>
              
              <div className="relative bg-white p-12 rounded-[3rem] shadow-2xl border-[6px] border-white text-center transform transition-transform hover:scale-[1.02] hover:rotate-1">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest shadow-xl border-4 border-white whitespace-nowrap">
                  {t.busted}
                </div>
                
                <div className="w-24 h-24 mx-auto bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500 animate-shake">
                   <EyeIcon className="w-12 h-12" />
                </div>

                <div className="text-5xl font-display text-slate-900 mb-2 break-words leading-tight">{impostor.name}</div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t.wasImpostor}</p>
              </div>
            </div>

            <div className="w-full bg-white/60 backdrop-blur rounded-3xl p-6 text-center border border-white shadow-lg mb-8 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-2">{t.secretTitle}</p>
                <p className="text-3xl font-display text-love-600" dir="ltr">{gameState.secretWord}</p>
              </div>
            </div>
         </div>

         <div className="w-full max-w-md mx-auto space-y-4 pb-8">
            <Button onClick={startNewRound} fullWidth size="xl" className="shadow-xl">
              {t.playAgain}
            </Button>
            <Button onClick={resetGame} variant="ghost" fullWidth className="text-slate-500 hover:text-slate-900">
              {t.backMenu}
            </Button>
         </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen text-slate-800 antialiased font-sans selection:bg-love-200 selection:text-love-900 ${isRTL ? 'font-hebrew' : ''}`}>
      <LanguageToggle />
      {gameState.phase === GamePhase.SETUP && renderSetup()}
      {gameState.phase === GamePhase.FETCHING && renderLoading()}
      {gameState.phase === GamePhase.TURN_REVEAL && renderTurnReveal()}
      {gameState.phase === GamePhase.DISCUSSION && renderDiscussion()}
      {gameState.phase === GamePhase.RESULTS && renderResults()}
    </div>
  );
};

export default App;
