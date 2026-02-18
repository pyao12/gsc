/**
 * GitHub Stats Card - Self-hosted GitHub README stats service
 * Lightweight, fast, no rate limits when self-hosted
 */

const GITHUB_API = 'https://api.github.com';
const CACHE_TTL = 3600; // 1 hour

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers for browser access
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Routes
    if (url.pathname === '/') {
      return new Response(getHomepage(), {
        headers: { 'Content-Type': 'text/html', ...corsHeaders }
      });
    }

    if (url.pathname === '/api/stats') {
      return handleStats(request, env, corsHeaders);
    }

    if (url.pathname === '/api/languages') {
      return handleLanguages(request, env, corsHeaders);
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  }
};

async function handleStats(request, env, corsHeaders) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username');

  if (!username) {
    return new Response('Missing username parameter', {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    // Check cache first
    const cache = caches.default;
    const cacheKey = new Request(`https://cache/${username}/stats`, { method: 'GET' });
    let response = await cache.match(cacheKey);

    if (!response) {
      // Fetch from GitHub
      const stats = await fetchUserStats(username, env);
      const svg = generateStatsSVG(stats, url.searchParams);

      response = new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
          ...corsHeaders
        }
      });

      // Store in cache
      await cache.put(cacheKey, response.clone());
    }

    return response;
  } catch (error) {
    return new Response(generateErrorSVG(error.message), {
      status: 500,
      headers: { 'Content-Type': 'image/svg+xml', ...corsHeaders }
    });
  }
}

async function handleLanguages(request, env, corsHeaders) {
  const url = new URL(request.url);
  const username = url.searchParams.get('username');

  if (!username) {
    return new Response('Missing username parameter', {
      status: 400,
      headers: corsHeaders
    });
  }

  try {
    const cache = caches.default;
    const cacheKey = new Request(`https://cache/${username}/languages`, { method: 'GET' });
    let response = await cache.match(cacheKey);

    if (!response) {
      const languages = await fetchUserLanguages(username, env);
      const svg = generateLanguagesSVG(languages, url.searchParams);

      response = new Response(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': `public, max-age=${CACHE_TTL}`,
          ...corsHeaders
        }
      });

      await cache.put(cacheKey, response.clone());
    }

    return response;
  } catch (error) {
    return new Response(generateErrorSVG(error.message), {
      status: 500,
      headers: { 'Content-Type': 'image/svg+xml', ...corsHeaders }
    });
  }
}

async function fetchUserStats(username, env) {
  const token = env.GITHUB_TOKEN || '';
  const headers = {
    'User-Agent': 'github-stats-card',
    ...(token && { 'Authorization': `token ${token}` })
  };

  // Fetch user data
  const userRes = await fetch(`${GITHUB_API}/users/${username}`, { headers });
  if (!userRes.ok) {
    throw new Error(`User not found: ${username}`);
  }
  const user = await userRes.json();

  // Fetch user repos
  const reposRes = await fetch(`${GITHUB_API}/users/${username}/repos?per_page=100`, { headers });
  const repos = await reposRes.json();

  // Calculate stats
  const totalStars = repos.reduce((acc, repo) => acc + repo.stargazers_count, 0);
  const totalForks = repos.reduce((acc, repo) => acc + repo.forks_count, 0);
  const totalRepos = user.public_repos;

  return {
    username: user.login,
    name: user.name || user.login,
    totalStars,
    totalForks,
    totalRepos,
    followers: user.followers,
    following: user.following,
  };
}

async function fetchUserLanguages(username, env) {
  const token = env.GITHUB_TOKEN || '';
  const headers = {
    'User-Agent': 'github-stats-card',
    ...(token && { 'Authorization': `token ${token}` })
  };

  const reposRes = await fetch(`${GITHUB_API}/users/${username}/repos?per_page=100`, { headers });
  const repos = await reposRes.json();

  const languageStats = {};

  for (const repo of repos) {
    if (repo.fork) continue; // Skip forks

    const langRes = await fetch(repo.languages_url, { headers });
    const languages = await langRes.json();

    for (const [lang, bytes] of Object.entries(languages)) {
      languageStats[lang] = (languageStats[lang] || 0) + bytes;
    }
  }

  // Sort by bytes and get top 5
  const sorted = Object.entries(languageStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const total = sorted.reduce((acc, [, bytes]) => acc + bytes, 0);

  return sorted.map(([name, bytes]) => ({
    name,
    percentage: ((bytes / total) * 100).toFixed(1)
  }));
}

function generateStatsSVG(stats, params) {
  const theme = params.get('theme') || 'default';
  const colors = getThemeColors(theme);

  return `
<svg width="495" height="195" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { fill: ${colors.title}; font-family: 'Segoe UI', Arial, sans-serif; font-size: 18px; font-weight: 600; }
      .stat { fill: ${colors.text}; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; }
      .icon { fill: ${colors.icon}; }
    </style>
  </defs>

  <rect width="495" height="195" fill="${colors.bg}" stroke="${colors.border}" stroke-width="1" rx="4.5"/>

  <text x="25" y="35" class="title">${stats.name}'s GitHub Stats</text>

  <g transform="translate(25, 55)">
    <text y="20" class="stat">⭐ Total Stars: ${stats.totalStars.toLocaleString()}</text>
    <text y="45" class="stat">🔀 Total Forks: ${stats.totalForks.toLocaleString()}</text>
    <text y="70" class="stat">📦 Total Repos: ${stats.totalRepos}</text>
    <text y="95" class="stat">👥 Followers: ${stats.followers} | Following: ${stats.following}</text>
  </g>

  <text x="25" y="185" style="fill: ${colors.footer}; font-size: 10px; font-family: Arial;">
    Powered by RapidTools | Self-hosted stats service
  </text>
</svg>`.trim();
}

function generateLanguagesSVG(languages, params) {
  const theme = params.get('theme') || 'default';
  const colors = getThemeColors(theme);
  const langColors = getLanguageColors();

  let languagesHTML = '';
  languages.forEach((lang, i) => {
    const color = langColors[lang.name] || '#858585';
    languagesHTML += `
    <g transform="translate(0, ${i * 25})">
      <circle cx="10" cy="10" r="5" fill="${color}"/>
      <text x="20" y="14" class="lang">${lang.name}</text>
      <text x="420" y="14" class="percent">${lang.percentage}%</text>
    </g>`;
  });

  return `
<svg width="495" height="${80 + languages.length * 25}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { fill: ${colors.title}; font-family: 'Segoe UI', Arial, sans-serif; font-size: 18px; font-weight: 600; }
      .lang { fill: ${colors.text}; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; }
      .percent { fill: ${colors.text}; font-family: 'Segoe UI', Arial, sans-serif; font-size: 14px; font-weight: 600; }
    </style>
  </defs>

  <rect width="495" height="${80 + languages.length * 25}" fill="${colors.bg}" stroke="${colors.border}" stroke-width="1" rx="4.5"/>

  <text x="25" y="35" class="title">Most Used Languages</text>

  <g transform="translate(25, 50)">
    ${languagesHTML}
  </g>
</svg>`.trim();
}

function generateErrorSVG(message) {
  return `
<svg width="495" height="120" xmlns="http://www.w3.org/2000/svg">
  <rect width="495" height="120" fill="#fffefe" stroke="#e4e2e2" stroke-width="1" rx="4.5"/>
  <text x="25" y="45" style="fill: #ff0000; font-family: Arial; font-size: 16px; font-weight: 600;">Error</text>
  <text x="25" y="75" style="fill: #333; font-family: Arial; font-size: 14px;">${message}</text>
</svg>`.trim();
}

function getThemeColors(theme) {
  const themes = {
    default: {
      title: '#2f80ed',
      text: '#434d58',
      icon: '#4c71f2',
      bg: '#fffefe',
      border: '#e4e2e2',
      footer: '#888'
    },
    dark: {
      title: '#3fb950',
      text: '#c9d1d9',
      icon: '#58a6ff',
      bg: '#0d1117',
      border: '#30363d',
      footer: '#7d8590'
    },
    radical: {
      title: '#fe428e',
      text: '#a9fef7',
      icon: '#f8d847',
      bg: '#141321',
      border: '#382f45',
      footer: '#a9fef7'
    }
  };
  return themes[theme] || themes.default;
}

function getLanguageColors() {
  return {
    'JavaScript': '#f1e05a',
    'TypeScript': '#2b7489',
    'Python': '#3572A5',
    'Java': '#b07219',
    'Go': '#00ADD8',
    'Rust': '#dea584',
    'Ruby': '#701516',
    'PHP': '#4F5D95',
    'C++': '#f34b7d',
    'C': '#555555',
    'C#': '#178600',
    'Swift': '#ffac45',
    'Kotlin': '#F18E33',
    'Shell': '#89e051',
    'HTML': '#e34c26',
    'CSS': '#563d7c'
  };
}

function getHomepage() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Stats Card - Self-Hosted</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { color: #2f80ed; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; }
    pre { background: #f4f4f4; padding: 15px; border-radius: 5px; overflow-x: auto; }
    .example { margin: 20px 0; }
    .sponsor { background: #fffbeb; border: 1px solid #fcd34d; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>🎯 GitHub Stats Card</h1>
  <p>Self-hosted GitHub README stats service. Lightweight, fast, no rate limits.</p>

  <div class="sponsor">
    <strong>❤️ Like this project?</strong> Consider sponsoring via <a href="https://github.com/sponsors/builder-rapidtools">GitHub Sponsors</a>
  </div>

  <h2>Usage</h2>
  <p>Add to your GitHub README:</p>

  <h3>Stats Card</h3>
  <pre>&lt;img src="https://your-worker.workers.dev/api/stats?username=YOUR_USERNAME" alt="GitHub Stats" /&gt;</pre>

  <div class="example">
    <img src="/api/stats?username=torvalds" alt="Example Stats" />
  </div>

  <h3>Languages Card</h3>
  <pre>&lt;img src="https://your-worker.workers.dev/api/languages?username=YOUR_USERNAME" alt="Top Languages" /&gt;</pre>

  <div class="example">
    <img src="/api/languages?username=torvalds" alt="Example Languages" />
  </div>

  <h3>Themes</h3>
  <p>Add <code>?theme=dark</code> or <code>?theme=radical</code> parameter</p>

  <h2>Self-Hosting</h2>
  <p>1. Clone the repo: <code>git clone https://github.com/builder-rapidtools/github-stats-card</code></p>
  <p>2. Install: <code>npm install</code></p>
  <p>3. Deploy: <code>npm run deploy</code></p>
  <p>4. (Optional) Add GitHub token: <code>wrangler secret put GITHUB_TOKEN</code></p>

  <h2>Why Self-Host?</h2>
  <ul>
    <li>✅ No rate limits</li>
    <li>✅ Full control over caching</li>
    <li>✅ Deploy globally on edge network</li>
    <li>✅ Free tier: 100k requests/day</li>
  </ul>

  <p><a href="https://github.com/builder-rapidtools/github-stats-card">View on GitHub</a> | <a href="https://github.com/sponsors/builder-rapidtools">Sponsor this project</a></p>
</body>
</html>`;
}
