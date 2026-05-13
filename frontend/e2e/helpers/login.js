// Credentials par défaut — surcharger via env si besoin
const USERS = {
  admin:       { username: process.env.KC_ADMIN_USER       ?? 'admin',       password: process.env.KC_ADMIN_PASS       ?? 'admin' },
  manager:     { username: process.env.KC_MANAGER_USER     ?? 'manager',     password: process.env.KC_MANAGER_PASS     ?? 'manager' },
  technicien:  { username: process.env.KC_TECH_USER        ?? 'technicien',  password: process.env.KC_TECH_PASS        ?? 'technicien' },
  utilisateur: { username: process.env.KC_USER_USER        ?? 'utilisateur', password: process.env.KC_USER_PASS        ?? 'utilisateur' },
}

/**
 * Navigue vers l'app, remplit le formulaire Keycloak et attend la redirection.
 * @param {import('@playwright/test').Page} page
 * @param {'admin'|'manager'|'technicien'|'utilisateur'} role
 */
export async function loginAs(page, role) {
  const { username, password } = USERS[role]
  await page.goto('/')
  await page.waitForURL(/\/realms\/flotte\/protocol\/openid-connect\/auth/)
  await page.fill('#username', username)
  await page.fill('#password', password)
  await page.click('#kc-login')
  // Glob '/**' ne matche pas la racine '/' — on utilise un regex
  await page.waitForURL(/localhost:5173/)
  await page.waitForLoadState('networkidle')
  await page.waitForSelector('h1')
}

export async function logout(page) {
  await page.click('button:has-text("Déconnexion")')
  await page.waitForURL(/\/realms\/flotte\/protocol\/openid-connect\/logout|\/realms\/flotte\/protocol\/openid-connect\/auth/)
}
