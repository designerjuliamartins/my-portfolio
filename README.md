# my-portfolio ✨

Personal portfolio project built with Figma, Figma MCP and Claude Code.

In the era of design + AI for code, I decided to bring my portfolio to life combining what I love the most: design thinking and intelligent tools.

The design was crafted by my own AI: my brain 🧠  
And Claude helped transform it into beautiful, working code.

Design → Figma  
Bridge → Figma MCP  
Code → Claude Code  

Long live to designers who can now own more of the process ✦  
from idea → interface → experience → shipped product.

Deployed with Netlify 🚀  
Live at: https://juliamartins.netlify.app

Take a look if you'd like to see:
✨ my projects  
✨ my achievements  
✨ how I think about product & design

## Project structure

```
frontend/   → the public site (index.html) — this is what Netlify deploys
backend/    → small Node.js server that password-gates the Lendable Mexico
              case study (server.js + server-private/, which never gets
              served as a static file). Run locally with:
                cd backend && npm start
```

Note: Netlify only serves `frontend/` as static files. The password-gated
case study route (`/lendable-mexico`) needs the Node server running — it
doesn't work on the live Netlify URL yet, only when running `backend/`
locally or on a Node-capable host.
