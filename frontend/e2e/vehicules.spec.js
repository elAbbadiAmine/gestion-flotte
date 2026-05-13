import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login.js'

test.describe('Page Véhicules — admin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'admin')
    await page.waitForSelector('header a:has-text("Véhicules")')
    await page.click('a:has-text("Véhicules")')
    await page.waitForSelector('h2')
  })

  test('affiche la liste des véhicules', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Véhicules')
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('thead th')).toHaveCount(7) // 6 colonnes + Actions
  })

  test('bouton + Ajouter visible pour admin', async ({ page }) => {
    await expect(page.locator('button:has-text("+ Ajouter")')).toBeVisible()
  })

  test('créer un véhicule puis le supprimer', async ({ page }) => {
    const immat = `TEST-${Date.now()}`

    // Création
    await page.click('button:has-text("+ Ajouter")')
    await page.fill('input[name="immatriculation"]', immat)
    await page.fill('input[name="marque"]', 'Renault')
    await page.fill('input[name="modele"]', 'Clio')
    await page.fill('input[name="annee"]', '2023')
    await page.fill('input[name="kilometrage"]', '12000')
    await page.selectOption('select[name="statut"]', 'disponible')
    await page.click('button:has-text("Créer")')

    // Vérifier qu'il apparaît dans la liste
    await expect(page.locator(`td:has-text("${immat}")`)).toBeVisible()

    // Suppression — écouter le dialog AVANT le clic (window.confirm est synchrone)
    const row = page.locator('tr', { has: page.locator(`td:has-text("${immat}")`) })
    page.once('dialog', dialog => dialog.accept())
    await row.locator('button:has-text("Supprimer")').click()
    await expect(page.locator(`td:has-text("${immat}")`)).not.toBeVisible()
  })

  test('modifier un véhicule existant', async ({ page }) => {
    // On prend le premier véhicule de la liste
    const firstRow = page.locator('tbody tr').first()
    await firstRow.locator('button:has-text("Modifier")').click()
    await expect(page.locator('h3')).toContainText('Modifier le véhicule')

    // Changer le kilométrage
    const kmInput = page.locator('input[name="kilometrage"]')
    await kmInput.fill('99999')
    await page.click('button:has-text("Enregistrer")')

    // Le modal se ferme
    await expect(page.locator('h3')).not.toBeVisible()
  })
})
