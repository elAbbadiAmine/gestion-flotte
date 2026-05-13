import { test, expect } from '@playwright/test'
import { loginAs } from './helpers/login.js'

test.describe('RBAC — utilisateur (lecture seule)', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'utilisateur')
    await page.waitForSelector('header')
  })

  test('pas de bouton Ajouter sur Véhicules', async ({ page }) => {
    await page.click('a:has-text("Véhicules")')
    await page.waitForSelector('h2')
    await expect(page.locator('button:has-text("+ Ajouter")')).not.toBeVisible()
  })

  test('pas de bouton Modifier/Supprimer sur Véhicules', async ({ page }) => {
    await page.click('a:has-text("Véhicules")')
    await page.waitForSelector('table')
    await expect(page.locator('button:has-text("Modifier")')).not.toBeVisible()
    await expect(page.locator('button:has-text("Supprimer")')).not.toBeVisible()
  })

  test('pas de bouton Ajouter sur Conducteurs', async ({ page }) => {
    await page.click('a:has-text("Conducteurs")')
    await page.waitForSelector('h2')
    await expect(page.locator('button:has-text("+ Ajouter")')).not.toBeVisible()
  })

  test('pas de bouton Planifier sur Maintenance', async ({ page }) => {
    await page.click('a:has-text("Maintenance")')
    await page.waitForSelector('h2')
    await expect(page.locator('button:has-text("+ Planifier")')).not.toBeVisible()
  })
})

test.describe('RBAC — technicien', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, 'technicien')
    await page.waitForSelector('header')
  })

  test('pas de bouton Ajouter sur Véhicules', async ({ page }) => {
    await page.click('a:has-text("Véhicules")')
    await page.waitForSelector('h2')
    await expect(page.locator('button:has-text("+ Ajouter")')).not.toBeVisible()
  })

  test('bouton Planifier visible sur Maintenance', async ({ page }) => {
    await page.click('a:has-text("Maintenance")')
    await page.waitForSelector('h2')
    await expect(page.locator('button:has-text("+ Planifier")')).toBeVisible()
  })
})
