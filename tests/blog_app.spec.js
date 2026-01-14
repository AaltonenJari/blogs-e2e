const { test, expect, beforeEach, describe } = require('@playwright/test')
const { loginWith, ceaateBlog } = require('./helper')

describe('Blog app', () => {
  beforeEach(async ({ page, request }) => {
    await request.post('http://localhost:3003/api/testing/reset')
    await request.post('http://localhost:3003/api/users', {
      data: {
        name: 'Matti Luukkainen',
        username: 'mluukkai',
        password: 'salainen'
      }
    })

    await page.goto('http://localhost:3000')
  })

  test('Login form is shown', async ({ page }) => {
	  await page.getByRole('button', { name: 'login' }).click()
	
    const locator = page.getByText('Log in to application')
    await expect(locator).toBeVisible()
  })

  describe('Login', () => {
    test('succeeds with correct credentials', async ({ page }) => {
      await loginWith(page, 'mluukkai', 'salainen')
      await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()
    })

    test('fails with wrong credentials', async ({ page }) => {
      await loginWith(page, 'mluukkai', 'wrong')
      await expect(page.getByText('wrong username or password')).toBeVisible()
    })
  })

  describe('When logged in', () => {
    beforeEach(async ({ page }) => {
      await loginWith(page, 'mluukkai', 'salainen')
    })

    test('a new blog can be created', async ({ page }) => {
      await ceaateBlog(page, 'Testing with Playwright', 'Playwright Author', 'http://playwright.dev')
      await expect(page.getByText('Testing with Playwright Playwright Author')).toBeVisible()
    })

    test('user can like a blog', async ({ page }) => {
      await ceaateBlog(page, 'Liking blogs', 'Like Author', 'http://like.dev')
      await page.getByRole('button', { name: 'view' }).click()
      const likeButton = page.getByRole('button', { name: 'like' })
      await likeButton.click()
      const likes = page.getByText('likes 1')
      await expect(likes).toBeVisible()
    })
  })
})