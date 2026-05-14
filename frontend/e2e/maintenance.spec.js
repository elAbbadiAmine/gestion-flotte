import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login.js'

test.describe('Page Maintenance — technicien', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'technicien')
    await page.waitForSelector('header a:has-text("Maintenance")')
    await page.click('a:has-text("Maintenance")')
    await page.waitForSelector('h2')
  })

  test('affiche la liste des interventions', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Maintenance')
    await expect(page.locator('table')).toBeVisible()
  })

  test('planifier une intervention', async ({ page }) => {
    await page.click('button:has-text("+ Planifier")')
    await expect(page.locator('h3')).toContainText('Planifier une intervention')

    // Vérifier que le select des véhicules est présent
    const selectVehicule = page.locator('select').first()
    await expect(selectVehicule).toBeVisible()

    // Sélectionner le premier vrai véhicule disponible (si aucun, le test passe silencieusement)
    const options = await selectVehicule.locator('option').all()
    if (options.length <= 1) {
      // Pas de véhicules en base — on ferme le modal et on skip
      await page.click('button:has-text("Annuler")')
      test.skip(true, 'Aucun véhicule en base')
    }

    await selectVehicule.selectOption({ index: 1 })
    await page.locator('select').nth(1).selectOption('revision')
    const today = new Date().toISOString().slice(0, 10)
    await page.fill('input[type="date"]', today)
    await page.fill('input[type="text"]:near(label:has-text("Technicien"))', 'Jean Dupont')
    await page.click('button[type="submit"]')

    await expect(page.locator('h3')).not.toBeVisible({ timeout: 5000 })
  })

  test('modifier le statut d\'une intervention existante', async ({ page }) => {
    const rows = page.locator('tbody tr')
    const count = await rows.count()
    if (count === 0) {
      test.skip(true, 'Aucune intervention en base')
    }
    await rows.first().locator('button:has-text("Modifier")').click()
    await expect(page.locator('h3')).toContainText("Modifier l'intervention")

    await page.selectOption('select:near(label:has-text("Statut"))', 'en_cours')
    await page.click('button:has-text("Enregistrer")')
    await expect(page.locator('h3')).not.toBeVisible()
  })
})
