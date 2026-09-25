export default function SettingsLoading(){
  return <div className="settings-page" aria-busy="true">
    <div className="page-head settings-page-head">
      <div><div className="eyebrow">Werkplek · instellingen</div><div className="skeleton-line settings-skeleton-title" aria-hidden="true"/><div className="skeleton-line settings-skeleton-subtitle" aria-hidden="true"/></div>
    </div>
    <div className="settings-loading-grid" aria-hidden="true">
      <div className="panel settings-loading-panel"><div className="skeleton-line settings-skeleton-kicker"/><div className="skeleton-line settings-skeleton-panel-title"/><div className="settings-skeleton-fields"><div/><div/><div/><div/></div></div>
      <div className="panel settings-loading-panel"><div className="skeleton-line settings-skeleton-kicker"/><div className="skeleton-line settings-skeleton-panel-title"/><div className="settings-skeleton-fields"><div/><div/><div/><div/></div></div>
    </div>
    <span className="sr-only">Instellingen laden…</span>
  </div>
}
