import React from 'react';

export default function LandingPage({ onLoginClick }) {
  return (
    <div className="landing-shell">
      <nav className="landing-nav">
        <div className="landing-brand">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
          </svg>
          Signal Desk
        </div>
        <button className="glass-btn" onClick={onLoginClick}>Login to Workspace</button>
      </nav>

      <header className="landing-hero">
        <div className="hero-badge">New: Chronos-Bolt AI Integration Live</div>
        <h1 className="hero-title">Intelligent Trading, <br/>Powered by AI</h1>
        <p className="hero-subtitle">
          Advanced charting, real-time sentiment analysis, and machine learning models 
          seamlessly integrated into a professional-grade terminal.
        </p>
        <div className="hero-actions">
            <button className="hero-cta" onClick={onLoginClick}>Launch Platform</button>
            <button className="glass-btn hero-sec-cta" onClick={onLoginClick}>Explore Features</button>
        </div>
      </header>

      <section className="preview-section">
          <div className="preview-window">
              <div className="preview-header">
                  <div className="dot red"></div><div className="dot yellow"></div><div className="dot green"></div>
                  <div className="preview-tabs">
                      <span className="active">BTC/USD</span>
                      <span>ETH/USD</span>
                      <span>AI Forecasts</span>
                  </div>
              </div>
              <div className="preview-body">
                  <div className="preview-sidebar">
                      <div className="mock-title">Watchlist</div>
                      <div className="mock-row"><span className="mock-sym">BTC</span><span className="mock-price mock-up">$68,415</span></div>
                      <div className="mock-row"><span className="mock-sym">ETH</span><span className="mock-price mock-down">$3,820</span></div>
                      <div className="mock-row"><span className="mock-sym">SOL</span><span className="mock-price mock-up">$172.4</span></div>
                      <div className="mock-row"><span className="mock-sym">NVDA</span><span className="mock-price mock-up">$121.2</span></div>
                      
                      <div className="mock-title" style={{marginTop: 24}}>AI Sentiment</div>
                      <div className="mock-score">
                          <span className="score-val mock-up">84</span>
                          <span className="score-lbl mock-up">BULLISH</span>
                      </div>
                      <div className="mock-bar-bg"><div className="mock-bar-fill" style={{width: '84%'}}></div></div>
                  </div>
                  <div className="preview-chart">
                      <div className="chart-grid"></div>
                      <div className="chart-header">
                          <span className="ch-sym">BTC/USD</span>
                          <span className="ch-val mock-up">68,415.50</span>
                          <span className="ch-chg mock-up">+2.15%</span>
                      </div>
                      <div className="chart-candles">
                          <div className="candle mock-up" style={{left: '10%', bottom: '20%', height: '40px'}}></div>
                          <div className="candle mock-down" style={{left: '17%', bottom: '25%', height: '30px'}}></div>
                          <div className="candle mock-up" style={{left: '24%', bottom: '20%', height: '60px'}}></div>
                          <div className="candle mock-up" style={{left: '31%', bottom: '40%', height: '50px'}}></div>
                          <div className="candle mock-down" style={{left: '38%', bottom: '45%', height: '80px'}}></div>
                          <div className="candle mock-up" style={{left: '45%', bottom: '30%', height: '45px'}}></div>
                          <div className="candle mock-up" style={{left: '52%', bottom: '40%', height: '55px'}}></div>
                          <div className="candle mock-up" style={{left: '59%', bottom: '55%', height: '40px'}}></div>
                          <div className="candle mock-down" style={{left: '66%', bottom: '65%', height: '70px'}}></div>
                          <div className="candle mock-up" style={{left: '73%', bottom: '50%', height: '60px'}}></div>
                          <div className="candle mock-up" style={{left: '80%', bottom: '65%', height: '90px'}}></div>
                          <div className="candle mock-up" style={{left: '87%', bottom: '85%', height: '110px'}}></div>
                      </div>
                      <div className="chart-line"></div>
                  </div>
                  <div className="preview-orderbook">
                      <div className="mock-title">Order Book</div>
                      <div className="ob-headers"><span>Price</span><span>Amount</span></div>
                      <div className="ob-asks">
                          <div className="ob-row"><span className="mock-down">68,420.00</span><span>1.24</span></div>
                          <div className="ob-row"><span className="mock-down">68,419.50</span><span>0.55</span></div>
                          <div className="ob-row"><span className="mock-down">68,418.00</span><span>3.10</span></div>
                          <div className="ob-row"><span className="mock-down">68,416.20</span><span>0.80</span></div>
                      </div>
                      <div className="ob-spread">68,415.50</div>
                      <div className="ob-bids">
                          <div className="ob-row"><span className="mock-up">68,414.00</span><span>2.15</span></div>
                          <div className="ob-row"><span className="mock-up">68,413.50</span><span>1.05</span></div>
                          <div className="ob-row"><span className="mock-up">68,411.00</span><span>4.20</span></div>
                          <div className="ob-row"><span className="mock-up">68,410.00</span><span>0.60</span></div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      <section className="stats-section">
          <div className="stat-box">
              <h3>2M+</h3>
              <p>Daily AI Predictions</p>
          </div>
          <div className="stat-box">
              <h3>99.9%</h3>
              <p>Uptime SLA</p>
          </div>
          <div className="stat-box">
              <h3>&lt;50ms</h3>
              <p>Execution Latency</p>
          </div>
          <div className="stat-box">
              <h3>15+</h3>
              <p>Supported Exchanges</p>
          </div>
      </section>

      <section className="features-section">
          <div className="section-head">
              <h2>A Complete Arsenal for Traders</h2>
              <p>Everything you need to analyze, predict, and execute, all in one unified environment.</p>
          </div>
          <div className="features-grid">
            <div className="feat-card">
              <div className="feat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
              </div>
              <div className="feat-title">AI Predictive Modeling</div>
              <div className="feat-desc">Leverage Chronos-Bolt and advanced statistical fallback models to forecast market movements with unprecedented accuracy.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
              </div>
              <div className="feat-title">Advanced Technicals</div>
              <div className="feat-desc">Professional candlestick charts with real-time SMA, Bollinger Bands, and automated support/resistance plotting.</div>
            </div>
            <div className="feat-card">
              <div className="feat-icon">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              </div>
              <div className="feat-title">News & Sentiment</div>
              <div className="feat-desc">Process breaking news with FinBERT sentiment analysis, giving you the edge before the market even reacts.</div>
            </div>
          </div>
      </section>

      <section className="deep-dive">
          <div className="dive-content">
              <h2>Institutional Grade Architecture</h2>
              <p>Built on a high-performance stack, Signal Desk ensures ultra-low latency data streaming and rendering. The platform utilizes state-of-the-art machine learning models securely and efficiently.</p>
              <ul>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Real-time WebSocket streaming</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Fully customizable dashboard layouts</li>
                  <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg> Comprehensive backtesting engine</li>
              </ul>
          </div>
          <div className="dive-visual">
              <div className="code-block">
                  <pre><code>{`from backend.models import chronos

def predict_trend(symbol, horizon=30):
    # Load pretrained AI forecaster
    model = chronos.load("bolt-v1")
    
    # Fetch historical OHLCV data
    data = fetch_ohlcv(symbol, period="1y")
    
    # Generate predictions
    forecast = model.predict(data, horizon)
    return forecast`}</code></pre>
              </div>
          </div>
      </section>

      <footer className="landing-footer">
          <div className="footer-brand">
             <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8}}>
               <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
             </svg>
             Signal Desk
          </div>
          <div className="footer-links">
              <span>Terms of Service</span>
              <span>Privacy Policy</span>
              <span>API Documentation</span>
          </div>
          <div className="footer-copy">&copy; 2026 AI Trading Platform. All rights reserved.</div>
      </footer>
    </div>
  );
}
