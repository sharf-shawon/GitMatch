import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { githubService } from '../services/githubService';
import { firebaseService } from '../services/firebaseService';
import { Repository } from '../types';
import { cn } from '../lib/utils';
import { 
  X, 
  MapPin, 
  Link as LinkIcon, 
  Twitter, 
  Users, 
  BookOpen, 
  ChevronLeft,
  Github,
  Star,
  ExternalLink
} from 'lucide-react';

interface UserProfileViewProps {
  username: string;
  onClose: () => void;
  onSelectRepo: (repo: Repository) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ username, onClose, onSelectRepo }) => {
  const [user, setUser] = useState<any>(null);
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);

  const getTopLanguages = () => {
    const langs: Record<string, number> = {};
    repos.forEach(r => {
      if (r.language) {
        langs[r.language] = (langs[r.language] || 0) + 1;
      }
    });
    return Object.entries(langs)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [userData, userRepos, following] = await Promise.all([
          githubService.getUser(username),
          githubService.getUserRepos(username),
          firebaseService.isFollowingGithub(username)
        ]);
        setUser(userData);
        setRepos(userRepos);
        setIsFollowing(following);
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [username]);

  const handleToggleFollow = async () => {
    const followed = await firebaseService.toggleGithubFollow(user.login, user.avatar_url);
    setIsFollowing(followed);
  };

  if (!user && !loading) return null;

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed inset-0 z-[120] bg-slate-50 dark:bg-slate-950 overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto pb-20">
        {/* Banner area */}
        <div className="h-48 bg-slate-900 relative">
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl backdrop-blur-md transition-all z-10"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50" />
        </div>

        {/* Profile Card */}
        <div className="px-6 -mt-20 relative z-10">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-2xl border border-slate-100 dark:border-slate-800">
             {loading ? (
                <div className="flex flex-col md:flex-row gap-8 items-start animate-pulse">
                   <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem]" />
                   <div className="flex-1 space-y-4">
                      <div className="h-10 bg-slate-100 dark:bg-slate-800 w-2/3 rounded-xl" />
                      <div className="h-4 bg-slate-100 dark:bg-slate-800 w-1/3 rounded-lg" />
                      <div className="h-20 bg-slate-100 dark:bg-slate-800 w-full rounded-2xl" />
                   </div>
                </div>
             ) : (
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <img src={user.avatar_url} className="w-32 h-32 rounded-[2.5rem] object-cover ring-8 ring-white dark:ring-slate-900 shadow-xl" alt="" />
                  <div className="flex-1 space-y-4">
                     <div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">{user.name || user.login}</h1>
                        <div className="text-orange-500 font-black text-sm uppercase tracking-widest mt-1">@{user.login}</div>
                     </div>
                     
                     {user.bio && <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{user.bio}</p>}

                     <div className="flex flex-wrap items-center gap-4">
                        <button 
                          onClick={handleToggleFollow}
                          className={cn(
                            "px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg",
                            isFollowing 
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-500 hover:text-white" 
                              : "bg-orange-500 text-white hover:opacity-90"
                          )}
                        >
                          {isFollowing ? 'UNFOLLOW' : 'FOLLOW'}
                        </button>
                        <div className="flex flex-wrap gap-4 text-xs font-black text-slate-500 uppercase tracking-widest pt-2">
                           {user.location && (
                             <span className="flex items-center gap-1.5"><MapPin size={14} /> {user.location}</span>
                           )}
                           {user.blog && (
                             <a href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-orange-500 transition-colors">
                               <LinkIcon size={14} /> WEBSITE
                             </a>
                           )}
                           {user.twitter_username && (
                             <a href={`https://twitter.com/${user.twitter_username}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-sky-500 transition-colors">
                               <Twitter size={14} /> TWITTER
                             </a>
                           )}
                        </div>
                     </div>
                  </div>
                </div>
             )}
          </div>
        </div>

        {/* Stats & Languages */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <BookOpen size={16} /> TOP LANGUAGES
              </div>
              <div className="flex flex-wrap gap-2">
                 {loading ? (
                    [1,2,3].map(i => <div key={i} className="h-8 w-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 animate-pulse" />)
                 ) : (
                    getTopLanguages().map(([lang]) => (
                      <div key={lang} className="px-4 py-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase shadow-sm">
                         {lang}
                      </div>
                    ))
                 )}
                 {!loading && getTopLanguages().length === 0 && (
                   <div className="text-[10px] font-black text-slate-400 uppercase">NO DATA</div>
                 )}
              </div>
           </div>
           
           <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Users size={16} /> NETWORK
              </div>
              <div className="flex gap-4">
                 <div className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center">
                    {loading ? <div className="h-6 w-8 mx-auto bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /> : <div className="text-lg font-black italic">{user.followers}</div>}
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">FOLLOWERS</div>
                 </div>
                 <div className="flex-1 bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center">
                    {loading ? <div className="h-6 w-8 mx-auto bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /> : <div className="text-lg font-black italic">{user.following}</div>}
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">FOLLOWING</div>
                 </div>
              </div>
           </div>
        </div>

        {/* Popular Repos */}
        <div className="p-6 space-y-6">
           <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Github size={16} /> RECENT WORK
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loading ? (
                [1,2,3,4].map(i => <div key={i} className="h-32 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 animate-pulse" />)
              ) : (
                repos.map(repo => (
                  <motion.button
                    key={repo.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelectRepo(repo)}
                    className="text-left p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group"
                  >
                     <div className="flex justify-between items-start mb-2">
                        <h4 className="font-black italic uppercase tracking-tighter group-hover:text-orange-500 transition-colors truncate pr-4">{repo.name}</h4>
                        <span className="flex items-center gap-1 text-[10px] font-black text-amber-500"><Star size={10} fill="currentColor" /> {repo.stargazers_count}</span>
                     </div>
                     {repo.description && (
                       <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-medium mb-4">{repo.description}</p>
                     )}
                     <div className="flex gap-2">
                        {repo.language && (
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-tighter text-slate-500">{repo.language}</span>
                        )}
                     </div>
                  </motion.button>
                ))
              )}
           </div>

           {!loading && (
             <a 
               href={user.html_url}
               target="_blank"
               rel="noreferrer"
               className="block w-full py-6 bg-slate-900 text-white rounded-[2rem] text-center font-black italic uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-3"
             >
               VIEW FULL GITHUB PROFILE <ExternalLink size={20} />
             </a>
           )}
        </div>
      </div>
    </motion.div>
  );
};
