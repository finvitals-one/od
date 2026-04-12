import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, Search, Filter, Bell, Calendar, Tag, ExternalLink, Zap, Loader } from 'lucide-react';
import { ReactComponent as FinvitalsLogo } from '../assets/LOGO.svg';

const FinvitalsDaily = () => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [subscriptions, setSubscriptions] = useState({
    'post': true,
    'article': true,
    'other': true,
  });
  const [view, setView] = useState('today');
  const [expandedId, setExpandedId] = useState(null);
  const [loadingEmbeds, setLoadingEmbeds] = useState(new Set());

  // ============================================================================
  // LOAD POSTS FROM JSON
  // ============================================================================
  
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        
        // Try multiple paths for flexibility (Netlify, local, different structures)
        const possiblePaths = [
          '/posts.json',              // Root (common in SPA)
          '/public/posts.json',       // Public folder
          process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/posts.json` : null,
          './posts.json',             // Relative
        ].filter(Boolean);

        let data = null;
        let lastError = null;

        // Try each path until one succeeds
        for (const path of possiblePaths) {
          try {
            const response = await fetch(path, {
              headers: { 'Cache-Control': 'no-cache' }
            });
            
            if (response.ok) {
              data = await response.json();
              console.log(`✅ Loaded posts from ${path}`);
              break;
            }
          } catch (err) {
            lastError = err;
            console.log(`⚠️  Couldn't load from ${path}:`, err.message);
          }
        }

        if (!data) {
          throw new Error(
            `Could not load posts.json from any path. Tried: ${possiblePaths.join(', ')}`
          );
        }

        // Validate and sort data
        if (Array.isArray(data)) {
          // Sort by date (newest first), then by ID
          const sortedPosts = data
            .filter(post => post.id && post.date && post.title) // Validate required fields
            .sort((a, b) => {
              const dateCompare = new Date(b.date) - new Date(a.date);
              return dateCompare !== 0 ? dateCompare : b.id - a.id;
            });

          setPosts(sortedPosts);
          setError(null);
          console.log(`✅ Loaded ${sortedPosts.length} posts`);
        } else {
          throw new Error('posts.json is not an array');
        }
      } catch (err) {
        console.error('❌ Error loading posts:', err);
        setError(err.message);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();

    // Optionally refresh every 5 minutes
    const interval = setInterval(fetchPosts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ============================================================================
  // EMBED PLATFORM LOADERS
  // ============================================================================
  
  useEffect(() => {
    // Load Twitter/X Widget
    const loadTwitterWidget = () => {
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load();
      } else {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.charset = 'utf-8';
        document.body.appendChild(script);
      }
    };

    // Load LinkedIn Embed
    const loadLinkedInEmbed = () => {
      if (window.IN && window.IN.parse) {
        window.IN.parse();
      } else {
        const script = document.createElement('script');
        script.src = 'https://www.linkedin.com/embed.js';
        script.async = true;
        script.charset = 'utf-8';
        document.body.appendChild(script);
      }
    };

    // Load Facebook SDK
    const loadFacebookSDK = () => {
      if (window.FB) {
        window.FB.XFBML.parse();
      } else {
        window.fbAsyncInit = function () {
          FB.init({
            xfbml: true,
            version: 'v18.0'
          });
          FB.XFBML.parse();
        };
        const script = document.createElement('script');
        script.src = 'https://connect.facebook.net/en_US/sdk.js#xfbml=1&version=v18.0';
        script.async = true;
        script.defer = true;
        script.crossOrigin = 'anonymous';
        document.body.appendChild(script);
      }
    };

    // Load Instagram Embed
    const loadInstagramEmbed = () => {
      if (window.instgrm && window.instgrm.Embeds) {
        window.instgrm.Embeds.process();
      } else {
        const script = document.createElement('script');
        script.src = 'https://www.instagram.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
      }
    };

    loadTwitterWidget();
    loadLinkedInEmbed();
    loadFacebookSDK();
    loadInstagramEmbed();
  }, []);

  // Refresh embeds when expanded or when view changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load();
      }
      if (window.IN && window.IN.parse) {
        window.IN.parse();
      }
      if (window.FB && window.FB.XFBML) {
        window.FB.XFBML.parse();
      }
      if (window.instgrm && window.instgrm.Embeds) {
        window.instgrm.Embeds.process();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [expandedId, view]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  
  // Extract unique tags, types, sources
  const allTags = useMemo(() => [...new Set(posts.flatMap(p => p.tags || []))].sort(), [posts]);
  const allTypes = useMemo(() => [...new Set(posts.map(p => p.type))], [posts]);
  const allSources = useMemo(() => [...new Set(posts.map(p => p.source))], [posts]);

  // Get today's date for "Today" view
  const today = new Date().toISOString().split('T')[0];

  // ============================================================================
  // FILTER LOGIC
  // ============================================================================
  
  const filteredPosts = useMemo(() => {
    let result = posts.filter(p => subscriptions[p.type] !== false);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title?.toLowerCase().includes(query) ||
        p.excerpt?.toLowerCase().includes(query) ||
        p.content?.toLowerCase().includes(query)
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter(p => selectedTags.some(tag => (p.tags || []).includes(tag)));
    }

    if (selectedTypes.length > 0) {
      result = result.filter(p => selectedTypes.includes(p.type));
    }

    if (selectedSources.length > 0) {
      result = result.filter(p => selectedSources.includes(p.source));
    }

    if (dateRange.from || dateRange.to) {
      result = result.filter(p => {
        const pDate = p.date;
        if (dateRange.from && pDate < dateRange.from) return false;
        if (dateRange.to && pDate > dateRange.to) return false;
        return true;
      });
    }

    if (view === 'today') {
      result = result.filter(p => p.date === today);
    }

    return result;
  }, [posts, searchQuery, selectedTags, selectedTypes, selectedSources, dateRange, subscriptions, view, today]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const toggleType = (type) => {
    setSelectedTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleSource = (source) => {
    setSelectedSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]
    );
  };

  const toggleSubscription = (type) => {
    setSubscriptions(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  // ============================================================================
  // COMPONENTS
  // ============================================================================
  
  const typeLabel = {
    'post': 'Posts',
    'article': 'Articles',
    'other': 'Other',
  };

  const sourceLabel = {
    'linkedin': 'LinkedIn',
    'x': 'X/Twitter',
    'instagram': 'Instagram',
    'facebook': 'Facebook',
    'substack': 'Substack',
    'youtube': 'YouTube',
    'telegram': 'Telegram',
    'internal': 'Internal',
  };

  const PostCard = ({ post }) => {
    const isExpanded = expandedId === post.id;

    return (
      <div className="bg-white border-b border-emerald-200 hover:bg-emerald-50 transition-colors group">
        <button
          onClick={() => setExpandedId(isExpanded ? null : post.id)}
          className="w-full text-left p-6 hover:bg-emerald-50 transition-colors"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {/* Meta */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded">
                  {typeLabel[post.type]}
                </span>
                <span className="text-xs text-slate-600">
                  {sourceLabel[post.source] || post.source}
                </span>
                <span className="text-xs text-slate-600">
                  {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-lg font-serif font-bold text-slate-800 mb-2 group-hover:text-emerald-700 transition-colors">
                {post.title}
              </h3>

              {/* Excerpt */}
              <p className="text-slate-700 text-sm leading-relaxed">
                {post.excerpt}
              </p>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {post.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-xs text-slate-700 bg-emerald-100 px-2 py-1 rounded hover:bg-emerald-200 cursor-pointer transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!selectedTags.includes(tag)) toggleTag(tag);
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Chevron */}
            <ChevronDown
              size={20}
              className={`text-slate-600 flex-shrink-0 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-6 pt-6 border-t border-emerald-200 space-y-4">
              {/* Commentary */}
              {post.commentary && (
                <div className="p-4 bg-emerald-50 rounded border border-emerald-200">
                  <p className="text-sm text-slate-700">
                    <span className="text-emerald-700 font-semibold">Note: </span>
                    {post.commentary}
                  </p>
                </div>
              )}

              {/* Content */}
              <div className="prose prose-sm max-w-none prose-p:text-slate-700 prose-p:text-sm prose-p:leading-relaxed">
                <p className="text-slate-700 text-sm whitespace-pre-wrap">{post.content}</p>
              </div>

              {/* Embed */}
              {post.embedUrl && (
                <div className="my-6 pt-4 border-t border-emerald-200">
                  <p className="text-xs text-slate-600 mb-3">Embedded content:</p>
                  <div
                    className="bg-emerald-50 rounded p-4 min-h-[200px] overflow-hidden"
                  >
                    {post.embedUrl.includes('linkedin') && (
                      <iframe
                        src={post.embedUrl}
                        width="100%"
                        height="400"
                        frameBorder="0"
                        title={post.title}
                      />
                    )}
                    {post.embedUrl.includes('twitter') || post.embedUrl.includes('x.com') ? (
                      <blockquote className="twitter-tweet">
                        <a href={post.embedUrl}>{post.title}</a>
                      </blockquote>
                    ) : null}
                    {post.embedUrl.includes('instagram') && (
                      <iframe
                        src={post.embedUrl + 'embed/'}
                        width="100%"
                        height="400"
                        frameBorder="0"
                        title={post.title}
                      />
                    )}
                    {post.embedUrl.includes('facebook') && (
                      <iframe
                        src={post.embedUrl}
                        width="100%"
                        height="400"
                        frameBorder="0"
                        title={post.title}
                      />
                    )}
                    {post.embedUrl.includes('youtube') && (
                      <iframe
                        width="100%"
                        height="400"
                        src={post.embedUrl}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={post.title}
                      />
                    )}
                    {post.embedUrl.includes('substack') && (
                      <iframe
                        src={post.embedUrl}
                        width="100%"
                        height="400"
                        frameBorder="0"
                        title={post.title}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* CTA */}
              {post.link && (
                <a
                  href={post.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-4 text-emerald-700 hover:text-emerald-900 text-sm font-medium transition-colors"
                >
                  Read more <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}
        </button>
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="min-h-screen bg-emerald-50 text-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-emerald-50 border-b border-emerald-200 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Finvitals Logo */}
              <div className="flex-shrink-0">
                <FinvitalsLogo className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-3xl font-serif font-bold text-slate-800 mb-2">FINVITALS DAILY</h1>
                <p className="text-slate-700 text-sm">
                  Your Daily Dose of Vital Financial Knowledge & Wisdom
                </p>
              </div>
            </div>
            <Bell size={24} className="text-slate-600" />
          </div>

          {/* View Switcher */}
          <div className="flex gap-3">
            <button
              onClick={() => setView('today')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                view === 'today'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setView('archive')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                view === 'archive'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-slate-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Archive
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader size={32} className="text-emerald-600 animate-spin mb-3" />
            <p className="text-slate-700">Loading your digest...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
            <p className="text-red-800 text-sm font-semibold">Unable to load posts</p>
            <p className="text-red-700 text-xs mt-1">{error}</p>
            <p className="text-red-700 text-xs mt-2">
              Make sure <code className="bg-red-100 px-1 rounded">public/posts.json</code> is accessible and contains valid JSON.
            </p>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <>
            {/* Today View */}
            {view === 'today' && (
              <div>
                <p className="text-slate-700 text-sm mb-6">
                  {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} today
                </p>
                {filteredPosts.length > 0 ? (
                  <div className="divide-y divide-emerald-200 rounded border border-emerald-200 overflow-hidden">
                    {filteredPosts.map(post => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded border border-emerald-200">
                    <p className="text-slate-700">No posts today yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Archive View */}
            {view === 'archive' && (
              <div>
                <div className="mb-6 p-4 bg-white rounded border border-emerald-200">
                  <details className="cursor-pointer group">
                    <summary className="flex items-center justify-between font-medium text-slate-800 hover:text-emerald-700 transition-colors">
                      <span className="flex items-center gap-2">
                        <Filter size={18} />
                        Filters
                      </span>
                      <ChevronDown size={18} className="group-open:rotate-180 transition-transform" />
                    </summary>

                    <div className="mt-6 space-y-6 pt-6 border-t border-emerald-200">
                      {/* Search */}
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                          Search
                        </p>
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-3 text-slate-500" />
                          <input
                            type="text"
                            placeholder="Search posts..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-emerald-200 rounded bg-white text-slate-800 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Date Range */}
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                          Date Range
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="date"
                            value={dateRange.from}
                            onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                            className="px-3 py-2 border border-emerald-200 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors"
                          />
                          <input
                            type="date"
                            value={dateRange.to}
                            onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                            className="px-3 py-2 border border-emerald-200 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 transition-colors"
                          />
                        </div>
                      </div>

                      {/* Type Filter */}
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                          Content Type
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {allTypes.map(type => (
                            <button
                              key={type}
                              onClick={() => toggleType(type)}
                              className={`px-3 py-2 rounded text-sm transition-colors ${
                                selectedTypes.includes(type)
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white text-slate-700 border border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {typeLabel[type]}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Source Filter */}
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                          Source
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {allSources.map(source => (
                            <button
                              key={source}
                              onClick={() => toggleSource(source)}
                              className={`px-3 py-2 rounded text-sm transition-colors ${
                                selectedSources.includes(source)
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-white text-slate-700 border border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {sourceLabel[source] || source}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Tag Filter */}
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                          Topics
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {allTags.map(tag => (
                            <button
                              key={tag}
                              onClick={() => toggleTag(tag)}
                              className={`px-3 py-1 rounded text-xs transition-colors ${
                                selectedTags.includes(tag)
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-emerald-100 text-slate-700 hover:bg-emerald-200'
                              }`}
                            >
                              #{tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Clear Filters */}
                      {(searchQuery || selectedTags.length > 0 || selectedTypes.length > 0 || selectedSources.length > 0 || dateRange.from || dateRange.to) && (
                        <button
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedTags([]);
                            setSelectedTypes([]);
                            setSelectedSources([]);
                            setDateRange({ from: '', to: '' });
                          }}
                          className="text-sm text-slate-700 hover:text-emerald-700 transition-colors"
                        >
                          ✕ Clear all filters
                        </button>
                      )}
                    </div>
                  </details>
                </div>

                {/* Results */}
                {filteredPosts.length > 0 ? (
                  <div>
                    <div className="mb-4 text-slate-700 text-sm">
                      {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''}
                    </div>
                    <div className="divide-y divide-emerald-200 rounded border border-emerald-200 overflow-hidden">
                      {filteredPosts.map(post => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 bg-white rounded border border-emerald-200">
                    <p className="text-slate-700">No posts found. Try adjusting your filters.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-emerald-200 mt-16 py-8 text-center text-slate-700 text-xs">
        <a href="https://www.finvitals.in" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-900 font-medium transition-colors">
          www.finvitals.in
        </a>
      </div>
    </div>
  );
};

export default FinvitalsDaily;