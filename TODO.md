# TODO

- [ ] Deploy `backend/` somewhere that can run a persistent Node process so the
      Lendable Mexico password gate (`/lendable-mexico`, `/api/unlock`) actually
      works on the live site. Netlify only serves `frontend/` as static files —
      it can't run `backend/server.js` as-is. Options:
  - Port `backend/server.js`'s logic into a Netlify Function (serverless, stays
    on Netlify, no new hosting account needed)
  - Or host `backend/` separately on a small Node host (Render, Railway, Fly)
    and point the frontend at it
- [ ] Until one of the above is done, `/lendable-mexico` only works when
      running `backend/server.js` locally (`cd backend && npm start`) — it is
      not reachable on juliamartins.netlify.app yet.
- [ ] Set a real `CASE_STUDY_PASSWORD` env var wherever `backend/` ends up
      hosted. It's no longer hardcoded in source (this repo is public) — if
      unset, the server generates a random one each start and logs it, so
      pick a real value before sharing the link with anyone.
