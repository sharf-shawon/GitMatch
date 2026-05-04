import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { RepoCard } from './components/RepoCard';
import { githubService } from './services/githubService';
import { firebaseService } from './services/firebaseService';
import { geminiService } from './services/geminiService';
import { Repository, InteractionType, CuratedList, Interaction } from './types';
import { 
  Flame, 
  Search, 
  Bookmark, 
  User, 
  Settings, 
  Github, 
  HandMetal, 
  Heart, 
  X, 
  Zap,
  Plus,
  Share2,
  Trash2,
  ListFilter,
  ExternalLink,
  RotateCcw,
  Eye,
  EyeOff,
  Link,
  Download,
  Smartphone,
  ArrowLeft,
  ArrowRight,
  History,
  Star,
  Activity,
  Code2,
  ChevronLeft,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { RepoDetailsView } from './components/RepoDetailsView';
import { UserProfileView } from './components/UserProfileView';

// PWA Install Prompt Component
const InstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if it's iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show if not already installed
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also check for iOS "Add to Home Screen"
    if (isIOSDevice && !window.matchMedia('(display-mode: standalone)').matches) {
      const hasShown = localStorage.getItem('pwa_prompt_shown');
      if (!hasShown) {
        setShowPrompt(true);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const closePrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_shown', 'true');
  };

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-24 left-4 right-4 z-[100] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-800"
      >
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-500 rounded-xl shrink-0">
            <Smartphone size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-sm">Install GitMatch</h4>
            <p className="text-xs text-slate-400 mt-1">
              {isIOS 
                ? "Tap the share button and 'Add to Home Screen' for a native experience."
                : "Add GitMatch to your home screen for lightning fast access."
              }
            </p>
            <div className="flex gap-2 mt-3">
              {!isIOS ? (
                <button 
                  onClick={handleInstall}
                  className="px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg flex items-center gap-2"
                >
                  <Download size={14} /> Install Now
                </button>
              ) : (
                <div className="px-3 py-1.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-lg pointer-events-none">
                  Follow iOS Instructions
                </div>
              )}
              <button 
                onClick={closePrompt}
                className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg"
              >
                Maybe Later
              </button>
            </div>
          </div>
          <button onClick={closePrompt} className="text-slate-500 hover:text-white">
            <X size={20} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// Components for different tabs
const MatchTab = ({ follows }: { follows: any[] }) => {
  const { user, profile } = useAuth();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [interactedIds, setInteractedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadInitialRepos();
  }, [user, follows]);

  // Auto-fetch when running low
  useEffect(() => {
    if (repos.length > 0 && repos.length - currentIndex < 10) {
      fetchMoreRepos();
    }
  }, [currentIndex, repos.length, follows]);

  const loadInitialRepos = async () => {
    if (!user) return;
    setLoading(true);
    setPage(1);
    try {
      const ids = await firebaseService.getAllInteractedRepoIds(user.uid);
      setInteractedIds(ids);

      // Start by fetching repos from followed accounts if any
      let initial: Repository[] = [];
      if (follows.length > 0) {
        const followUsername = follows[Math.floor(Math.random() * follows.length)].username;
        const followedRepos = await githubService.getUserRepos(followUsername);
        initial = [...followedRepos];
      }

      const lang = profile?.preferredLanguages?.[0];
      const trending = await githubService.getTrendingRepos(lang);
      
      const combined = [...initial, ...trending];
      const filtered = combined.filter(r => !ids.has(r.id.toString()));
      
      // Shuffle combined but keep followed near top
      setRepos(filtered);
      setCurrentIndex(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMoreRepos = async () => {
    if (loadingMore || !user) return;
    setLoadingMore(true);
    
    try {
      let keywords: string[] = [];
      try {
        const likes = await firebaseService.getUserLikes(user.uid);
        if (likes.length > 0) {
          keywords = await geminiService.recommendKeywords(likes.slice(0, 5).map(l => l.repoData));
        }
      } catch (err) {
        console.warn("Learning error", err);
      }

      // Mix in a follow-based search if possible
      let searchKeyword = keywords[0] || profile?.preferredLanguages?.[Math.floor(Math.random() * (profile?.preferredLanguages?.length || 1))] || 'typescript';
      
      if (follows.length > 0 && Math.random() > 0.5) {
        searchKeyword = `user:${follows[Math.floor(Math.random() * follows.length)].username}`;
      }

      const nextPage = page + 1;
      const newRepos = await githubService.getTrendingRepos(undefined, searchKeyword, nextPage);
      
      // Filter out duplicates and already seen
      const filteredNew = newRepos.filter(r => 
        !interactedIds.has(r.id.toString()) && 
        !repos.some(rr => rr.id === r.id)
      );

      if (filteredNew.length > 0) {
        setRepos(prev => [...prev, ...filteredNew]);
        setPage(nextPage);
      } else if (page < 5) {
        // Try one more page with no specific keyword if literal exact search failed
        const fallbackRepos = await githubService.getTrendingRepos(undefined, undefined, nextPage);
        const filteredFallback = fallbackRepos.filter(r => 
          !interactedIds.has(r.id.toString()) && 
          !repos.some(rr => rr.id === r.id)
        );
        setRepos(prev => [...prev, ...filteredFallback]);
        setPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to fetch more repos", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSwipe = async (direction: InteractionType) => {
    const repo = repos[currentIndex];
    if (!repo) return;

    await firebaseService.logInteraction(repo, direction);
    setInteractedIds(prev => new Set(prev).add(repo.id.toString()));

    setCurrentIndex(prev => prev + 1);
  };

  if (loading) return (
    <div className="h-full flex flex-col items-center justify-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-orange-500" />
      <p className="text-slate-500 font-medium animate-pulse">Syncing with the mothership...</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="relative w-full max-w-md aspect-[3/4] mb-24">
        <AnimatePresence>
           {repos.slice(currentIndex, currentIndex + 2).reverse().map((repo, idx) => (
             <RepoCard 
               key={repo.id} 
               repo={repo} 
               onSwipe={handleSwipe} 
               isTop={currentIndex + idx === currentIndex + 1} 
             />
           ))}
        </AnimatePresence>
        
        {currentIndex >= repos.length && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800"
          >
             {loadingMore ? (
               <>
                 <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 border-t-orange-500 mb-6" />
                 <h3 className="text-2xl font-black mb-2 italic">DIGGING DEEPER...</h3>
                 <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">
                   We're searching the far reaches of GitHub to find your next favorite repo.
                 </p>
               </>
             ) : (
               <>
                 <div className="w-20 h-20 bg-orange-100 dark:bg-orange-950/30 text-orange-500 rounded-full flex items-center justify-center mb-6">
                   <RotateCcw size={40} />
                 </div>
                 <h3 className="text-2xl font-black mb-2 italic">End of the line!</h3>
                 <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm leading-relaxed">
                   You've swiped through everything in your queue. Ready for another round of discovery?
                 </p>
                 <button 
                   onClick={loadInitialRepos}
                   className="w-full py-4 bg-slate-900 dark:bg-orange-500 text-white rounded-2xl font-black hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-orange-500/20 flex items-center justify-center gap-2"
                 >
                   <RotateCcw size={20} /> FRESH STACK
                 </button>
               </>
             )}
          </motion.div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="absolute bottom-4 flex items-center gap-8">
        <button 
          onClick={() => handleSwipe('pass')}
          className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-rose-500 hover:scale-110 active:scale-95 transition-all border border-slate-200 dark:border-slate-700"
        >
          <X size={32} />
        </button>
        <button 
          onClick={() => handleSwipe('superlike')}
          className="w-14 h-14 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-cyan-500 hover:scale-110 active:scale-95 transition-all border border-slate-200 dark:border-slate-700"
        >
          <Zap size={24} fill="currentColor" />
        </button>
        <button 
          onClick={() => handleSwipe('like')}
          className="w-16 h-16 rounded-full bg-white dark:bg-slate-800 shadow-md flex items-center justify-center text-emerald-500 hover:scale-110 active:scale-95 transition-all border border-slate-200 dark:border-slate-700"
        >
          <Heart size={32} fill="currentColor" />
        </button>
      </div>
    </div>
  );
};

const SavedTab = ({ onSelectRepo, myLists }: { onSelectRepo: (repo: Repository) => void, myLists: CuratedList[] }) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState<Interaction[]>([]);
  const [passes, setPasses] = useState<Interaction[]>([]);
  const [activeTab, setActiveTab] = useState<'liked' | 'passed' | 'collections'>('liked');
  const [followedLists, setFollowedLists] = useState<CuratedList[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [draggingRepoId, setDraggingRepoId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubLikes = firebaseService.listenUserInteractions(user.uid, 'liked', setLikes);
    const unsubPasses = firebaseService.listenUserInteractions(user.uid, 'passed', setPasses);
    loadFollowed();
    return () => {
      unsubLikes();
      unsubPasses();
    };
  }, [user]);

  const loadFollowed = async () => {
    const followed = await firebaseService.getFollowedLists();
    setFollowedLists(followed);
  };

  const handleCreateList = async () => {
    if (!newListTitle.trim() || isCreating) return;
    setIsCreating(true);
    try {
      await firebaseService.createList(
        newListTitle, 
        "A curated collection.", 
        true, 
        [],
        []
      );
      setNewListTitle('');
      setShowCreate(false);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteInteraction = async (repoId: string) => {
    await firebaseService.removeInteraction(repoId);
  };

  const handleLikeInteraction = async (repo: Repository) => {
    await firebaseService.logInteraction(repo, 'like');
  };

  const handleMoveToList = async (repo: Repository, targetListId: string) => {
    const list = myLists.find(l => l.id === targetListId);
    if (!list) return;

    if (list.repoIds.includes(repo.id.toString())) return;

    await firebaseService.updateList(targetListId, {
      repoIds: [...list.repoIds, repo.id.toString()],
      repos: [...list.repos, repo]
    });
  };

  const removeFromList = async (listId: string, repoId: string) => {
    const list = myLists.find(l => l.id === listId);
    if (!list) return;

    await firebaseService.updateList(listId, {
      repoIds: list.repoIds.filter(id => id !== repoId),
      repos: list.repos.filter(r => r.id.toString() !== repoId)
    });
  };

  const handleDeleteList = async (listId: string) => {
    if (listId === 'super-likes') return;
    if (!window.confirm("Are you sure you want to delete this collection? This cannot be undone.")) return;
    await firebaseService.deleteList(listId);
  };

  const handleToggleVisibility = async (listId: string, currentIsPublic: boolean) => {
    await firebaseService.updateList(listId, { isPublic: !currentIsPublic });
  };

  const handleShareList = (listId: string) => {
    const url = `${window.location.origin}/?list=${listId}`;
    navigator.clipboard.writeText(url);
    alert("Collection link copied to clipboard!");
  };

  return (
    <div className="p-6 space-y-6 pb-32 max-w-2xl mx-auto">
      <header className="flex items-center justify-between">
        <h1 className="text-4xl font-black tracking-tight italic">YOUR STASH</h1>
        <button 
          onClick={() => setShowCreate(true)}
          className="p-3 bg-orange-500 text-white rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus size={24} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('liked')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
            activeTab === 'liked' ? "bg-white dark:bg-slate-800 shadow-sm text-orange-500" : "text-slate-500 hover:bg-white/50"
          )}
        >
          <Heart size={14} fill={activeTab === 'liked' ? "currentColor" : "none"} /> LIKED ({likes.length})
        </button>
        <button 
          onClick={() => setActiveTab('passed')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
            activeTab === 'passed' ? "bg-white dark:bg-slate-800 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 hover:bg-white/50"
          )}
        >
          <History size={14} /> PASSED ({passes.length})
        </button>
        <button 
          onClick={() => setActiveTab('collections')}
          className={cn(
            "flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2",
            activeTab === 'collections' ? "bg-white dark:bg-slate-800 shadow-sm text-orange-500" : "text-slate-500 hover:bg-white/50"
          )}
        >
          <Bookmark size={14} fill={activeTab === 'collections' ? "currentColor" : "none"} /> LISTS
        </button>
      </div>

      <AnimatePresence mode="wait">
        {showCreate && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-orange-500/10 p-5 rounded-3xl border-2 border-dashed border-orange-500"
          >
            <input 
              autoFocus
              className="w-full bg-transparent border-b-2 border-orange-500 py-2 font-black text-xl focus:outline-none placeholder:text-orange-950/20"
              placeholder="Name your collection..."
              value={newListTitle}
              onChange={e => setNewListTitle(e.target.value)}
            />
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowCreate(false)} className="px-5 py-2 text-xs font-black text-slate-500" disabled={isCreating}>CANCEL</button>
              <button 
                onClick={handleCreateList} 
                disabled={isCreating}
                className="px-6 py-2 bg-slate-900 text-white text-xs font-black rounded-xl leading-none disabled:opacity-50 flex items-center gap-2 shadow-xl"
              >
                {isCreating ? <><div className="animate-spin h-3 w-3 border-2 border-white/30 border-t-white rounded-full" /> CREATING...</> : "CREATE COLLECTION"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {activeTab === 'liked' && (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 gap-4"
          >
            {likes.map((like) => (
              <motion.div 
                key={like.repoId} 
                layout
                drag="x"
                dragConstraints={{ right: 0 }}
                onDragStart={() => setDraggingRepoId(like.repoId)}
                onDragEnd={(_, info) => {
                  setDraggingRepoId(null);
                  if (info.offset.x < -100) handleDeleteInteraction(like.repoId);
                }}
                className="relative group min-h-[4rem]"
              >
                <div className="absolute inset-0 bg-rose-500 rounded-3xl flex items-center justify-end px-6 text-white font-black text-xs">
                  <Trash2 size={24} />
                  <span className="ml-2 uppercase">Remove from stash</span>
                </div>
                
                <div 
                  className="relative h-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 group-active:cursor-grabbing hover:border-orange-500/50 transition-colors shadow-sm cursor-pointer"
                  onClick={() => onSelectRepo(like.repoData)}
                >
                   <img src={like.repoData.owner.avatar_url} className="w-12 h-12 rounded-2xl object-cover" alt="" />
                   <div className="flex-1 min-w-0">
                     <div className="font-black truncate text-sm uppercase">{like.repoData.name}</div>
                     <div className="text-[10px] text-slate-500 truncate font-medium">{like.repoData.description}</div>
                   </div>
                   {myLists.length > 0 && (
                     <div className="hidden sm:block">
                        <select 
                          onChange={(e) => {
                            if (e.target.value) handleMoveToList(like.repoData, e.target.value);
                            e.target.value = "";
                          }}
                          className="text-[10px] bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-3 py-2 font-black appearance-none cursor-pointer hover:bg-slate-200 transition-colors"
                        >
                          <option value="">+ ADD TO LIST</option>
                          {myLists.map(l => (
                            <option key={l.id} value={l.id}>{l.title.toUpperCase()}</option>
                          ))}
                        </select>
                     </div>
                   )}
                   <a href={like.repoData.html_url} target="_blank" rel="noreferrer" className="p-2 text-slate-300 hover:text-orange-500 transition-colors">
                     <ExternalLink size={20} />
                   </a>
                </div>
              </motion.div>
            ))}
            {likes.length === 0 && (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-950/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Heart size={48} className="mx-auto mb-4 opacity-5" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No liked repos yet</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'passed' && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 gap-4"
          >
            {passes.map((pass) => (
              <motion.div 
                key={pass.repoId} 
                layout
                drag="x"
                dragConstraints={{ left: -100, right: 100 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -100) handleDeleteInteraction(pass.repoId);
                  if (info.offset.x > 100) handleLikeInteraction(pass.repoData);
                }}
                className="relative group min-h-[4rem]"
              >
                <div className="absolute inset-y-0 left-0 w-1/2 bg-emerald-500 rounded-3xl flex items-center justify-start px-6 text-white font-black text-xs">
                  <Heart size={24} fill="currentColor" />
                  <span className="ml-2 uppercase">Move to liked</span>
                </div>
                <div className="absolute inset-y-0 right-0 w-1/2 bg-rose-500 rounded-3xl flex items-center justify-end px-6 text-white font-black text-xs">
                  <Trash2 size={24} />
                  <span className="ml-2 uppercase">Forget forever</span>
                </div>
                
                <div className="relative h-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 group-active:cursor-grabbing hover:border-slate-500/50 transition-colors shadow-sm text-sm">
                   <img src={pass.repoData.owner.avatar_url} className="w-12 h-12 rounded-2xl grayscale" alt="" />
                   <div className="flex-1 min-w-0">
                     <div className="font-bold truncate uppercase text-slate-400">{pass.repoData.name}</div>
                     <div className="text-[10px] text-slate-400 truncate font-medium uppercase">REJECTED • SWIPE TO RECOVER</div>
                   </div>
                   <div className="flex items-center gap-2 text-slate-300">
                     <ArrowLeft size={14} className="animate-pulse" />
                     <ArrowRight size={14} className="animate-pulse" />
                   </div>
                </div>
              </motion.div>
            ))}
            {passes.length === 0 && (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-950/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <History size={48} className="mx-auto mb-4 opacity-5" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">History is clean</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'collections' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* System Collections (Super Likes) */}
            {likes.some(l => l.type === 'superlike') && (
              <div 
                className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-[2rem] border-2 border-amber-200 dark:border-amber-900/50 shadow-xl shadow-amber-500/10"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-black text-xl italic uppercase tracking-tighter text-amber-600 flex items-center gap-2">
                      <Star size={20} fill="currentColor" /> SUPER LIKED
                    </h3>
                    <p className="text-[10px] font-black text-amber-500/50 uppercase tracking-widest mt-1">SYSTEM MANAGED • NON-DELETABLE</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {likes.filter(l => l.type === 'superlike').map(l => (
                    <button 
                      key={l.repoId} 
                      onClick={() => onSelectRepo(l.repoData)}
                      className="text-[10px] bg-white dark:bg-slate-900 text-amber-600 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/50 font-black uppercase shadow-sm hover:border-amber-500 transition-all"
                    >
                      {l.repoData.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* My Collections */}
            <div className="grid grid-cols-1 gap-4">
              {myLists.map(list => (
                 <div 
                   key={list.id} 
                   className={cn(
                     "p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 transition-all shadow-sm",
                     draggingRepoId && "border-white border-dashed bg-orange-500/10 scale-[1.02]"
                   )}
                   onDragOver={(e) => e.preventDefault()}
                   onDrop={(e) => {
                     e.preventDefault();
                     try {
                       const repoData = JSON.parse(e.dataTransfer.getData('repo'));
                       handleMoveToList(repoData, list.id);
                     } catch (err) {}
                     setDraggingRepoId(null);
                   }}
                 >
                    <div className="flex justify-between items-start mb-4">
                       <div>
                         <h3 className="font-black text-xl italic uppercase tracking-tighter">{list.title}</h3>
                         <div className="flex gap-2 mt-2">
                            <button 
                              onClick={() => handleToggleVisibility(list.id, list.isPublic)}
                              className={cn("flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full transition-all uppercase", 
                                list.isPublic ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                              )}
                            >
                              {list.isPublic ? <><Eye size={12} /> PUBLIC</> : <><EyeOff size={12} /> PRIVATE</>}
                            </button>
                            {list.id !== 'super-likes' && (
                              <button 
                                onClick={() => handleShareList(list.id)}
                                className="flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200 transition-all uppercase"
                              >
                                <Link size={12} /> SHARE
                              </button>
                            )}
                         </div>
                       </div>
                       {list.id !== 'super-likes' && (
                         <button 
                           onClick={() => handleDeleteList(list.id)}
                           className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                         >
                           <Trash2 size={20} />
                         </button>
                       )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {list.repos.map(r => (
                        <motion.div 
                          key={r.id} 
                          layout
                          className="text-[10px] bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2 group relative font-bold"
                        >
                          <button 
                            onClick={() => onSelectRepo(r)}
                            className="uppercase hover:text-orange-500 transition-colors"
                          >
                            {r.name}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFromList(list.id, r.id.toString());
                            }}
                            className="text-slate-300 hover:text-rose-500 transition-colors"
                          >
                            <X size={12} />
                          </button>
                        </motion.div>
                      ))}
                      {list.repos.length === 0 && (
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic py-2">Drag repository cards here to grow this list</p>
                      )}
                    </div>
                 </div>
              ))}
              {myLists.length === 0 && (
                <div className="text-center py-20 bg-slate-50 dark:bg-slate-950/20 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <Bookmark size={48} className="mx-auto mb-4 opacity-5" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No collections curated yet</p>
                </div>
              )}
            </div>

            {/* Followed Collections */}
            {followedLists.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-3">
                  <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                  FOLLOWED BY YOU
                  <span className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {followedLists.map(list => (
                     <div key={list.id} className="p-6 bg-slate-50 dark:bg-slate-950/20 rounded-[2rem] border border-slate-200 dark:border-slate-800">
                        <h3 className="font-black text-lg italic uppercase">{list.title}</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">CURATED BY {list.ownerName}</p>
                        <div className="flex flex-wrap gap-2">
                          {list.repos.slice(0, 4).map(r => (
                            <button 
                              key={r.id} 
                              onClick={() => onSelectRepo(r)}
                              className="text-[10px] bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800 font-bold uppercase hover:border-orange-500 transition-all"
                            >
                              {r.name}
                            </button>
                          ))}
                          {list.repos.length > 4 && (
                            <div className="text-[10px] text-slate-400 flex items-center px-2 font-black">+{list.repos.length - 4} MORE</div>
                          )}
                        </div>
                     </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

const DiscoverTab = ({ onSelectRepo }: { onSelectRepo: (repo: Repository) => void }) => {
  const [lists, setLists] = useState<CuratedList[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    firebaseService.getPublicLists().then(l => {
      setLists(l);
      setLoading(false);
    });
  }, []);

  const handleFollow = async (listId: string) => {
    await firebaseService.followList(listId);
    alert("List followed!");
  };

  const handleShareList = (listId: string) => {
    const url = `${window.location.origin}/?list=${listId}`;
    navigator.clipboard.writeText(url);
    alert("Collection link copied to clipboard!");
  };

  return (
    <div className="p-6 space-y-8 pb-32 max-w-4xl mx-auto">
       <header>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase mb-2">Discover</h1>
          <p className="text-slate-500 font-medium tracking-tight">CROWD-SOURCED COLLECTIONS FOR THE MODERN DEVELOPER</p>
       </header>

       {loading ? (
          <div className="flex justify-center py-20"><div className="animate-spin h-12 w-12 border-4 border-slate-100 border-t-orange-500 rounded-full" /></div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {lists.map(list => (
              <motion.div 
                key={list.id} 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group"
              >
                 <div className="flex justify-between items-start mb-6">
                    <div className="min-w-0">
                       <h3 className="text-2xl font-black italic uppercase tracking-tighter group-hover:text-orange-500 transition-colors truncate">{list.title}</h3>
                       <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-widest leading-none">CURATED BY {list.ownerName}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button 
                        onClick={() => handleFollow(list.id)}
                        className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[10px] font-black hover:bg-orange-500 hover:text-white transition-all uppercase"
                      >
                        FOLLOW
                      </button>
                      <button 
                        onClick={() => handleShareList(list.id)}
                        className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full hover:bg-slate-200 transition-all shadow-sm"
                      >
                         <Share2 size={18} />
                      </button>
                    </div>
                 </div>
                 <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 line-clamp-3 font-medium leading-relaxed">
                    {list.description}
                 </p>
                 <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar pb-2">
                    {list.repos.slice(0, 6).map(r => (
                       <button 
                        key={r.id} 
                        onClick={() => onSelectRepo(r)}
                        className="px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-xl text-[10px] font-black border border-slate-100 dark:border-slate-700 uppercase whitespace-nowrap hover:border-orange-500 transition-all"
                       >
                          {r.name}
                       </button>
                    ))}
                    {list.repos.length > 6 && (
                       <div className="px-2 py-1 text-[10px] text-slate-400 flex items-center font-black">+{list.repos.length - 6} MORE</div>
                    )}
                 </div>
              </motion.div>
            ))}
         </div>
       )}
    </div>
  );
};

const ProfileTab = ({ follows, onViewProfile }: { follows: any[], onViewProfile: (user: string) => void }) => {
  const { user, profile, logout, updateProfile } = useAuth();
  const [interests, setInterests] = useState('');
  const [languages, setLanguages] = useState('');

  useEffect(() => {
    if (profile) {
      setInterests(profile.interests.join(', '));
      setLanguages(profile.preferredLanguages.join(', '));
    }
  }, [profile]);

  const handleSave = async () => {
    await updateProfile({
      interests: interests.split(',').map(i => i.trim()).filter(Boolean),
      preferredLanguages: languages.split(',').map(l => l.trim()).filter(Boolean)
    });
    alert("Profile updated!");
  };

  const handleVisitGithub = (username: string) => {
    window.open(`https://github.com/${username}`, '_blank');
  };

  return (
    <div className="p-6 space-y-8 pb-32 max-w-4xl mx-auto">
       <header className="flex flex-col items-center py-8">
          <div className="relative mb-4">
             <img src={user?.photoURL || ''} alt="" className="w-24 h-24 rounded-full border-4 border-orange-500 shadow-xl" />
             <div className="absolute bottom-0 right-0 p-1.5 bg-orange-500 text-white rounded-full border-2 border-white">
                <Settings size={14} />
             </div>
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">{user?.displayName}</h2>
          <p className="text-slate-500 font-medium tracking-tight uppercase text-[10px]">{user?.email}</p>
       </header>

       {/* Following Section */}
       <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">FOLLOWING ON GITHUB ({follows.length})</label>
          </div>
          <div className="flex flex-wrap gap-4">
             {follows.map(f => (
               <div key={f.username} className="group relative">
                  <button 
                    onClick={() => onViewProfile(f.username)}
                    className="w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 border-transparent hover:border-orange-500 transition-all shadow-md group-active:scale-90"
                  >
                    <img src={f.avatarUrl} alt={f.username} className="w-full h-full object-cover" />
                  </button>
                  {/* Quick controls on hover? Or just click to profile. Profile view has unfollow. */}
                  <button 
                    onClick={() => handleVisitGithub(f.username)}
                    className="absolute -top-1 -right-1 p-1 bg-slate-900 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ExternalLink size={10} />
                  </button>
               </div>
             ))}
             {follows.length === 0 && (
               <div className="w-full py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400">
                  <Users size={24} className="mb-2 opacity-20" />
                  <p className="text-[10px] font-black uppercase tracking-widest">No follows yet</p>
               </div>
             )}
          </div>
       </div>

       <div className="space-y-6 pt-8 border-t border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">YOUR FOCUS</label>
             <input 
               className="w-full bg-slate-100 dark:bg-slate-900 border-none p-4 rounded-xl font-medium focus:ring-2 focus:ring-orange-500 transition-all"
               placeholder="React, AI, Web3, Systems Engineering..."
               value={interests}
               onChange={e => setInterests(e.target.value)}
             />
          </div>
          <div className="space-y-2">
             <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">FAVORITE STACKS</label>
             <input 
               className="w-full bg-slate-100 dark:bg-slate-900 border-none p-4 rounded-xl font-medium focus:ring-2 focus:ring-orange-500 transition-all"
               placeholder="TypeScript, Python, Rust, Go..."
               value={languages}
               onChange={e => setLanguages(e.target.value)}
             />
          </div>
          
          <div className="flex gap-4 pt-4">
             <button 
               onClick={handleSave}
               className="flex-1 bg-slate-900 dark:bg-orange-500 text-white font-black italic uppercase py-5 rounded-2xl shadow-xl hover:opacity-90 active:scale-95 transition-all tracking-widest text-xs"
             >
               UPDATE PROFILE
             </button>
          </div>

          <button 
             onClick={logout}
             className="w-full text-slate-400 font-black italic uppercase py-4 rounded-2xl hover:text-rose-500 transition-colors tracking-widest text-[10px]"
          >
             LOGOUT SESSION
          </button>
       </div>
    </div>
  );
};

function MainApp() {
  const { user, loading, signIn, signInWithGithub } = useAuth();
  const [activeTab, setActiveTab] = useState<'match' | 'discover' | 'saved' | 'profile'>('match');
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [myLists, setMyLists] = useState<CuratedList[]>([]);
  const [githubFollows, setGithubFollows] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsubLists = firebaseService.listenMyLists(user.uid, setMyLists);
    const unsubFollows = firebaseService.listenGithubFollows(user.uid, setGithubFollows);
    return () => {
      unsubLists();
      unsubFollows();
    };
  }, [user]);

  const handleQuickLike = async (repo: Repository) => {
    if (!user) return;
    await firebaseService.logInteraction(repo, 'like');
  };

  const handleQuickMove = async (repo: Repository, listId: string) => {
    if (!user) return;
    const list = myLists.find(l => l.id === listId);
    if (!list) return;
    if (list.repoIds.includes(repo.id.toString())) return;

    await firebaseService.updateList(listId, {
      repoIds: [...list.repoIds, repo.id.toString()],
      repos: [...list.repos, repo]
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-8 text-slate-900">
        <div className="mb-12 text-center">
           <div className="w-20 h-20 bg-gradient-to-tr from-pink-500 to-orange-400 rounded-[20px] flex items-center justify-center shadow-xl mb-6 mx-auto">
             <Github size={40} className="text-white" />
           </div>
           <h1 className="text-5xl font-black tracking-tighter mb-2 text-slate-900">GitMatch</h1>
           <p className="text-slate-500 font-medium text-lg">Swipe your way to better code.</p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={signInWithGithub}
            className="w-full bg-slate-900 text-white font-extrabold py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all text-xl"
          >
            <Github fill="currentColor" size={24} /> LOGIN WITH GITHUB
          </button>

          <button 
            onClick={signIn}
            className="w-full bg-white text-slate-900 border border-slate-200 font-extrabold py-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all text-xl"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="" /> LOGIN WITH GOOGLE
          </button>
        </div>
        
        <p className="mt-8 text-slate-400 text-center text-xs px-12 leading-relaxed">
          The curated way to find GitHub projects.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col p-8 shrink-0">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 bg-gradient-to-tr from-pink-500 to-orange-400 rounded-xl flex items-center justify-center shadow-lg">
            <Heart size={20} className="text-white" fill="currentColor" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">GitMatch</h1>
        </div>

        <div className="space-y-2 flex-1">
          <button 
            onClick={() => setActiveTab('match')}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-3 rounded-xl font-bold transition-all",
              activeTab === 'match' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
          >
            <Flame size={20} /> Match Feed
          </button>
          <button 
            onClick={() => setActiveTab('discover')}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-3 rounded-xl font-bold transition-all",
              activeTab === 'discover' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
          >
            <Search size={20} /> Discover
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-3 rounded-xl font-bold transition-all",
              activeTab === 'saved' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
          >
            <Bookmark size={20} /> Collections
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={cn(
              "w-full flex items-center gap-3 px-5 py-3 rounded-xl font-bold transition-all",
              activeTab === 'profile' ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            )}
          >
            <User size={20} /> Profile
          </button>
        </div>

        <div className="mt-auto p-5 bg-slate-900 dark:bg-slate-800 rounded-2xl text-white">
           <div className="flex items-center gap-3">
              <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border border-slate-700" alt="" />
              <div className="min-w-0">
                 <p className="text-sm font-bold truncate">{user.displayName}</p>
                 <p className="text-[10px] text-slate-400 truncate">Algorithm Active</p>
              </div>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 max-w-full relative overflow-y-auto no-scrollbar">
        <div className="max-w-xl mx-auto h-full flex flex-col">
          <AnimatePresence mode="wait">
            {activeTab === 'match' && (
              <motion.div key="match" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                <MatchTab follows={githubFollows} />
              </motion.div>
            )}
            {activeTab === 'discover' && (
              <motion.div key="discover" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DiscoverTab onSelectRepo={setSelectedRepo} />
              </motion.div>
            )}
            {activeTab === 'saved' && (
              <motion.div key="saved" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SavedTab 
                  onSelectRepo={setSelectedRepo} 
                  myLists={myLists}
                />
              </motion.div>
            )}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ProfileTab 
                  follows={githubFollows} 
                  onViewProfile={setSelectedUser} 
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-6 left-6 right-6 bg-slate-900/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[24px] border border-white/10 shadow-2xl z-50">
        <div className="flex items-center justify-around h-16">
          <button 
            onClick={() => setActiveTab('match')}
            className={cn("p-2 transition-colors", activeTab === 'match' ? "text-orange-400" : "text-slate-400")}
          >
            <Flame size={24} strokeWidth={activeTab === 'match' ? 3 : 2} />
          </button>
          <button 
            onClick={() => setActiveTab('discover')}
            className={cn("p-2 transition-colors", activeTab === 'discover' ? "text-orange-400" : "text-slate-400")}
          >
            <Search size={24} strokeWidth={activeTab === 'discover' ? 3 : 2} />
          </button>
          <button 
            onClick={() => setActiveTab('saved')}
            className={cn("p-2 transition-colors", activeTab === 'saved' ? "text-orange-400" : "text-slate-400")}
          >
            <Bookmark size={24} strokeWidth={activeTab === 'saved' ? 3 : 2} />
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={cn("p-2 transition-colors", activeTab === 'profile' ? "text-orange-400" : "text-slate-400")}
          >
            <User size={24} strokeWidth={activeTab === 'profile' ? 3 : 2} />
          </button>
        </div>
      </nav>

      <InstallPrompt />

      {/* Overlays */}
      <AnimatePresence>
        {selectedRepo && (
          <RepoDetailsView 
            repo={selectedRepo} 
            onClose={() => setSelectedRepo(null)} 
            onViewProfile={(username) => {
              setSelectedRepo(null);
              setSelectedUser(username);
            }}
            myLists={myLists}
            onLike={() => handleQuickLike(selectedRepo)}
            onMoveToList={(listId) => handleQuickMove(selectedRepo, listId)}
          />
        )}
        {selectedUser && (
          <UserProfileView 
            username={selectedUser} 
            onClose={() => setSelectedUser(null)}
            onSelectRepo={(repo) => {
              setSelectedUser(null);
              setSelectedRepo(repo);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
