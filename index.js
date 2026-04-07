const express = require('express');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.FOOTBALL_API_KEY || '57df377dcf3548ce9f030b7333b1422a';
const BASE_URL = 'http://api.football-data.org/v4';

async function footballFetch(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-Auth-Token': API_KEY }
  });
  return response.json();
}

app.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Returns ONE competition by index: ?index=0
app.get('/competitions', async (req, res) => {
  try {
    const index = parseInt(req.query.index) || 0;
    const data = await footballFetch('/competitions');
    const list = data.competitions || [];
    const item = list[index] || {};
    res.json({
      total: list.length,
      index,
      id: item.id || 0,
      name: item.name || '',
      code: item.code || '',
      type: item.type || '',
      emblem: item.emblem || '',
      area_name: item.area ? item.area.name : ''
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Returns ONE standings row: ?code=PL&index=0&season=2023
app.get('/standings', async (req, res) => {
  try {
    const code = req.query.code || 'PL';
    const index = parseInt(req.query.index) || 0;
    let path = `/competitions/${code}/standings`;
    if (req.query.season) path += `?season=${req.query.season}`;
    const data = await footballFetch(path);
    const table = (data.standings && data.standings[0]) ? data.standings[0].table : [];
    const row = table[index] || {};
    res.json({
      total: table.length,
      index,
      position: row.position || 0,
      team_id: row.team ? row.team.id : 0,
      team_name: row.team ? row.team.name : '',
      team_short: row.team ? row.team.shortName : '',
      played: row.playedGames || 0,
      won: row.won || 0,
      draw: row.draw || 0,
      lost: row.lost || 0,
      points: row.points || 0,
      goals_for: row.goalsFor || 0,
      goals_against: row.goalsAgainst || 0,
      goal_diff: row.goalDifference || 0
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Returns ONE match: ?code=PL&index=0&matchday=1&status=FINISHED
app.get('/matches', async (req, res) => {
  try {
    const code = req.query.code || 'PL';
    const index = parseInt(req.query.index) || 0;
    let path = `/competitions/${code}/matches`;
    const params = [];
    if (req.query.season) params.push(`season=${req.query.season}`);
    if (req.query.matchday) params.push(`matchday=${req.query.matchday}`);
    if (req.query.status) params.push(`status=${req.query.status}`);
    if (req.query.dateFrom) params.push(`dateFrom=${req.query.dateFrom}`);
    if (req.query.dateTo) params.push(`dateTo=${req.query.dateTo}`);
    if (params.length) path += '?' + params.join('&');
    const data = await footballFetch(path);
    const list = data.matches || [];
    const m = list[index] || {};
    res.json({
      total: list.length,
      index,
      id: m.id || 0,
      utc_date: m.utcDate || '',
      status: m.status || '',
      matchday: m.matchday || 0,
      home_team_id: m.homeTeam ? m.homeTeam.id : 0,
      home_team_name: m.homeTeam ? m.homeTeam.name : '',
      away_team_id: m.awayTeam ? m.awayTeam.id : 0,
      away_team_name: m.awayTeam ? m.awayTeam.name : '',
      winner: m.score ? (m.score.winner || '') : '',
      home_score: m.score && m.score.fullTime ? (m.score.fullTime.home || 0) : 0,
      away_score: m.score && m.score.fullTime ? (m.score.fullTime.away || 0) : 0
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Returns ONE scorer: ?code=PL&index=0
app.get('/scorers', async (req, res) => {
  try {
    const code = req.query.code || 'PL';
    const index = parseInt(req.query.index) || 0;
    let path = `/competitions/${code}/scorers`;
    const params = [];
    if (req.query.season) params.push(`season=${req.query.season}`);
    if (req.query.limit) params.push(`limit=${req.query.limit}`);
    if (params.length) path += '?' + params.join('&');
    const data = await footballFetch(path);
    const list = data.scorers || [];
    const s = list[index] || {};
    res.json({
      total: list.length,
      index,
      player_id: s.player ? s.player.id : 0,
      player_name: s.player ? s.player.name : '',
      player_nationality: s.player ? (s.player.nationality || '') : '',
      team_id: s.team ? s.team.id : 0,
      team_name: s.team ? s.team.name : '',
      goals: s.goals || 0,
      assists: s.assists || 0,
      penalties: s.penalties || 0
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Returns single team: ?id=57
app.get('/teams', async (req, res) => {
  try {
    const id = req.query.id || '57';
    const data = await footballFetch(`/teams/${id}`);
    res.json({
      id: data.id || 0,
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
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
