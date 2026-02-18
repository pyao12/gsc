<div align="center">

<img src="logo.svg" alt="GitHub Stats Card" width="120" height="120" />

# GitHub Stats Card

![GitHub Stats Example](https://img.shields.io/badge/self--hosted-stats-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Cloudflare Workers](https://img.shields.io/badge/cloudflare-workers-orange)

### Lightweight, self-hosted GitHub README stats service

No rate limits • Global edge deployment • 1-click setup

[Live Demo](https://stats.rapidtools.dev) • [Quick Start](#quick-start) • [Sponsor](#sponsor)

</div>

---

## Why This Exists

The popular `github-readme-stats` service hits rate limits constantly (15M monthly requests, 5k/hour limit). This is a **lightweight alternative** designed for self-hosting with:

- ✅ **No rate limits** when self-hosted
- ✅ **Global edge deployment** via Cloudflare Workers
- ✅ **Smart caching** (1-hour TTL)
- ✅ **Free tier** (100k requests/day on Cloudflare)
- ✅ **1-click deploy** buttons
- ✅ **3 beautiful themes** (default, dark, radical)

## Demo

### Stats Card
![Stats Example](https://stats.rapidtools.dev/api/stats?username=torvalds)

### Languages Card
![Languages Example](https://stats.rapidtools.dev/api/languages?username=torvalds)

## Quick Start

### Option 1: Deploy to Cloudflare Workers (Recommended)

```bash
# Clone the repo
git clone https://github.com/builder-rapidtools/github-stats-card
cd github-stats-card

# Install dependencies
npm install

# Login to Cloudflare (if not already)
npx wrangler login

# Deploy (takes 30 seconds)
npm run deploy
```

Your service will be live at: `https://github-stats-card.YOUR-SUBDOMAIN.workers.dev`

### Option 2: One-Click Deploy

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/builder-rapidtools/github-stats-card)

## Usage

Add to your GitHub README:

### Stats Card

```markdown
![GitHub Stats](https://stats.rapidtools.dev/api/stats?username=YOUR_USERNAME)
```

### Languages Card

```markdown
![Top Languages](https://stats.rapidtools.dev/api/languages?username=YOUR_USERNAME)
```

**Live Demo:** https://stats.rapidtools.dev/

### Themes

Add `?theme=THEME_NAME` parameter:

- `default` - Clean blue theme
- `dark` - GitHub dark theme
- `radical` - Bold gradient theme

```markdown
![GitHub Stats](https://your-worker.workers.dev/api/stats?username=YOUR_USERNAME&theme=dark)
```

## Advanced: Add GitHub Token (Optional)

Increases API rate limits from 60/hour to 5000/hour:

```bash
# Generate token: https://github.com/settings/tokens (no scopes needed)
npx wrangler secret put GITHUB_TOKEN
# Paste your token when prompted
```

## How It Works

1. **Edge Deployment**: Runs on Cloudflare's global network (300+ cities)
2. **Smart Caching**: 1-hour cache per user (adjustable in `wrangler.toml`)
3. **GitHub API**: Fetches user stats and repo languages
4. **SVG Generation**: Returns beautiful SVG cards for README embedding

## API Endpoints

### `GET /api/stats?username=USERNAME`

Returns GitHub stats card.

**Parameters:**
- `username` (required) - GitHub username
- `theme` (optional) - Theme name (default, dark, radical)

### `GET /api/languages?username=USERNAME`

Returns top 5 languages card.

**Parameters:**
- `username` (required) - GitHub username
- `theme` (optional) - Theme name (default, dark, radical)

## Configuration

Edit `wrangler.toml`:

```toml
[vars]
CACHE_TTL = "3600"  # Cache duration in seconds (default: 1 hour)
```

## Development

```bash
# Install dependencies
npm install

# Run locally
npm run dev

# Test locally
curl http://localhost:8787/api/stats?username=torvalds

# Deploy
npm run deploy
```

## Cost

**Cloudflare Workers Free Tier:**
- 100,000 requests/day
- Covers ~3M requests/month
- $0 cost for most users

**Paid tier** (if needed): $5/month for 10M requests

## Why Self-Host?

The public `github-readme-stats` instance:
- ❌ Hits rate limits constantly (68k stars, 15M requests/month)
- ❌ Slow response times during peak hours
- ❌ No control over caching or uptime

Self-hosting gives you:
- ✅ Dedicated rate limits (5000/hour with token)
- ✅ Sub-100ms response times globally
- ✅ 99.99% uptime SLA
- ✅ Full control over features and themes

## Roadmap

- [ ] More themes (GitHub light, Dracula, Nord, etc.)
- [ ] Contribution graph card
- [ ] Trophy/achievement card
- [ ] Metrics dashboard for self-hosters
- [ ] Analytics (optional)

## Contributing

PRs welcome! Please open an issue first to discuss changes.

## Support This Project

If you find this project useful, consider supporting its development:

<div align="center">

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/rapidtools)

<a href="https://www.buymeacoffee.com/rapidtools" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 40px !important;width: 145px !important;" ></a>

</div>

**Other ways to support:**
- ⭐ Star this repo
- 🐛 Report bugs and suggest features
- 📢 Share with others who might benefit
- 💬 Contribute code or documentation

---

## License

MIT © RapidTools

---

<div align="center">

**Built by [RapidTools](https://rapidtools.dev)** • Self-hosted tools for developers

[Website](https://rapidtools.dev) • [More Projects](https://github.com/builder-rapidtools) • [Sponsor](https://github.com/sponsors/builder-rapidtools)

</div>
