import { useState } from 'react';
import { Search, BookOpen, ExternalLink } from 'lucide-react';
import { findCoursesOnline } from '../lib/careerbot-api';

interface Course {
  title: string;
  url: string;
  platform: string;
  content?: string;
}

const QUICK_TOPICS = [
  'Python',
  'React',
  'Machine Learning',
  'Node.js',
  'AWS',
  'UI/UX Design',
  'Data Science',
  'Docker',
];

export default function CoursesPage() {
  const [query, setQuery] = useState('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (topic?: string) => {
    const searchTopic = (topic || query).trim();
    if (!searchTopic) return;
    setLoading(true);
    setCourses([]);
    setSearched(true);
    if (!topic) setQuery(searchTopic);
    try {
      const results = await findCoursesOnline(searchTopic);
      setCourses(results);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      alert('Course search error: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleChipClick = (topic: string) => {
    setQuery(topic);
    handleSearch(topic);
  };

  return (
    <div className="page-container">
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1>Find Courses</h1>
          <p>Search Udemy and Coursera for any skill or topic</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="courses-search-bar">
        <div className="courses-search-input-wrap">
          <Search size={18} className="courses-search-icon" />
          <input
            type="text"
            className="courses-search-input"
            placeholder="Search for a skill, e.g. Python, React, Machine Learning..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          className="btn btn-primary"
          onClick={() => handleSearch()}
          disabled={!query.trim() || loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {/* Quick topic chips */}
      {!searched && (
        <div className="courses-empty-state">
          <div className="courses-empty-icon">
            <BookOpen size={32} />
          </div>
          <h3>Explore popular topics</h3>
          <p>Pick a topic below or type your own search above</p>
          <div className="courses-chips">
            {QUICK_TOPICS.map(topic => (
              <button
                key={topic}
                className="courses-chip"
                onClick={() => handleChipClick(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="courses-loading">
          <div className="courses-loading-spinner" />
          <span>Finding the best courses for you...</span>
        </div>
      )}

      {/* Results */}
      {!loading && searched && courses.length === 0 && (
        <div className="courses-no-results">
          <p>No courses found. Try a different search term.</p>
          <div className="courses-chips" style={{ marginTop: 16 }}>
            {QUICK_TOPICS.map(topic => (
              <button
                key={topic}
                className="courses-chip"
                onClick={() => handleChipClick(topic)}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      )}

      {!loading && courses.length > 0 && (
        <>
          <div className="courses-results-meta">
            <span>{courses.length} courses found</span>
            <div className="courses-platform-counts">
              <span className="badge badge-interviewed">
                Udemy: {courses.filter(c => c.platform === 'Udemy').length}
              </span>
              <span className="badge badge-reviewing">
                Coursera: {courses.filter(c => c.platform === 'Coursera').length}
              </span>
            </div>
          </div>

          <div className="courses-grid">
            {courses.map((course, i) => (
              <a
                key={i}
                href={course.url}
                target="_blank"
                rel="noopener noreferrer"
                className="course-card"
              >
                <div className="course-card-top">
                  <span
                    className={`badge ${course.platform === 'Udemy' ? 'badge-interviewed' : 'badge-reviewing'}`}
                  >
                    {course.platform}
                  </span>
                </div>
                <div className="course-card-title">{course.title}</div>
                {course.content && (
                  <div className="course-card-desc">
                    {course.content.slice(0, 130)}
                    {course.content.length > 130 ? '...' : ''}
                  </div>
                )}
                <div className="course-card-link">
                  <ExternalLink size={13} />
                  View Course
                </div>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
