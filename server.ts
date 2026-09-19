showVouch(s.currentWinner, isVouchDone, s.vouches, s.requiredVouches);
  } else {
    showVouch(null, false, 0, 1);
  }
}
let lastState={seconds:28,participants:[],currentWinner:null,vouches:0,requiredVouches:1,delay:30,delaySeconds:0,isSnipeDelay:false,minimum:0,vouchesBalance:945};
render(lastState);

// Sync via BroadcastChannel
const bc=new BroadcastChannel('tiktok-auction-overlay');
bc.onmessage=e=>{lastState={...lastState,...(e.data||{})};render(lastState)};

// Also sync via Server-Sent Events (SSE) for remote OBS browser sources
try {
  const es=new EventSource('/api/tiktok/events');
  es.addEventListener('auctionState', e => {
    try {
      const data = JSON.parse(e.data);
      lastState = { ...lastState, ...data };
      render(lastState);
    } catch(err){}
  });
} catch(err){}
</script>
</body>
</html>`;
  res.setHeader('Content-Type', 'text/html');
  res.send(overlayHtml);
});

// Broadcast auction state from dashboard to SSE clients
app.post('/api/auction/sync', (req: Request, res: Response) => {
  broadcastSse('auctionState', req.body);
  res.json({ success: true });
});

// Integrate Vite
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
