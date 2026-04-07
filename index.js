const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.FOOTBALL_API_KEY || '57df377dcf3548ce9f030b7333b1422a';
const BASE_URL = 'http://api.football-data.org/v4';

// Helper to call football-data.org
async function footballFetch(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': API_KEY }
  });
  return response.json();
}

// ── COMPETITIONS ──────────────────────────────────────────────

// GET /competitions
// Returns flat list: id, name, code, type, emblem, area_name
app.get('/competitions', async (req, res) => {
  try {
    const data = await footballFetch('/competitions');
    const result = data.competitions.map(c => ({
      id: c.id,
      name: c.name,
      code: c.code || '',
      type: c.type || '',
      emblem: c.emblem || '',
      area_name: c.area ? c.area.name : ''
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /competitions/:code
// Returns single competition flat object
app.get('/competitions/:code', async (req, res) => {
  try {
    const data = await footballFetch(`/competitions/${req.params.code}`);
    res.json({
      id: data.id,
      name: data.name,
      code: data.code || '',
      type: data.type || '',
      emblem: data.emblem || '',
      area_name: data.area ? data.area.name : ''
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── STANDINGS ─────────────────────────────────────────────────

// GET /standings/:code?season=2023&matchday=1
// Returns flat list: position, team_name, team_short, played, won, draw, lost, points, gf, ga, gd
app.get('/standings/:code', async (req, res) => {
  try {
    let path = `/competitions/${req.params.code}/standings`;
    const params = [];
    if (req.query.season) params.push(`season=${req.query.season}`);
    if (req.query.matchday) params.push(`matchday=${req.query.matchday}`);
    if (params.length) path += '?' + params.join('&');

    const data = await footballFetch(path);
    const table = data.standings && data.standings[0] ? data.standings[0].table : [];
    const result = table.map(row => ({
      position: row.position,
      team_id: row.team ? row.team.id : 0,
      team_name: row.team ? row.team.name : '',
      team_short: row.team ? row.team.shortName : '',
      played: row.playedGames,
      won: row.won,
      draw: row.draw,
      lost: row.lost,
      points: row.points,
      goals_for: row.goalsFor,
      goals_against: row.goalsAgainst,
      goal_diff: row.goalDifference
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── MATCHES ───────────────────────────────────────────────────

// GET /matches/:code?season=2023&matchday=1&status=FINISHED&dateFrom=2024-01-01&dateTo=2024-01-31
// Returns flat list of matches
app.get('/matches/:code', async (req, res) => {
  try {
    let path = `/competitions/${req.params.code}/matches`;
    const params = [];
    if (req.query.season) params.push(`season=${req.query.season}`);
    if (req.query.matchday) params.push(`matchday=${req.query.matchday}`);
    if (req.query.status) params.push(`status=${req.query.status}`);
    if (req.query.dateFrom) params.push(`dateFrom=${req.query.dateFrom}`);
    if (req.query.dateTo) params.push(`dateTo=${req.query.dateTo}`);
    if (params.length) path += '?' + params.join('&');

    const data = await footballFetch(path);
    const result = (data.matches || []).map(m => ({
      id: m.id,
      utc_date: m.utcDate || '',
      status: m.status || '',
      matchday: m.matchday || 0,
      home_team_id: m.homeTeam ? m.homeTeam.id : 0,
      home_team_name: m.homeTeam ? m.homeTeam.name : '',
      away_team_id: m.awayTeam ? m.awayTeam.id : 0,
      away_team_name: m.awayTeam ? m.awayTeam.name : '',
      winner: m.score ? (m.score.winner || '') : '',
      home_score: m.score && m.score.fullTime ? (m.score.fullTime.home || 0) : 0,
      away_score: m.score && m.score.fullTime ? (m.score.fullTime.away || 0) : 0,
      home_halftime: m.score && m.score.halfTime ? (m.score.halfTime.home || 0) : 0,
      away_halftime: m.score && m.score.halfTime ? (m.score.halfTime.away || 0) : 0
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── SCORERS ───────────────────────────────────────────────────

// GET /scorers/:code?season=2023&limit=10
app.get('/scorers/:code', async (req, res) => {
  try {
    let path = `/competitions/${req.params.code}/scorers`;
    const params = [];
    if (req.query.season) params.push(`season=${req.query.season}`);
    if (req.query.limit) params.push(`limit=${req.query.limit}`);
    if (params.length) path += '?' + params.join('&');

    const data = await footballFetch(path);
    const result = (data.scorers || []).map(s => ({
      player_id: s.player ? s.player.id : 0,
      player_name: s.player ? s.player.name : '',
      player_nationality: s.player ? (s.player.nationality || '') : '',
      team_id: s.team ? s.team.id : 0,
      team_name: s.team ? s.team.name : '',
      goals: s.goals || 0,
      assists: s.assists || 0,
      penalties: s.penalties || 0
    }));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── TEAM ──────────────────────────────────────────────────────

// GET /teams/:id
app.get('/teams/:id', async (req, res) => {
  try {
    const data = await footballFetch(`/teams/${req.params.id}`);
    res.json({
      id: data.id,
      name: data.name || '',
      short_name: data.shortName || '',
      tla: data.tla || '',
      crest: data.crest || '',
      address: data.address || '',
      website: data.website || '',
      founded: data.founded || 0,
      colors: data.clubColors || '',
      venue: data.venue || ''
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── HEALTH CHECK ──────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Football Data Proxy is running' });
});

app.listen(PORT, () => {
  console.log(`Football proxy running on port ${PORT}`);
});
