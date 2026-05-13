import { test, expect } from '@playwright/test'
import { loginAs, logout } from './helpers/login.js'

test.describe('Authentification', () => {
  test('redirige vers Keycloak si non connecté', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL(/\/realms\/flotte\/protocol\/openid-connect\/auth/)
    await expect(page).toHaveURL(/keycloak|localhost:8080/)
  })

  test('login admin puis logout', async ({ page }) => {
    await loginAs(page, 'admin')
    await expect(page.locator('h1')).toContainText('Gestion de flotte')
    // Le username apparaît dans le header
    await expect(page.locator('header')).toContainText('admin')
    await logout(page)
    await expect(page).toHaveURL(/keycloak|localhost:8080|openid-connect/)
  })

  test('le rôle est affiché dans le header', async ({ page }) => {
    await loginAs(page, 'technicien')
    await expect(page.locator('header')).toContainText('technicien')
  })
})
