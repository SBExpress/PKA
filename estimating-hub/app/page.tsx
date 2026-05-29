export default function Home() {
  const tools = [
    {
      name: 'WireCalc',
      description: 'Wire sizing and conduit calculations',
      url: 'https://wirecalc.vercel.app/',
      icon: '⚡'
    },
    {
      name: 'V0 Site Calc',
      description: 'Quick site assessment & labor estimates',
      url: 'https://v0-site-calc.vercel.app/',
      icon: '📋'
    },
    {
      name: 'BackCalc',
      description: 'Reverse-engineer pricing breakdown',
      url: 'https://sbexpress.github.io/backcalc/',
      icon: '💰'
    },
    {
      name: 'PKA Dashboard',
      description: 'Manage bids and projects',
      url: 'https://pka-git-master-birnbaumshaya-gmailcoms-projects.vercel.app/dashboard',
      icon: '📊'
    }
  ]

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Estimating Hub</h1>
        <p>Your toolkit</p>
      </div>

      <div className="app-content">
        <div className="tools-list">
          {tools.map((tool) => (
            <a
              key={tool.name}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="tool-button"
            >
              <div className="tool-icon">{tool.icon}</div>
              <div className="tool-info">
                <h2>{tool.name}</h2>
                <p>{tool.description}</p>
              </div>
              <div className="tool-arrow">›</div>
            </a>
          ))}
        </div>
      </div>

      <div className="app-footer">
        <p>Electrical Estimating Suite</p>
      </div>
    </div>
  )
}
