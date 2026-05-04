import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import 'github-markdown-css/github-markdown.css';
import { githubService } from '../services/githubService';
import { Repository, CuratedList } from '../types';
import { GitHubGraph } from './GitHubGraph';
import { cn } from '../lib/utils';
import { 
  Star, 
  GitFork, 
  Eye, 
  ExternalLink, 
  User, 
  Info,
  Activity,
  Code2,
  ChevronLeft,
  Heart,
  FolderPlus
} from 'lucide-react';

interface RepoDetailsViewProps {
  repo: Repository;
  onClose: () => void;
  onViewProfile: (username: string) => void;
  myLists: CuratedList[];
  onLike: () => void;
  onMoveToList: (listId: string) => void;
}

export const RepoDetailsView: React.FC<RepoDetailsViewProps> = ({ 
  repo, 
  onClose, 
  onViewProfile,
  myLists,
  onLike,
  onMoveToList
}) => {
  const [readme, setReadme] = useState('');
  const [stats, setStats] = useState<{ day: string, count: number }[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCollections, setShowCollections] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);

  useEffect(() => {
    const loadDetails = async () => {
      setLoading(true);
      try {
        const [readmeContent, repoStats, repoLangs] = await Promise.all([
          githubService.getReadme(repo.owner.login, repo.name),
          githubService.getRepoStats(repo.owner.login, repo.name),
          githubService.getLanguages(repo.full_name)
        ]);
        setReadme(readmeContent);
        setStats(repoStats);
        setLanguages(repoLangs);
      } catch (err) {
        console.error("Failed to load repo details", err);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [repo]);

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[110] bg-white dark:bg-slate-950 overflow-y-auto"
    >
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between">
        <button 
          onClick={onClose}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 text-center truncate px-4">
          <h2 className="text-sm font-black italic uppercase tracking-tighter truncate">{repo.name}</h2>
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{repo.owner.login}</p>
        </div>
        <a 
          href={repo.html_url} 
          target="_blank" 
          rel="noreferrer"
          className="p-2 text-orange-500"
        >
          <ExternalLink size={24} />
        </a>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-8 pb-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
            {loading ? <div className="h-6 w-12 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /> : <Star size={20} className="mx-auto mb-2 text-amber-500" />}
            <div className="text-xl font-black italic">{loading ? "---" : repo.stargazers_count}</div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">STARS</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
            {loading ? <div className="h-6 w-12 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /> : <GitFork size={20} className="mx-auto mb-2 text-indigo-500" />}
            <div className="text-xl font-black italic">{loading ? "---" : repo.forks_count}</div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">FORKS</div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 text-center">
            {loading ? <div className="h-6 w-12 mx-auto bg-slate-200 dark:bg-slate-800 rounded animate-pulse" /> : <Eye size={20} className="mx-auto mb-2 text-emerald-500" />}
            <div className="text-xl font-black italic">{loading ? "---" : repo.watchers_count}</div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">WATCHERS</div>
          </div>
        </div>

        {/* Languages */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            <Code2 size={16} /> STACK
          </div>
          <div className="flex flex-wrap gap-2">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-10 w-24 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />)
            ) : languages.length > 0 ? (
              languages.map(lang => (
                <span key={lang} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-2xl text-[11px] font-black uppercase border border-slate-200 dark:border-slate-700">
                  {lang}
                </span>
              ))
            ) : (
              <span className="text-[11px] font-black text-slate-400 uppercase">Wait, no code? Impossible.</span>
            )}
          </div>
        </div>

        {/* Owner Info */}
        <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between group overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
          {loading ? (
             <div className="flex items-center gap-4 relative z-10 animate-pulse w-full">
                <div className="w-16 h-16 bg-white/10 rounded-3xl" />
                <div className="flex-1 space-y-2">
                   <div className="h-2 w-20 bg-white/10 rounded" />
                   <div className="h-6 w-32 bg-white/10 rounded" />
                </div>
             </div>
          ) : (
             <>
              <div className="flex items-center gap-4 relative z-10">
                <img src={repo.owner.avatar_url} className="w-16 h-16 rounded-3xl object-cover shadow-xl" alt="" />
                <div>
                  <div className="text-[10px] font-black text-orange-500 uppercase tracking-widest">MAINTAINED BY</div>
                  <h3 className="text-xl font-black italic uppercase group-hover:text-orange-500 transition-colors">{repo.owner.login}</h3>
                </div>
              </div>
              <button 
                onClick={() => onViewProfile(repo.owner.login)}
                className="p-4 bg-white/10 hover:bg-orange-500 text-white rounded-2xl transition-all shadow-xl relative z-10"
              >
                <User size={24} />
              </button>
             </>
          )}
        </div>

        {/* Activity Graph */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            <Activity size={16} /> COMMIT FREQUENCY
          </div>
          {loading ? (
             <div className="h-32 bg-slate-50 dark:bg-slate-900 animate-pulse rounded-3xl" />
          ) : (
             <GitHubGraph stats={stats} />
          )}
        </div>

        {/* README Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
            <Info size={16} /> README.md
          </div>
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
          {loading ? (
             <div className="space-y-4">
                <div className="h-8 bg-slate-100 dark:bg-slate-800 w-3/4 rounded animate-pulse" />
                <div className="h-4 bg-slate-100 dark:bg-slate-800 w-full rounded animate-pulse" />
                <div className="h-4 bg-slate-100 dark:bg-slate-800 w-5/6 rounded animate-pulse" />
             </div>
          ) : (
            <>
              {/* Action Buttons */}
              <div className="flex gap-4 mb-8">
                 {loading ? (
                    <>
                       <div className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                       <div className="flex-1 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                    </>
                 ) : (
                    <>
                     <button 
                       onClick={() => {
                         onLike();
                         setHasLiked(true);
                       }}
                       className={cn(
                         "flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 font-black italic uppercase text-xs tracking-widest transition-all",
                         hasLiked ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-rose-50 hover:text-rose-500"
                       )}
                     >
                       <Heart size={18} fill={hasLiked ? "currentColor" : "none"} /> {hasLiked ? 'LIKED' : 'LIKE REPO'}
                     </button>
                     
                     <div className="flex-1 relative">
                        <button 
                          onClick={() => setShowCollections(!showCollections)}
                          className="w-full py-4 bg-slate-900 text-white rounded-2xl flex items-center justify-center gap-2 font-black italic uppercase text-xs tracking-widest hover:opacity-90 transition-all"
                        >
                          <FolderPlus size={18} /> STASH
                        </button>
                        
                        <AnimatePresence>
                          {showCollections && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10, scale: 0.95 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              exit={{ opacity: 0, y: -10, scale: 0.95 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-30"
                            >
                               <div className="max-h-48 overflow-y-auto p-2">
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest p-2 border-b border-slate-50 dark:border-slate-700/50 mb-1 text-center">ADD TO COLLECTION</p>
                                  {myLists.map(list => (
                                    <button
                                      key={list.id}
                                      onClick={() => {
                                        onMoveToList(list.id);
                                        setShowCollections(false);
                                      }}
                                      className="w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-orange-500 hover:text-white transition-colors"
                                    >
                                      {list.title}
                                    </button>
                                  ))}
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                     </div>
                    </>
                 )}
              </div>

              <div className="markdown-body !bg-transparent !text-inherit">
                <Markdown 
                  remarkPlugins={[remarkGfm]} 
                  rehypePlugins={[rehypeRaw]}
                  components={{
                    img: ({ node: _node, ...props }) => {
                      // Fix relative images
                      if (props.src && !props.src.startsWith('http')) {
                        const baseUrl = `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch || 'main'}`;
                        const cleanPath = props.src.startsWith('./') ? props.src.slice(2) : props.src;
                        props.src = `${baseUrl}/${cleanPath}`;
                      }
                      return <img {...props} style={{ maxWidth: '100%', height: 'auto' }} />;
                    },
                    a: ({ node: _node, ...props }) => {
                      // Fix relative links
                      if (props.href && !props.href.startsWith('http') && !props.href.startsWith('#')) {
                        const baseUrl = `https://github.com/${repo.full_name}/blob/${repo.default_branch || 'main'}`;
                        const cleanPath = props.href.startsWith('./') ? props.href.slice(2) : props.href;
                        props.href = `${baseUrl}/${cleanPath}`;
                      }
                      return <a {...props} target="_blank" rel="noreferrer" />;
                    }
                  }}
                >
                  {readme || "No README found."}
                </Markdown>
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </motion.div>
  );
};
