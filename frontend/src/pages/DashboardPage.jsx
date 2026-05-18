import { useQuery, gql } from '@apollo/client'

const GET_VEHICULES = gql`
  query DashVehicules {
    vehicules { id statut }
  }
`
const GET_CONDUCTEURS = gql`
  query DashConducteurs {
    conducteurs { id statut vehiculeId }
  }
`
const GET_MAINTENANCES = gql`
  query DashMaintenances {
    maintenances { id statut datePlanifiee dateReelle cout }
  }
`
const GET_ALERTES = gql`
  query DashAlertes {
    alertes { id niveau lu }
  }
`

function count(arr, pred) {
  return arr.filter(pred).length
}

function sumCout(arr) {
  return arr.reduce((s, m) => s + (parseFloat(m.cout) || 0), 0)
}

function isCeMois(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

function StatBar({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{value}</span>
      </div>
      <div style={{ background: 'var(--border)', borderRadius: 4, height: 6 }}>
        <div style={{ background: color, borderRadius: 4, height: 6, width: `${pct}%`, transition: 'width 0.4s' }} />
      </div>
    </div>
  )
}

function KpiCard({ title, icon, children }) {
  return (
    <div style={{
      background: 'var(--card-bg)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '20px 24px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function BigNumber({ value, sub, color }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 36, fontWeight: 800, color: color ?? 'var(--text)', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>
    </div>
  )
}

export function DashboardPage() {
  const { data: dv } = useQuery(GET_VEHICULES, { fetchPolicy: 'network-only' })
  const { data: dc } = useQuery(GET_CONDUCTEURS, { fetchPolicy: 'network-only' })
  const { data: dm } = useQuery(GET_MAINTENANCES, { fetchPolicy: 'network-only' })
  const { data: da } = useQuery(GET_ALERTES, { fetchPolicy: 'network-only' })

  const vehicules     = dv?.vehicules     ?? []
  const conducteurs   = dc?.conducteurs   ?? []
  const maintenances  = dm?.maintenances  ?? []
  const alertes       = da?.alertes       ?? []

  // Véhicules
  const vTotal        = vehicules.length
  const vDisponible   = count(vehicules, v => v.statut === 'disponible')
  const vMission      = count(vehicules, v => v.statut === 'en_mission')
  const vMaintenance  = count(vehicules, v => v.statut === 'en_maintenance')
  const vHors         = count(vehicules, v => v.statut === 'hors_service')

  // Conducteurs
  const cTotal        = conducteurs.length
  const cActif        = count(conducteurs, c => c.statut === 'actif')
  const cMission      = count(conducteurs, c => c.vehiculeId != null)
  const cInactif      = count(conducteurs, c => c.statut === 'inactif')
  const cSuspendu     = count(conducteurs, c => c.statut === 'suspendu')

  // Maintenance du mois
  const mMois         = maintenances.filter(m => isCeMois(m.datePlanifiee) || isCeMois(m.dateReelle))
  const mTotal        = mMois.length
  const mPlanifiee    = count(mMois, m => m.statut === 'planifiee')
  const mEnCours      = count(mMois, m => m.statut === 'en_cours')
  const mTerminee     = count(mMois, m => m.statut === 'terminee')
  const mAnnulee      = count(mMois, m => m.statut === 'annulee')
  const mCout         = sumCout(mMois.filter(m => m.statut === 'terminee'))

  // Alertes
  const aNonLues      = count(alertes, a => !a.lu)
  const aCritique     = count(alertes, a => a.niveau === 'critique' && !a.lu)
  const aWarning      = count(alertes, a => a.niveau === 'warning' && !a.lu)
  const aInfo         = count(alertes, a => a.niveau === 'info' && !a.lu)

  const now = new Date()
  const moisLabel = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  return (
    <div>
      <div className="page-header">
        <h2 className="page-title">Tableau de bord</h2>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 24 }}>

        {/* Véhicules */}
        <KpiCard title="Véhicules" icon="🚗">
          <BigNumber value={vTotal} sub="véhicules enregistrés" />
          <StatBar label="Disponibles"     value={vDisponible}  total={vTotal} color="var(--success-text)" />
          <StatBar label="En mission"      value={vMission}     total={vTotal} color="var(--info-text)" />
          <StatBar label="En maintenance"  value={vMaintenance} total={vTotal} color="var(--warn-text)" />
          <StatBar label="Hors service"    value={vHors}        total={vTotal} color="var(--gray-text)" />
        </KpiCard>

        {/* Conducteurs */}
        <KpiCard title="Conducteurs" icon="👤">
          <BigNumber value={cTotal} sub="conducteurs enregistrés" />
          <StatBar label="Actifs"          value={cActif}    total={cTotal} color="var(--success-text)" />
          <StatBar label="En mission"      value={cMission}  total={cTotal} color="var(--info-text)" />
          <StatBar label="Inactifs"        value={cInactif}  total={cTotal} color="var(--danger-text)" />
          <StatBar label="Suspendus"       value={cSuspendu} total={cTotal} color="var(--danger-text)" />
        </KpiCard>

        {/* Maintenance */}
        <KpiCard title={`Maintenance — ${moisLabel}`} icon="🔧">
          <BigNumber
            value={mTotal}
            sub={mCout > 0 ? `${mCout.toLocaleString('fr-FR')} € de coût terminées` : 'interventions ce mois'}
            color="var(--primary)"
          />
          <StatBar label="Planifiées"  value={mPlanifiee} total={mTotal || 1} color="var(--warn-text)" />
          <StatBar label="En cours"    value={mEnCours}   total={mTotal || 1} color="var(--info-text)" />
          <StatBar label="Terminées"   value={mTerminee}  total={mTotal || 1} color="var(--success-text)" />
          <StatBar label="Annulées"    value={mAnnulee}   total={mTotal || 1} color="var(--gray-text)" />
        </KpiCard>

        {/* Alertes */}
        <KpiCard title="Alertes" icon="🔔">
          <BigNumber
            value={aNonLues}
            sub="alertes non lues"
            color={aCritique > 0 ? 'var(--danger-text)' : aNonLues > 0 ? 'var(--warn-text)' : 'var(--success-text)'}
          />
          <StatBar label="Critiques"       value={aCritique} total={aNonLues || 1} color="var(--danger-text)" />
          <StatBar label="Avertissements"  value={aWarning}  total={aNonLues || 1} color="var(--warn-text)" />
          <StatBar label="Informations"    value={aInfo}     total={aNonLues || 1} color="var(--info-text)" />
        </KpiCard>

      </div>

      {/* Taux de disponibilité */}
      {vTotal > 0 && (
        <div style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '20px 24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Taux de disponibilité opérationnelle</div>
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <Gauge
              label="Véhicules opérationnels"
              value={vDisponible + vMission}
              total={vTotal}
              color="var(--success-text)"
            />
            <Gauge
              label="Conducteurs actifs"
              value={cActif}
              total={cTotal}
              color="var(--info-text)"
            />
            <Gauge
              label="Véhicules en mission maintenant"
              value={vMission}
              total={vTotal}
              color="var(--primary)"
            />
          </div>
        </div>
      )}
    </div>
  )
}

function Gauge({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div style={{ minWidth: 160 }}>
      <div style={{ fontSize: 32, fontWeight: 800, color }}>{pct}%</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
        {value} / {total}
      </div>
    </div>
  )
}
