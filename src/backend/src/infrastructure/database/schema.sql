-- AI Insight Hub - PostgreSQL Schema
-- Run: psql -d ai_insight_hub -f schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- CREATE EXTENSION IF NOT EXISTS vector; -- Enable if pgvector is installed

-- ─────────────────────────────────────────────
-- Sources
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sources (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,       -- newsapi | guardian | rss | arxiv | hackernews
  enabled BOOLEAN DEFAULT TRUE,
  poll_interval_minutes INTEGER DEFAULT 30,
  config JSONB DEFAULT '{}',
  last_polled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Raw Articles (pre-processing)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS raw_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_id VARCHAR(100) REFERENCES sources(id),
  url TEXT UNIQUE NOT NULL,
  url_hash VARCHAR(64) NOT NULL,   -- SHA-256 for fast dedup
  title TEXT NOT NULL,
  raw_content TEXT,
  author TEXT,
  published_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ DEFAULT NOW(),
  processing_status VARCHAR(20) DEFAULT 'pending',  -- pending | processing | done | failed | duplicate
  processing_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_raw_articles_url_hash ON raw_articles(url_hash);
CREATE INDEX IF NOT EXISTS idx_raw_articles_status ON raw_articles(processing_status);
CREATE INDEX IF NOT EXISTS idx_raw_articles_published ON raw_articles(published_at DESC);

-- ─────────────────────────────────────────────
-- Processed Articles
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raw_article_id UUID REFERENCES raw_articles(id),
  source_id VARCHAR(100) REFERENCES sources(id),
  url TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  clean_content TEXT,
  summary TEXT,
  key_takeaways JSONB DEFAULT '[]',   -- string[]
  category VARCHAR(50) NOT NULL DEFAULT 'other',
  importance_score INTEGER CHECK (importance_score BETWEEN 1 AND 10),
  importance_reason TEXT,
  is_breakthrough BOOLEAN DEFAULT FALSE,
  related_topics JSONB DEFAULT '[]',  -- string[]
  author TEXT,
  published_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  -- embedding vector(1536),           -- Enable with pgvector
  content_hash VARCHAR(64)            -- For near-duplicate detection
);

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_importance ON articles(importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_breakthrough ON articles(is_breakthrough) WHERE is_breakthrough = TRUE;

-- ─────────────────────────────────────────────
-- Daily Briefings
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_briefings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  headline_article_ids UUID[] DEFAULT '{}',
  executive_summary TEXT,
  key_trends JSONB DEFAULT '[]',      -- { title, description, articleCount }[]
  market_moves JSONB DEFAULT '[]',    -- { name, ticker, change, changePercent }[]
  article_count INTEGER DEFAULT 0,
  read_time_minutes INTEGER DEFAULT 4,
  built_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_briefings_date ON daily_briefings(date DESC);

-- ─────────────────────────────────────────────
-- Users
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- User Preferences
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  subscribed_categories JSONB DEFAULT '["llms","research","tools","startups","robotics","regulation"]',
  notification_enabled BOOLEAN DEFAULT TRUE,
  briefing_time VARCHAR(5) DEFAULT '07:00',   -- HH:MM local
  content_depth VARCHAR(20) DEFAULT 'summary', -- headlines | summary | full
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- Reading History
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reading_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  saved BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history(user_id, read_at DESC);
CREATE INDEX IF NOT EXISTS idx_reading_history_saved ON reading_history(user_id, saved) WHERE saved = TRUE;

-- ─────────────────────────────────────────────
-- Trend Signals
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS trend_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic VARCHAR(255) NOT NULL,
  article_count INTEGER DEFAULT 1,
  velocity FLOAT DEFAULT 0,          -- articles per hour
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_trends_detected ON trend_signals(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_trends_velocity ON trend_signals(velocity DESC);

-- ─────────────────────────────────────────────
-- Social Signals (Twitter, Reddit, HN posts)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS social_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform VARCHAR(20) NOT NULL,        -- twitter | reddit | hackernews | youtube
  external_id VARCHAR(200) UNIQUE NOT NULL,
  author_handle VARCHAR(100),
  author_tier INTEGER DEFAULT 3,         -- 1=top researcher, 2=notable, 3=community
  content TEXT,
  url TEXT,
  likes INTEGER DEFAULT 0,
  reposts INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  engagement_score FLOAT DEFAULT 0,
  linked_article_id UUID REFERENCES articles(id),
  posted_at TIMESTAMPTZ,
  ingested_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_platform ON social_signals(platform, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_tier ON social_signals(author_tier, posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_social_engagement ON social_signals(engagement_score DESC);

-- ─────────────────────────────────────────────
-- Topic Velocity (trend detection windows)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS topic_velocity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  topic VARCHAR(255) NOT NULL,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  article_count INTEGER DEFAULT 0,
  social_mention_count INTEGER DEFAULT 0,
  velocity_score FLOAT DEFAULT 0,       -- (current - prev) / prev
  is_breaking BOOLEAN DEFAULT FALSE,
  computed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_velocity_topic ON topic_velocity(topic, computed_at DESC);
CREATE INDEX IF NOT EXISTS idx_velocity_score ON topic_velocity(velocity_score DESC, computed_at DESC);

-- ─────────────────────────────────────────────
-- Tracked Accounts
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracked_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform VARCHAR(20) NOT NULL,        -- twitter | youtube
  handle VARCHAR(100) NOT NULL,
  display_name VARCHAR(255),
  tier INTEGER DEFAULT 2,
  category VARCHAR(50),                 -- researcher | founder | engineer | analyst
  active BOOLEAN DEFAULT TRUE,
  UNIQUE(platform, handle)
);
