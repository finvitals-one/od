import React, { useState, useMemo, useEffect } from 'react';
import { ChevronDown, Search, Filter, Bell, ExternalLink, Loader } from 'lucide-react';

const ClinicalInvestorDaily = () => {
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
    'market': true,
    'article': true,
  });
  const [view, setView] = useState('today');
  const [expandedId, setExpandedId] = useState(null);

  // Load posts from JSON
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const possiblePaths = ['/posts.json', '/public/posts.json'];
        let data = null;

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
            console.log(`⚠️ Couldn't load from ${path}`);
          }
        }

        if (!data) {
          throw new Error('Could not load posts.json');
        }

        let postsArray = Array.isArray(data) ? data : (data.posts || []);
        const sortedPosts = postsArray
          .filter(post => post.id && post.date && post.title)
          .sort((a, b) => {
            const dateCompare = new Date(b.date) - new Date(a.date);
            return dateCompare !== 0 ? dateCompare : b.id - a.id;
          });

        setPosts(sortedPosts);
        setError(null);
        console.log(`✅ Loaded ${sortedPosts.length} posts`);
      } catch (err) {
        console.error('❌ Error loading posts:', err);
        setError(err.message);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
    const interval = setInterval(fetchPosts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Embed loaders
  useEffect(() => {
    if (window.twttr && window.twttr.widgets) {
      window.twttr.widgets.load();
    } else {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      document.body.appendChild(script);
    }

    if (window.IN && window.IN.parse) {
      window.IN.parse();
    } else {
      const script = document.createElement('script');
      script.src = 'https://www.linkedin.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.twttr && window.twttr.widgets) window.twttr.widgets.load();
      if (window.IN && window.IN.parse) window.IN.parse();
    }, 300);
    return () => clearTimeout(timer);
  }, [expandedId, view]);

  const allTags = useMemo(() => [...new Set(posts.flatMap(p => p.tags || []))].sort(), [posts]);
  const allTypes = useMemo(() => [...new Set(posts.map(p => p.type))], [posts]);
  const allSources = useMemo(() => [...new Set(posts.map(p => p.source))], [posts]);
  const today = new Date().toISOString().split('T')[0];

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

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleType = (type) => {
    setSelectedTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  };

  const toggleSource = (source) => {
    setSelectedSources(prev => prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]);
  };

  const toggleSubscription = (type) => {
    setSubscriptions(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const typeLabel = {
    'post': 'Posts',
    'market': 'Market Updates',
    'article': 'Articles',
  };

  const sourceLabel = {
    'linkedin': 'LinkedIn',
    'x': 'X/Twitter',
    'instagram': 'Instagram',
    'facebook': 'Facebook',
    'substack': 'Substack',
    'internal': 'Internal',
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    header: {
      position: 'sticky',
      top: 0,
      zIndex: 20,
      backgroundColor: '#0f172a',
      borderBottom: '1px solid #1e293b',
      padding: '32px 24px',
      maxWidth: '56rem',
      margin: '0 auto',
    },
    headerTitle: {
      fontSize: '32px',
      fontWeight: 'bold',
      marginBottom: '8px',
      fontFamily: 'Georgia, serif',
    },
    headerSubtitle: {
      fontSize: '14px',
      color: '#94a3b8',
      marginBottom: '24px',
    },
    buttonGroup: {
      display: 'flex',
      gap: '12px',
    },
    button: {
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      border: '1px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.2s',
    },
    buttonActive: {
      backgroundColor: '#a855f7',
      color: '#ffffff',
    },
    buttonInactive: {
      backgroundColor: '#1e293b',
      color: '#cbd5e1',
    },
    main: {
      maxWidth: '56rem',
      margin: '0 auto',
      padding: '32px 24px',
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingY: '48px',
    },
    errorBox: {
      backgroundColor: '#7c2d12',
      border: '1px solid #92400e',
      borderRadius: '6px',
      padding: '16px',
      marginBottom: '24px',
    },
    errorTitle: {
      color: '#fecaca',
      fontSize: '14px',
      fontWeight: '600',
    },
    errorMessage: {
      color: '#f87171',
      fontSize: '12px',
      marginTop: '4px',
    },
    postsList: {
      border: '1px solid #1e293b',
      borderRadius: '6px',
      overflow: 'hidden',
    },
    postCard: {
      backgroundColor: '#0f172a',
      borderBottom: '1px solid #1e293b',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      padding: '24px',
    },
    postCardHover: {
      backgroundColor: '#1a2332',
    },
    postMeta: {
      display: 'flex',
      gap: '8px',
      marginBottom: '12px',
      fontSize: '12px',
    },
    postType: {
      backgroundColor: '#581c87',
      color: '#c084fc',
      padding: '4px 8px',
      borderRadius: '4px',
      fontSize: '12px',
      fontWeight: '600',
    },
    postDate: {
      color: '#78716c',
      fontSize: '12px',
    },
    postTitle: {
      fontSize: '18px',
      fontWeight: 'bold',
      marginBottom: '8px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
    },
    postExcerpt: {
      fontSize: '14px',
      color: '#cbd5e1',
      lineHeight: '1.5',
      marginBottom: '12px',
    },
    tagContainer: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
      marginTop: '12px',
    },
    tag: {
      fontSize: '12px',
      color: '#64748b',
      backgroundColor: '#1e293b',
      padding: '4px 8px',
      borderRadius: '4px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
    },
    tagHover: {
      backgroundColor: '#334155',
    },
    chevron: {
      color: '#64748b',
      flexShrink: 0,
      transition: 'transform 0.2s',
    },
    expandedContent: {
      marginTop: '24px',
      paddingTop: '24px',
      borderTop: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
    },
    commentary: {
      padding: '16px',
      backgroundColor: '#1e293b',
      borderRadius: '6px',
      border: '1px solid #1e293b',
    },
    commentaryText: {
      fontSize: '14px',
      color: '#cbd5e1',
    },
    content: {
      fontSize: '14px',
      color: '#cbd5e1',
      lineHeight: '1.6',
      whiteSpace: 'pre-wrap',
    },
    embedBox: {
      marginY: '24px',
      paddingTop: '16px',
      borderTop: '1px solid #1e293b',
    },
    embedLabel: {
      fontSize: '12px',
      color: '#64748b',
      marginBottom: '12px',
    },
    embedContent: {
      backgroundColor: '#1e293b',
      borderRadius: '6px',
      padding: '16px',
      minHeight: '200px',
      overflow: 'hidden',
    },
    link: {
      color: '#c084fc',
      textDecoration: 'none',
      cursor: 'pointer',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    linkHover: {
      color: '#d8b4fe',
    },
    footer: {
      borderTop: '1px solid #1e293b',
      marginTop: '64px',
      paddingY: '32px',
      textAlign: 'center',
      color: '#64748b',
      fontSize: '12px',
    },
    searchInput: {
      width: '100%',
      backgroundColor: '#1e293b',
      color: '#ffffff',
      border: '1px solid #1e293b',
      borderRadius: '6px',
      padding: '12px 16px 12px 40px',
      fontSize: '14px',
      outline: 'none',
    },
    filterSection: {
      padding: '16px',
      backgroundColor: '#1e293b',
      borderRadius: '6px',
      border: '1px solid #1e293b',
      cursor: 'pointer',
    },
    filterSummary: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '14px',
      fontWeight: '500',
      color: '#ffffff',
    },
    filterLabel: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '12px',
    },
    filterButtons: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '8px',
    },
    filterButton: {
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      border: 'none',
    },
    filterButtonActive: {
      backgroundColor: '#a855f7',
      color: '#ffffff',
    },
    filterButtonInactive: {
      backgroundColor: '#0f172a',
      color: '#cbd5e1',
    },
    settingsContainer: {
      marginTop: '24px',
    },
    settingsTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      marginBottom: '16px',
      fontFamily: 'Georgia, serif',
    },
    settingsDescription: {
      color: '#64748b',
      fontSize: '14px',
      marginBottom: '32px',
    },
    checkboxLabel: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      border: '1px solid #1e293b',
      borderRadius: '6px',
      cursor: 'pointer',
      transition: 'background-color 0.2s',
      marginBottom: '16px',
    },
    checkboxLabelHover: {
      backgroundColor: '#1e293b',
    },
    checkbox: {
      width: '20px',
      height: '20px',
      cursor: 'pointer',
      accentColor: '#a855f7',
    },
    divider: {
      borderTop: '1px solid #1e293b',
      marginTop: '32px',
      paddingTop: '32px',
    },
  };

  const PostCard = ({ post }) => {
    const isExpanded = expandedId === post.id;
    const [isHover, setIsHover] = useState(false);
    const [isTagHover, setIsTagHover] = useState({});

    return (
      <div
        style={{
          ...styles.postCard,
          ...(isHover ? styles.postCardHover : {}),
        }}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
      >
        <button
          onClick={() => setExpandedId(isExpanded ? null : post.id)}
          style={{
            width: '100%',
            textAlign: 'left',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={styles.postMeta}>
              <span style={styles.postType}>{typeLabel[post.type]}</span>
              <span style={styles.postDate}>{sourceLabel[post.source] || post.source}</span>
              <span style={styles.postDate}>
                {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <h3 style={styles.postTitle}>{post.title}</h3>
            <p style={styles.postExcerpt}>{post.excerpt}</p>
            {post.tags && post.tags.length > 0 && (
              <div style={styles.tagContainer}>
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    style={{
                      ...styles.tag,
                      ...(isTagHover[tag] ? styles.tagHover : {}),
                    }}
                    onMouseEnter={() => setIsTagHover(prev => ({ ...prev, [tag]: true }))}
                    onMouseLeave={() => setIsTagHover(prev => ({ ...prev, [tag]: false }))}
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
          <ChevronDown
            size={20}
            style={{
              ...styles.chevron,
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {isExpanded && (
          <div style={styles.expandedContent}>
            {post.commentary && (
              <div style={styles.commentary}>
                <p style={styles.commentaryText}>
                  <span style={{ color: '#c084fc', fontWeight: '600' }}>Note: </span>
                  {post.commentary}
                </p>
              </div>
            )}
            <p style={styles.content}>{post.content}</p>
            {post.embedUrl && post.embedUrl !== '(empty)' && (
              <div style={styles.embedBox}>
                <p style={styles.embedLabel}>Embedded content:</p>
                <div style={styles.embedContent}>
                  {post.embedUrl.includes('linkedin') && (
                    <iframe
                      src={post.embedUrl}
                      width="100%"
                      height="400"
                      frameBorder="0"
                      title={post.title}
                    />
                  )}
                  {(post.embedUrl.includes('twitter') || post.embedUrl.includes('x.com')) && (
                    <blockquote className="twitter-tweet">
                      <a href={post.embedUrl}>{post.title}</a>
                    </blockquote>
                  )}
                  {post.embedUrl.includes('instagram') && (
                    <iframe
                      src={post.embedUrl + 'embed/'}
                      width="100%"
                      height="400"
                      frameBorder="0"
                      scrolling="no"
                      allowFullScreen={true}
                      title={post.title}
                    />
                  )}
                  {!post.embedUrl.includes('linkedin') &&
                    !post.embedUrl.includes('twitter') &&
                    !post.embedUrl.includes('x.com') &&
                    !post.embedUrl.includes('instagram') && (
                    <a href={post.embedUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
                      View embedded content <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </div>
            )}
            {post.url && (
              <a href={post.url} target="_blank" rel="noopener noreferrer" style={styles.link}>
                View Original <ExternalLink size={14} />
              </a>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Clinical Investor Daily</h1>
        <p style={styles.headerSubtitle}>
          Curated daily insights on healthcare investing, frameworks, and market analysis
        </p>
        <div style={styles.buttonGroup}>
          <button
            onClick={() => setView('today')}
            style={{
              ...styles.button,
              ...(view === 'today' ? styles.buttonActive : styles.buttonInactive),
            }}
          >
            Today
          </button>
          <button
            onClick={() => setView('archive')}
            style={{
              ...styles.button,
              ...(view === 'archive' ? styles.buttonActive : styles.buttonInactive),
            }}
          >
            Archive
          </button>
          <button
            onClick={() => setView('settings')}
            style={{
              ...styles.button,
              ...(view === 'settings' ? styles.buttonActive : styles.buttonInactive),
            }}
          >
            Settings
          </button>
        </div>
      </div>

      <div style={styles.main}>
        {/* Loading State */}
        {loading && (
          <div style={styles.loadingContainer}>
            <Loader size={32} style={{ color: '#a855f7', marginBottom: '12px', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#64748b' }}>Loading your digest...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={styles.errorBox}>
            <p style={styles.errorTitle}>Unable to load posts</p>
            <p style={styles.errorMessage}>{error}</p>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <>
            {/* Today View */}
            {view === 'today' && (
              <div>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                  {filteredPosts.length} post{filteredPosts.length !== 1 ? 's' : ''} today
                </p>
                {filteredPosts.length > 0 ? (
                  <div style={styles.postsList}>
                    {filteredPosts.map(post => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', paddingY: '48px', backgroundColor: '#1e293b', borderRadius: '6px', border: '1px solid #1e293b' }}>
                    <p style={{ color: '#64748b' }}>No posts today yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* Archive View */}
            {view === 'archive' && (
              <div>
                <div style={{ marginBottom: '24px', position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    placeholder="Search posts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={styles.searchInput}
                  />
                </div>

                <details style={styles.filterSection}>
                  <summary style={styles.filterSummary}>
                    <Filter size={16} />
                    Filters
                  </summary>
                  <div style={{ marginTop: '16px', borderTop: '1px solid #0f172a', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Date Range */}
                    <div>
                      <p style={styles.filterLabel}>Date Range</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                          type="date"
                          value={dateRange.from}
                          onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                          style={{ ...styles.searchInput, flex: 1, paddingLeft: '12px' }}
                        />
                        <input
                          type="date"
                          value={dateRange.to}
                          onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                          style={{ ...styles.searchInput, flex: 1, paddingLeft: '12px' }}
                        />
                      </div>
                    </div>

                    {/* Type Filter */}
                    <div>
                      <p style={styles.filterLabel}>Content Type</p>
                      <div style={styles.filterButtons}>
                        {allTypes.map(type => (
                          <button
                            key={type}
                            onClick={() => toggleType(type)}
                            style={{
                              ...styles.filterButton,
                              ...(selectedTypes.includes(type) ? styles.filterButtonActive : styles.filterButtonInactive),
                            }}
                          >
                            {typeLabel[type]}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Source Filter */}
                    <div>
                      <p style={styles.filterLabel}>Source</p>
                      <div style={styles.filterButtons}>
                        {allSources.map(source => (
                          <button
                            key={source}
                            onClick={() => toggleSource(source)}
                            style={{
                              ...styles.filterButton,
                              ...(selectedSources.includes(source) ? styles.filterButtonActive : styles.filterButtonInactive),
                            }}
                          >
                            {sourceLabel[source] || source}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Tag Filter */}
                    <div>
                      <p style={styles.filterLabel}>Topics</p>
                      <div style={styles.filterButtons}>
                        {allTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            style={{
                              ...styles.filterButton,
                              ...(selectedTags.includes(tag) ? styles.filterButtonActive : styles.filterButtonInactive),
                              fontSize: '12px',
                              padding: '4px 8px',
                            }}
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
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#64748b',
                          fontSize: '14px',
                          cursor: 'pointer',
                          padding: 0,
                          textAlign: 'left',
                        }}
                      >
                        ✕ Clear all filters
                      </button>
                    )}
                  </div>
                </details>

                {/* Results */}
                {filteredPosts.length > 0 ? (
                  <div style={{ marginTop: '24px' }}>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '16px' }}>
                      {filteredPosts.length} result{filteredPosts.length !== 1 ? 's' : ''}
                    </p>
                    <div style={styles.postsList}>
                      {filteredPosts.map(post => (
                        <PostCard key={post.id} post={post} />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', paddingY: '48px', backgroundColor: '#1e293b', borderRadius: '6px', border: '1px solid #1e293b', marginTop: '24px' }}>
                    <p style={{ color: '#64748b' }}>No posts found. Try adjusting your filters.</p>
                  </div>
                )}
              </div>
            )}

            {/* Settings View */}
            {view === 'settings' && (
              <div style={styles.settingsContainer}>
                <h2 style={styles.settingsTitle}>Subscription Preferences</h2>
                <p style={styles.settingsDescription}>
                  Choose which content types appear in your digest.
                </p>

                <div>
                  {Object.keys(subscriptions).map(type => (
                    <label key={type} style={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={subscriptions[type]}
                        onChange={() => toggleSubscription(type)}
                        style={styles.checkbox}
                      />
                      <div>
                        <p style={{ fontWeight: '500', color: '#ffffff', margin: 0 }}>
                          {typeLabel[type]}
                        </p>
                        <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                          {type === 'post' && 'LinkedIn, X, Instagram, Facebook posts with full embeds'}
                          {type === 'market' && 'Market snapshots & sector updates'}
                          {type === 'article' && 'Substack articles & deep-dives'}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                <div style={styles.divider}>
                  <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', fontFamily: 'Georgia, serif' }}>
                    About This Digest
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
                    The Clinical Investor Daily aggregates Nisheeth's content with full platform embeds. See posts from LinkedIn, X, Instagram, and Facebook rendered directly in the digest.
                  </p>
                  <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                    Updated automatically daily via Google Sheets → GitHub → Netlify pipeline. Archive is fully searchable and filterable.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <a href="https://finvitals.in" target="_blank" rel="noopener noreferrer" style={styles.link}>
                      FinVitals →
                    </a>
                    <a href="https://substack.com/clinical-investor" target="_blank" rel="noopener noreferrer" style={styles.link}>
                      Substack →
                    </a>
                    <a href="https://linkedin.com/in/drnisheeth" target="_blank" rel="noopener noreferrer" style={styles.link}>
                      LinkedIn →
                    </a>
                    <a href="https://x.com/drnisheeth" target="_blank" rel="noopener noreferrer" style={styles.link}>
                      X →
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>© 2026 The Clinical Investor • Full platform embeds • Updated daily</p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ClinicalInvestorDaily;