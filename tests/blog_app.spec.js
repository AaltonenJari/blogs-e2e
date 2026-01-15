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
      await expect(page.getByText('Matti Luukkainen logged in')).toBeVisible()
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

    test('user can delete their blog', async ({ page }) => {
      await ceaateBlog(page, 'Deleting blogs', 'Delete Author', 'http://delete.dev')
      await page.getByRole('button', { name: 'view' }).click()

      // Handle confirmation dialog on delete
      page.on('dialog', async dialog => {
        expect(dialog.type()).toBe('confirm')
        await dialog.accept()
      })

      const deleteButton = page.getByRole('button', { name: 'remove' })
      await deleteButton.click()
      await expect(page.getByText('Deleting blogs Delete Author')).not.toBeVisible()
    })

    test('users cannot delete blogs created by others', async ({ page, request }) => {
      // Create a blog with the first user
      await ceaateBlog(page, 'Other users blog', 'Other Author', 'http://other.dev')
      await page.getByRole('button', { name: 'logout' }).click() 
      // Create a second user
      await request.post('http://localhost:3003/api/users', {
        data: { 
          name: 'Second User',
          username: 'seconduser', 
          password: 'password123'
        }
      })  
      // Login as the second user
      await loginWith(page, 'seconduser', 'password123')
      await expect(page.getByText('Second User logged in')).toBeVisible()

      await page.getByRole('button', { name: 'view' }).click()
      const deleteButton = page.getByRole('button', { name: 'remove' })
      await expect(deleteButton).not.toBeVisible()
    })

    test ('only the user who created a blog can see the delete button', async ({ page, request }) => {
      // Create a blog with the first user
      await ceaateBlog(page, 'Visibility of delete button', 'Visibility Author', 'http://visibility.dev') 
      await page.getByRole('button', { name: 'logout' }).click()
      // Create a second user
      await request.post('http://localhost:3003/api/users', {
        data: { 
          name: 'Third User',
          username: 'thirduser', 
          password: 'password456'
        }
      })
      // Login as the second user
      await loginWith(page, 'thirduser', 'password456')
      await expect(page.getByText('Third User logged in')).toBeVisible()
      await page.getByRole('button', { name: 'view' }).click()
      const deleteButton = page.getByRole('button', { name: 'remove' })
      await expect(deleteButton).not.toBeVisible()
    })
    
  })
})